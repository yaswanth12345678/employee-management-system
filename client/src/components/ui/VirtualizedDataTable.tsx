import { useEffect, useRef, useState, type ReactNode, type UIEvent } from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import type { Column } from './DataTable';

/**
 * Spacer-row windowing for MUI <Table>: only visible rows (+ overscan) mount.
 * Keeps real table layout/column alignment via top/bottom spacer <tr>s.
 */
interface VirtualizedDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowActions?: (row: T) => ReactNode;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  rowsPerPageOptions?: number[];
  maxHeight?: number;
  rowHeight?: number;
}

const SKELETON_ROWS = 5;
const DEFAULT_MAX_HEIGHT = 560;
const DEFAULT_ROW_HEIGHT = 57;
const OVERSCAN = 8;

export function VirtualizedDataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  rowActions,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  rowsPerPageOptions = [25, 50, 100],
  maxHeight = DEFAULT_MAX_HEIGHT,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: VirtualizedDataTableProps<T>) {
  const colSpan = columns.length + (rowActions ? 1 : 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);

  const showRows = !loading && !error && rows.length > 0;
  const listKey = `${page}:${limit}:${rows.length}:${rows[0] ? getRowId(rows[0]) : ''}`;

  useEffect(() => {
    if (!showRows) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setViewportHeight(el.clientHeight || maxHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showRows, maxHeight, rows.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = 0;
    setScrollTop(0);
  }, [listKey]);

  const startIndex = showRows
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
    : 0;
  const endIndex = showRows
    ? Math.min(
        rows.length - 1,
        Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN,
      )
    : -1;
  const paddingTop = showRows ? startIndex * rowHeight : 0;
  const paddingBottom = showRows ? Math.max(0, (rows.length - endIndex - 1) * rowHeight) : 0;
  const visibleRows = showRows ? rows.slice(startIndex, endIndex + 1) : [];

  return (
    <Paper variant="outlined">
      <TableContainer
        ref={containerRef}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          setScrollTop(event.currentTarget.scrollTop);
        }}
        sx={{ maxHeight, overflow: 'auto' }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align}
                  sx={{ width: col.width, fontWeight: 700 }}
                >
                  {col.header}
                </TableCell>
              ))}
              {rowActions && (
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: colSpan }).map((__, cellIndex) => (
                    <TableCell key={`skeleton-${rowIndex}-${cellIndex}`}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={colSpan} sx={{ border: 0 }}>
                  <ErrorState message={error} onRetry={onRetry} />
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}

            {showRows && paddingTop > 0 && (
              <TableRow aria-hidden>
                <TableCell colSpan={colSpan} sx={{ p: 0, border: 0, height: paddingTop }} />
              </TableRow>
            )}

            {visibleRows.map((row) => (
              <TableRow key={getRowId(row)} hover sx={{ height: rowHeight }}>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {rowActions(row)}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {showRows && paddingBottom > 0 && (
              <TableRow aria-hidden>
                <TableCell colSpan={colSpan} sx={{ p: 0, border: 0, height: paddingBottom }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        onPageChange={(_event, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Paper>
  );
}
