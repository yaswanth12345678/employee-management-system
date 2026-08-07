import type { ReactNode } from 'react';
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

/**
 * A GENERIC, reusable data table. Every module's list screen renders through this one
 * component, so loading skeletons, empty/error states, and pagination behave identically
 * app-wide. It's generic over the row type `T`, so it stays fully type-safe per module.
 *
 * It's deliberately "dumb": it renders whatever rows/state it's given and reports pagination
 * intent via callbacks. Data fetching lives in a hook (useDepartments), not here — separation
 * of "how it looks" from "where data comes from".
 */
export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowActions?: (row: T) => ReactNode;
  // Pagination is controlled (1-based page) by the parent.
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  rowsPerPageOptions?: number[];
}

const SKELETON_ROWS = 5;

export function DataTable<T>({
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
  rowsPerPageOptions = [5, 10, 25, 50],
}: DataTableProps<T>) {
  const colSpan = columns.length + (rowActions ? 1 : 0);

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
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

            {!loading &&
              !error &&
              rows.map((row) => (
                <TableRow key={getRowId(row)} hover>
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
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page - 1} // MUI is 0-based; our API is 1-based
        rowsPerPage={limit}
        onPageChange={(_event, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Paper>
  );
}
