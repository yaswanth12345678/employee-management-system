import { useEffect, useRef, type ReactNode, type UIEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, CircularProgress, Paper, Skeleton, Typography } from '@mui/material';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';

export type FeedOrientation = 'vertical' | 'horizontal';

interface EmployeeFeedProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onNearEnd?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Stable key for filters — resets scroll when it changes, not when rows append. */
  resetKey?: string;
  /** Scroll axis. Default vertical (Instagram feed). Horizontal is optional carousel mode. */
  orientation?: FeedOrientation;
  maxHeight?: number;
  /** Estimated item size along the scroll axis (row height or column width). */
  itemSize?: number;
  /** @deprecated Prefer `itemSize`. Kept for vertical call sites. */
  rowHeight?: number;
  /** Fixed card width used only in horizontal mode for layout chrome. */
  columnWidth?: number;
}

const DEFAULT_MAX_HEIGHT = 720;
const DEFAULT_ROW_HEIGHT = 200;
const DEFAULT_COLUMN_WIDTH = 280;
const HORIZONTAL_STRIP_HEIGHT = 240;
const OVERSCAN = 4;
const NEAR_END_PX = 480;
const SKELETON_ROWS = 4;

/**
 * Virtual employee feed (TanStack Virtual). Vertical by default; set
 * `orientation="horizontal"` for a side-scrolling carousel that still
 * infinite-loads near the end.
 */
export function EmployeeFeed<T>({
  rows,
  getRowId,
  renderCard,
  loading = false,
  loadingMore = false,
  hasMore = false,
  error = null,
  onRetry,
  onNearEnd,
  emptyTitle,
  emptyDescription,
  resetKey = '',
  orientation = 'vertical',
  maxHeight = DEFAULT_MAX_HEIGHT,
  itemSize,
  rowHeight,
  columnWidth = DEFAULT_COLUMN_WIDTH,
}: EmployeeFeedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nearEndLock = useRef(false);
  const horizontal = orientation === 'horizontal';
  const estimatedSize =
    itemSize ?? (horizontal ? columnWidth : (rowHeight ?? DEFAULT_ROW_HEIGHT));

  const showRows = !loading && !error && rows.length > 0;

  const virtualizer = useVirtualizer({
    count: showRows ? rows.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimatedSize,
    overscan: OVERSCAN,
    horizontal,
    getItemKey: (index) => getRowId(rows[index]),
  });

  // Reset scroll only when filters/orientation/resetKey change — not when appending.
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    }
    virtualizer.scrollToOffset(0);
    nearEndLock.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reset only on filter/orientation changes
  }, [resetKey, orientation]);

  useEffect(() => {
    if (!loadingMore) nearEndLock.current = false;
  }, [loadingMore]);

  const totalSize = virtualizer.getTotalSize();

  // If the first page doesn't fill the viewport, keep loading until it does (or runs out).
  useEffect(() => {
    if (!showRows || !hasMore || loading || loadingMore || !onNearEnd) return;
    const el = containerRef.current;
    if (!el) return;
    const unfilled = horizontal
      ? el.scrollWidth <= el.clientWidth + NEAR_END_PX
      : el.scrollHeight <= el.clientHeight + NEAR_END_PX;
    if (unfilled) onNearEnd();
  }, [showRows, hasMore, loading, loadingMore, onNearEnd, rows.length, totalSize, horizontal]);

  const maybeLoadMore = (el: HTMLDivElement) => {
    if (!hasMore || loadingMore || loading || !onNearEnd) return;
    const distanceFromEnd = horizontal
      ? el.scrollWidth - (el.scrollLeft + el.clientWidth)
      : el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceFromEnd > NEAR_END_PX) {
      nearEndLock.current = false;
      return;
    }
    if (nearEndLock.current) return;
    nearEndLock.current = true;
    onNearEnd();
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    maybeLoadMore(event.currentTarget);
  };

  const virtualItems = virtualizer.getVirtualItems();

  const statusFooter = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 56,
        minWidth: horizontal ? 120 : undefined,
        px: horizontal ? 2 : 0,
        py: 1.5,
        flexShrink: 0,
      }}
    >
      {loadingMore && <CircularProgress size={28} />}
      {!loadingMore && showRows && hasMore && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {horizontal ? 'Scroll for more' : 'Scroll for more'}
        </Typography>
      )}
      {!loadingMore && showRows && !hasMore && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          You&apos;re all caught up · {rows.length} people
        </Typography>
      )}
      {!loading && error && rows.length > 0 && (
        <Typography
          variant="caption"
          color="error"
          sx={{ cursor: 'pointer' }}
          onClick={onNearEnd}
          textAlign="center"
        >
          Couldn&apos;t load more — tap to retry
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: horizontal ? '100%' : 480,
          overflow: 'hidden',
        }}
      >
        <Box
          ref={containerRef}
          onScroll={handleScroll}
          sx={{
            maxHeight: horizontal ? HORIZONTAL_STRIP_HEIGHT : maxHeight,
            height: horizontal ? HORIZONTAL_STRIP_HEIGHT : undefined,
            overflow: 'auto',
            position: 'relative',
            bgcolor: 'background.default',
            display: horizontal ? 'flex' : 'block',
            flexDirection: horizontal ? 'row' : undefined,
            alignItems: horizontal ? 'stretch' : undefined,
          }}
        >
          {loading && (
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: horizontal ? 'row' : 'column',
                gap: 2,
              }}
            >
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={horizontal ? HORIZONTAL_STRIP_HEIGHT - 48 : estimatedSize - 16}
                  width={horizontal ? columnWidth - 16 : '100%'}
                  sx={{ flexShrink: 0 }}
                />
              ))}
            </Box>
          )}

          {!loading && error && rows.length === 0 && (
            <Box sx={{ p: 2, width: '100%' }}>
              <ErrorState message={error} onRetry={onRetry} />
            </Box>
          )}

          {!loading && !error && rows.length === 0 && (
            <Box sx={{ p: 2, width: '100%' }}>
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </Box>
          )}

          {showRows && (
            <Box
              sx={{
                height: horizontal ? '100%' : virtualizer.getTotalSize(),
                width: horizontal ? virtualizer.getTotalSize() : '100%',
                position: 'relative',
                px: horizontal ? 0 : 1.5,
                py: horizontal ? 1.5 : 0,
                flexShrink: 0,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <Box
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    sx={{
                      position: 'absolute',
                      top: horizontal ? 12 : 0,
                      bottom: horizontal ? 12 : undefined,
                      left: horizontal ? 0 : 12,
                      right: horizontal ? undefined : 12,
                      width: horizontal ? virtualRow.size : undefined,
                      transform: horizontal
                        ? `translateX(${virtualRow.start}px)`
                        : `translateY(${virtualRow.start}px)`,
                      boxSizing: 'border-box',
                      py: horizontal ? 0 : 1,
                      px: horizontal ? 1 : 0,
                    }}
                  >
                    {renderCard(row)}
                  </Box>
                );
              })}
            </Box>
          )}

          {!horizontal && statusFooter}
          {horizontal && showRows && statusFooter}
        </Box>
      </Paper>
    </Box>
  );
}
