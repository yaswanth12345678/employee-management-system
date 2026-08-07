import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaginatedList } from '../src/hooks/usePaginatedList';
import { useCrudPage } from '../src/hooks/useCrudPage';
import { SnackbarProvider } from '../src/contexts/SnackbarContext';

// The feature hook is tested through its real code with only the API module mocked.
vi.mock('../src/features/projects/api/projectsApi', () => ({ list: vi.fn() }));
import * as projectsApi from '../src/features/projects/api/projectsApi';
import { useProjects } from '../src/features/projects/hooks/useProjects';

const page = <T,>(data: T[], total: number) => ({ data, total });

// ── usePaginatedList: the shared pagination + stale-response core ───────────────────────────────
describe('usePaginatedList', () => {
  it('fetches the first page (1, 10) on mount and exposes data + total', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([{ id: 'a' }], 5));
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchPage).toHaveBeenCalledWith(1, 10);
    expect(result.current.data).toEqual([{ id: 'a' }]);
    expect(result.current.total).toBe(5);
  });

  it('refetches when the page changes', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([], 0));
    const { result } = renderHook(() => usePaginatedList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith(3, 10));
  });

  it('setLimit resets to page 1', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([], 0));
    const { result } = renderHook(() => usePaginatedList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(4));
    await waitFor(() => expect(result.current.page).toBe(4));

    act(() => result.current.setLimit(25));
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(fetchPage).toHaveBeenLastCalledWith(1, 25);
  });

  it('surfaces an error message when the fetch rejects', async () => {
    const fetchPage = vi.fn().mockRejectedValue({ message: 'boom' });
    const { result } = renderHook(() => usePaginatedList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('ignores a stale in-flight response when the fetcher changes (stale-response guard)', async () => {
    let resolveStale!: (v: { data: unknown[]; total: number }) => void;
    const stale = new Promise<{ data: unknown[]; total: number }>((r) => {
      resolveStale = r;
    });
    const staleFetch = vi.fn(() => stale);
    const freshFetch = vi.fn().mockResolvedValue(page([{ id: 'fresh' }], 1));

    const { result, rerender } = renderHook(
      ({ fp }: { fp: (p: number, l: number) => Promise<{ data: unknown[]; total: number }> }) =>
        usePaginatedList(fp),
      { initialProps: { fp: staleFetch } },
    );

    // Swap the fetcher (as a filter change does) while the first request is still pending.
    rerender({ fp: freshFetch });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'fresh' }]));

    // Resolving the superseded request must NOT clobber the fresh data.
    await act(async () => {
      resolveStale(page([{ id: 'stale' }], 999));
    });
    expect(result.current.data).toEqual([{ id: 'fresh' }]);
    expect(result.current.total).toBe(1);
  });
});

// ── useProjects: a feature hook built on the core (filter → page reset, setter stability) ────────
describe('useProjects (feature hook on usePaginatedList)', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.list).mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });
  });

  it('fetches with default (empty) filters on mount', async () => {
    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(projectsApi.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      status: undefined,
      priority: undefined,
    });
  });

  it('changing a filter resets to page 1 and re-queries with the filter applied', async () => {
    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.setStatus('active'));
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(projectsApi.list).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      status: 'active',
      priority: undefined,
    });
  });

  it('keeps filter setters referentially stable across renders (SearchBar debounce relies on this)', async () => {
    const { result, rerender } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.setSearch;
    rerender();
    expect(result.current.setSearch).toBe(before);
  });
});

// ── useCrudPage: the shared create/edit/delete orchestration ─────────────────────────────────────
describe('useCrudPage', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <SnackbarProvider>{children}</SnackbarProvider>;

  interface Row {
    id: string;
    name: string;
  }
  function makeList(data: Row[], pageNum: number) {
    return { data, page: pageNum, setPage: vi.fn(), refetch: vi.fn().mockResolvedValue(undefined) };
  }

  it('submit() creates when not editing, then closes the form and refetches', async () => {
    const list = makeList([{ id: '1', name: 'a' }], 1);
    const create = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () => useCrudPage<Row, { name: string }>({ entityName: 'Thing', list, create, update, remove: vi.fn() }),
      { wrapper },
    );

    act(() => result.current.openCreate());
    expect(result.current.formOpen).toBe(true);
    expect(result.current.editing).toBeNull();

    await act(async () => {
      await result.current.submit({ name: 'x' });
    });
    expect(create).toHaveBeenCalledWith({ name: 'x' });
    expect(update).not.toHaveBeenCalled();
    expect(list.refetch).toHaveBeenCalled();
    expect(result.current.formOpen).toBe(false);
  });

  it('submit() updates the edited row', async () => {
    const list = makeList([{ id: '1', name: 'a' }], 1);
    const row = { id: '7', name: 'edit-me' };
    const update = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () => useCrudPage<Row, { name: string }>({ entityName: 'Thing', list, create: vi.fn(), update, remove: vi.fn() }),
      { wrapper },
    );

    act(() => result.current.openEdit(row));
    expect(result.current.editing).toBe(row);

    await act(async () => {
      await result.current.submit({ name: 'y' });
    });
    expect(update).toHaveBeenCalledWith(row, { name: 'y' });
  });

  it('confirmDelete() steps back a page when deleting the last row of a non-first page', async () => {
    const list = makeList([{ id: '1', name: 'only' }], 2); // one row left, on page 2
    const remove = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () => useCrudPage<Row, { name: string }>({ entityName: 'Thing', list, create: vi.fn(), update: vi.fn(), remove }),
      { wrapper },
    );

    act(() => result.current.requestDelete({ id: '1', name: 'only' }));
    expect(result.current.toDelete).toEqual({ id: '1', name: 'only' });

    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(remove).toHaveBeenCalledWith({ id: '1', name: 'only' });
    expect(list.setPage).toHaveBeenCalledWith(1); // clamped 2 → 1
    expect(list.refetch).not.toHaveBeenCalled(); // clamp path skips the refetch
    expect(result.current.toDelete).toBeNull();
  });

  it('confirmDelete() refetches (no clamp) when other rows remain on the page', async () => {
    const list = makeList([{ id: '1', name: 'a' }, { id: '2', name: 'b' }], 1);
    const remove = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () => useCrudPage<Row, { name: string }>({ entityName: 'Thing', list, create: vi.fn(), update: vi.fn(), remove }),
      { wrapper },
    );

    act(() => result.current.requestDelete({ id: '1', name: 'a' }));
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(remove).toHaveBeenCalled();
    expect(list.setPage).not.toHaveBeenCalled();
    expect(list.refetch).toHaveBeenCalled();
  });
});
