import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * A consistent page title + optional subtitle + right-aligned action slot. Every module page
 * uses this, so headers stay visually uniform and the "primary action top-right" convention is
 * enforced structurally rather than by copy-paste.
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
