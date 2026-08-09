import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Link, Stack, Typography } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { ROUTES } from '../../../config/routes';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import type { NormalizedError } from '../../../lib/http';
import * as authApi from '../api/authApi';
import { resetPasswordSchema, type ResetPasswordValues } from '../validation';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setError: setFieldError,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await authApi.resetPassword(token, values.newPassword);
      notify('Password reset. Please sign in.', 'success');
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      setFieldError('newPassword', { message: (err as NormalizedError).message });
    }
  };

  if (!token) {
    return (
      <Box>
        <Alert severity="error">This reset link is missing its token.</Alert>
        <Link component={RouterLink} to={ROUTES.forgotPassword} sx={{ mt: 2, display: 'inline-block' }}>
          Request a new link
        </Link>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" gutterBottom>
        Set a new password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a new password for your account.
      </Typography>
      <Stack spacing={2}>
        <FormTextField
          control={control}
          name="newPassword"
          label="New password"
          type="password"
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained" fullWidth loading={isSubmitting}>
          Reset password
        </Button>
      </Stack>
    </Box>
  );
}
