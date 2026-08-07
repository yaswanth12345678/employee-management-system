import {
  Button as MuiButton,
  CircularProgress,
  type ButtonProps as MuiButtonProps,
} from '@mui/material';

/**
 * Our design-system Button = MUI Button + a `loading` state.
 *
 * Why wrap MUI at all? So the whole app imports OUR Button, not MUI's directly. That gives a
 * single seam to (a) add app-wide behavior like the loading spinner here, (b) enforce
 * consistent defaults, and (c) swap the underlying library one day without touching 300 call
 * sites. The rule: features import from `components/ui`, never `@mui/material` for primitives
 * we've wrapped.
 */
export interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export function Button({ loading = false, disabled, startIcon, children, ...rest }: ButtonProps) {
  return (
    <MuiButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    >
      {children}
    </MuiButton>
  );
}
