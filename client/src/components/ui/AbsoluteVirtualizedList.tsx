import { useEffect, useRef, useState, type ReactNode, type UIEvent } from 'react';
import { Box, Paper, Skeleton, TablePagination, Typography } from '@mui/material';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';

/**
 * Absolute/transform windowing (react-window style): div scrollport + positioned rows.
 * Great for feeds/cards; awkward for multi-column tables (no native <table> layout).
 */
interface AbsoluteVirtualizedListProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  renderRow: (row: T) => ReactNode;
  header?: ReactNode;
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
  maxHeight?: number;
  rowHeight?: number;
}

const DEFAULT_MAX_HEIGHT = 560;
const DEFAULT_ROW_HEIGHT = 64;
const OVERSCAN = 6;
const SKELETON_ROWS = 5;

export function AbsoluteVirtualizedList<T>({
  rows,
  getRowId,
  renderRow,
  header,
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
  maxHeight = DEFAULT_MAX_HEIGHT,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: AbsoluteVirtualizedListProps<T>) {
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
  const visibleRows = showRows ? rows.slice(startIndex, endIndex + 1) : [];
  const totalHeight = rows.length * rowHeight;

  return (
    <Paper variant="outlined">
      {header}
      <Box
        ref={containerRef}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          setScrollTop(event.currentTarget.scrollTop);
        }}
        sx={{ maxHeight, overflow: 'auto', position: 'relative' }}
      >
        {loading && (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={rowHeight - 8} sx={{ mb: 1 }} />
            ))}
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: 2 }}>
            <ErrorState message={error} onRetry={onRetry} />
          </Box>
        )}

        {!loading && !error && rows.length === 0 && (
          <Box sx={{ p: 2 }}>
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </Box>
        )}

        {showRows && (
          <Box sx={{ height: totalHeight, position: 'relative' }}>
            {visibleRows.map((row, offset) => {
              const index = startIndex + offset;
              return (
                <Box
                  key={getRowId(row)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                    transform: `translateY(${index * rowHeight}px)`,
                    display: 'flex',
                    alignItems: 'stretch',
                    px: 2,
                    boxSizing: 'border-box',
                  }}
                >
                  {renderRow(row)}
                </Box>
              );
            })}
          </Box>
        )}

        {showRows && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ position: 'sticky', bottom: 0, display: 'block', px: 2, py: 0.5, bgcolor: 'background.paper' }}
          >
            Mounted {visibleRows.length} / {rows.length} rows (absolute windowing)
          </Typography>
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
