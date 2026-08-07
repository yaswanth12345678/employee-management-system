import { Box, Container, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

/**
 * Layout for unauthenticated pages (login, forgot-password): a centered card on a plain
 * background. `<Outlet/>` renders whichever child route is active.
 */
export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Typography variant="h4" align="center" fontWeight={800} color="primary" sx={{ mb: 3 }}>
          EMS
        </Typography>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
