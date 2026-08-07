import { useState } from 'react';
import type { NormalizedError } from '../lib/http';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useDisclosure } from './useDisclosure';

/** The slice of a list-hook this needs: to refresh after a mutation, and to step back a page. */
interface ListLike<T> {
  data: T[];
  page: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void> | void;
}

interface UseCrudPageConfig<T, V> {
  /** Toast noun, e.g. "Department" → "Department created". */
  entityName: string;
  list: ListLike<T>;
  create: (values: V) => Promise<unknown>;
  update: (row: T, values: V) => Promise<unknown>;
  remove: (row: T) => Promise<unknown>;
}

/**
 * The create/edit/delete interaction wiring shared by every list screen: which row is being edited,
 * the submit/delete in-flight flags, the try/finally → toast → refetch dance, and stepping back a
 * page when the last row on it is deleted. A page supplies only the entity-specific operations
 * (create/update/remove) and renders its form + confirm dialogs off the returned state — so the
 * page itself is left with just its columns, filters, and JSX.
 */
export function useCrudPage<T, V>({ entityName, list, create, update, remove }: UseCrudPageConfig<T, V>) {
  const { notify } = useSnackbar();
  const form = useDisclosure();
  const [editing, setEditing] = useState<T | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    form.open();
  };
  const openEdit = (row: T) => {
    setEditing(row);
    form.open();
  };

  const submit = async (values: V) => {
    setSubmitting(true);
    try {
      if (editing) {
        await update(editing, values);
        notify(`${entityName} updated`, 'success');
      } else {
        await create(values);
        notify(`${entityName} created`, 'success');
      }
      form.close();
      await list.refetch();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await remove(toDelete);
      notify(`${entityName} deleted`, 'success');
      setToDelete(null);
      // If we just deleted the last row on a non-first page, step back a page.
      if (list.data.length === 1 && list.page > 1) list.setPage(list.page - 1);
      else await list.refetch();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
    /** dialog state */
    formOpen: form.isOpen,
    editing,
    openCreate,
    openEdit,
    closeForm: form.close,
    /** submit */
    submitting,
    submit,
    /** delete */
    toDelete,
    requestDelete: (row: T) => setToDelete(row),
    cancelDelete: () => setToDelete(null),
    deleting,
    confirmDelete,
  };
}
