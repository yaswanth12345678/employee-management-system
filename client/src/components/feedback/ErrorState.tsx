import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Button } from '../ui/Button';

/**
 * Inline error display for a failed data fetch within a page (distinct from the top-level
 * ErrorBoundary, which catches render crashes). Gives the user a clear message and a retry.
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
      <Typography variant="h6" sx={{ mt: 1 }}>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {message}
        </Typography>
      )}
      {onRetry && (
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={onRetry}>
            Retry
          </Button>
        </Box>
      )}
    </Box>
  );
}
