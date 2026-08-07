import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import type { CountByKey } from '@ems/shared';

function prettify(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Renders a set of counts as labeled, proportional bars (no external chart library). */
export function BarList({ items }: { items: CountByKey[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data
      </Typography>
    );
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Box key={item.key}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2">{prettify(item.key)}</Typography>
            <Typography variant="body2" fontWeight={700}>
              {item.count}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(item.count / max) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      ))}
    </Stack>
  );
}
