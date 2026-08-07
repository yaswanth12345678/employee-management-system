import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * A React Error Boundary.
 *
 * Why a CLASS component? Error boundaries are the ONE thing hooks still can't do — catching
 * render/lifecycle errors requires the class-only lifecycle methods below. Without a boundary,
 * a single thrown error during render unmounts the WHOLE React tree (white screen). This
 * contains the blast radius and shows a recoverable fallback instead.
 *
 * Note: boundaries catch errors during rendering/lifecycle — NOT event handlers or async
 * code (handle those with try/catch + the snackbar).
 */
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  // Render phase: derive the fallback UI state from the thrown error.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Commit phase: the place to report the error to a monitoring service (Sentry, etc.).
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5">Something went wrong</Typography>
          <Typography color="text.secondary">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
