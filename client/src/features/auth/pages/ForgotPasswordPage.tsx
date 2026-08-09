import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Link, Stack, Typography } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { ROUTES } from '../../../config/routes';
import type { NormalizedError } from '../../../lib/http';
import * as authApi from '../api/authApi';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../validation';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setError(null);
    try {
      const res = await authApi.forgotPassword(values.email);
      setSent(res.message);
      // In development the API returns the token so we can complete the flow without email.
      if (res.resetToken) setDevLink(`${ROUTES.resetPassword}?token=${res.resetToken}`);
    } catch (err) {
      setError((err as NormalizedError).message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" gutterBottom>
        Forgot password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email and we&apos;ll send a reset link.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {sent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {sent}
          {devLink && (
            <Box sx={{ mt: 1 }}>
              <Link component={RouterLink} to={devLink}>
                Continue to reset (dev link)
              </Link>
            </Box>
          )}
        </Alert>
      )}

      <Stack spacing={2}>
        <FormTextField
          control={control}
          name="email"
          label="Email"
          type="email"
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
        <Link component={RouterLink} to={ROUTES.login} variant="body2" textAlign="center">
          Back to sign in
        </Link>
      </Stack>
    </Box>
  );
}
