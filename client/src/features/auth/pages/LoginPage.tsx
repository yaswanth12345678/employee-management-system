import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Link, Stack, Typography } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { ROUTES } from '../../../config/routes';
import { loginFormSchema, type LoginFormValues } from '../validation';
import { useLogin } from '../hooks/useLogin';

/**
 * The login screen. react-hook-form owns the field state (it's a performant, reducer-based form
 * library that avoids re-rendering the whole form on every keystroke — only the changed field).
 * We use <Controller> to bridge RHF with MUI's controlled TextField. Validation comes from the
 * zod schema via the resolver, so the rules live in one typed place.
 */
export function LoginPage() {
  const { submit, error } = useLogin();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <Typography variant="h5" gutterBottom>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Use your EMS account credentials.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <FormTextField
          control={control}
          name="email"
          label="Email"
          type="email"
          fullWidth
          autoComplete="email"
          autoFocus
        />
        <FormTextField
          control={control}
          name="password"
          label="Password"
          type="password"
          fullWidth
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
        <Link component={RouterLink} to={ROUTES.forgotPassword} variant="body2" textAlign="center">
          Forgot password?
        </Link>
      </Stack>
    </Box>
  );
}
