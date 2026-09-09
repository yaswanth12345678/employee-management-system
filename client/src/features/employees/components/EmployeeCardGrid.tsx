import type { ReactNode } from 'react';
import { Box, Paper, Skeleton, TablePagination } from '@mui/material';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';

interface EmployeeCardGridProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  rowsPerPageOptions?: number[];
}

const SKELETON_CARDS = 8;

/** Renders every card in a responsive grid (no windowing). */
export function EmployeeCardGrid<T>({
  rows,
  getRowId,
  renderCard,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  rowsPerPageOptions = [25, 50, 100],
}: EmployeeCardGridProps<T>) {
  return (
    <Paper variant="outlined">
      <Box sx={{ p: 2 }}>
        {loading && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
            }}
          >
            {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={180} />
            ))}
          </Box>
        )}

        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}

        {!loading && !error && rows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}

        {!loading && !error && rows.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
            }}
          >
            {rows.map((row) => (
              <Box key={getRowId(row)}>{renderCard(row)}</Box>
            ))}
          </Box>
        )}
      </Box>

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
