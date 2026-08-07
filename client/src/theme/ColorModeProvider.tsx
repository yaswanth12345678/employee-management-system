import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import type { ThemePreference } from '@ems/shared';
import { buildTheme } from './index';

/**
 * Provides the MUI theme and mode controls. `mode` is the user's preference (light/dark/system);
 * 'system' resolves to the OS preference via a media query. `setMode` PERSISTS the choice to
 * localStorage (so the theme is correct on reload before settings load from the API); `previewMode`
 * applies a choice WITHOUT persisting (for a live, revertible preview), and `revertToStored` drops
 * an unsaved preview by re-applying the last persisted value.
 */
interface ColorModeValue {
  mode: ThemePreference;
  setMode: (mode: ThemePreference) => void;
  previewMode: (mode: ThemePreference) => void;
  revertToStored: () => void;
}

const ColorModeContext = createContext<ColorModeValue | undefined>(undefined);
const STORAGE_KEY = 'ems.themeMode';

function readStored(): ThemePreference {
  return (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setModeState] = useState<ThemePreference>(readStored);

  // Persist + apply — the durable choice (settings load, explicit save).
  const setMode = useCallback((next: ThemePreference) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Apply only — a live preview that must NOT survive a reload until it is saved.
  const previewMode = useCallback((next: ThemePreference) => {
    setModeState(next);
  }, []);

  // Discard an unsaved preview by snapping back to whatever is persisted.
  const revertToStored = useCallback(() => {
    setModeState(readStored());
  }, []);

  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  const theme = useMemo(() => buildTheme(resolved), [resolved]);
  const value = useMemo(
    () => ({ mode, setMode, previewMode, revertToStored }),
    [mode, setMode, previewMode, revertToStored],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return ctx;
}
