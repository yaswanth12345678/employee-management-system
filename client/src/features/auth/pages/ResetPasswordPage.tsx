import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Link, Stack, TextField, Typography } from '@mui/material';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import type { NormalizedError } from '../../../lib/http';
import * as authApi from '../api/authApi';

const schema = z.object({ newPassword: z.string().min(8, 'Password must be at least 8 characters') });
type Values = z.infer<typeof schema>;

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
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { newPassword: '' } });

  const onSubmit = async (values: Values) => {
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
        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              inputRef={field.ref}
              label="New password"
              type="password"
              fullWidth
              autoFocus
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" variant="contained" fullWidth loading={isSubmitting}>
          Reset password
        </Button>
      </Stack>
    </Box>
  );
}
