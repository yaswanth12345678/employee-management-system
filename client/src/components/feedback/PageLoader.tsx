import { Box, CircularProgress } from '@mui/material';

/** Centered spinner used as the Suspense fallback while a lazy route chunk loads. */
export function PageLoader() {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}
    >
      <CircularProgress />
    </Box>
  );
}
