import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

/**
 * Builds the MUI theme for a given palette mode. The single source of truth for the app's look
 * & feel; component `sx` should reference these tokens rather than hard-coded colors.
 */
export function buildTheme(mode: PaletteMode): Theme {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#90caf9' : '#1565c0' },
      secondary: { main: isDark ? '#4dd0e1' : '#00838f' },
      background: isDark
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f4f6f8', paper: '#ffffff' },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAppBar: {
        defaultProps: { color: 'inherit', elevation: 0 },
        styleOverrides: {
          root: { borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}` },
        },
      },
    },
  });
}

/** Default (light) theme, for any non-provider usage. */
export const theme = buildTheme('light');
