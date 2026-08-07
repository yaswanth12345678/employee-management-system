import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../config/routes';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h2" fontWeight={800}>
        404
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you’re looking for doesn’t exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.dashboard)}>
        Go to dashboard
      </Button>
    </Box>
  );
}
