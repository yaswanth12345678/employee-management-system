import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { AuthUser } from '@ems/shared';
import { onSessionExpired, setAccessToken } from '../lib/http';
import * as authApi from '../features/auth/api/authApi';

/**
 * Global auth state, modeled as a small STATE MACHINE with useReducer.
 *
 * Why useReducer over useState here? The auth lifecycle has several states and transitions
 * (initializing → authenticated/unauthenticated, then login/logout between them). A reducer
 * puts every transition in ONE place as named actions, so the logic is explicit and testable —
 * far clearer than juggling multiple useState setters and worrying about invalid combinations
 * (e.g. "authenticated but no user"). Reach for useReducer exactly when state transitions get
 * more interesting than "set this value".
 */
type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

type AuthAction = { type: 'AUTHENTICATED'; user: AuthUser } | { type: 'UNAUTHENTICATED' };

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTHENTICATED':
      return { status: 'authenticated', user: action.user };
    case 'UNAUTHENTICATED':
      return { status: 'unauthenticated', user: null };
    default:
      return _state;
  }
}

const INITIAL_STATE: AuthState = { status: 'initializing', user: null };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

  // ── Bootstrap on load ──────────────────────────────────────────────────────
  // On a page refresh the in-memory access token is gone, but the httpOnly refresh cookie
  // survives. We call /auth/refresh to silently re-establish the session (or fall back to
  // unauthenticated). This is what keeps a user "logged in" across reloads.
  useEffect(() => {
    let active = true;
    authApi
      .refresh()
      .then((res) => {
        if (!active) return;
        setAccessToken(res.accessToken);
        dispatch({ type: 'AUTHENTICATED', user: res.user });
      })
      .catch(() => {
        if (active) dispatch({ type: 'UNAUTHENTICATED' });
      });
    return () => {
      active = false;
    };
  }, []);

  // If a background token refresh ultimately fails, the http layer calls this → we log out.
  useEffect(() => {
    onSessionExpired(() => {
      setAccessToken(null);
      dispatch({ type: 'UNAUTHENTICATED' });
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAccessToken(res.accessToken);
    dispatch({ type: 'AUTHENTICATED', user: res.user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // clears the server-side refresh cookie
    } finally {
      setAccessToken(null);
      dispatch({ type: 'UNAUTHENTICATED' });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      isAuthenticated: state.status === 'authenticated',
      login,
      logout,
    }),
    [state.status, state.user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
