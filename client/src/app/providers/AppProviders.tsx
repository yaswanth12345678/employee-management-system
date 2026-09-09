import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from '../../theme/ColorModeProvider';
import { ErrorBoundary } from '../ErrorBoundary';
import { AuthProvider } from '../../contexts/AuthContext';
import { SnackbarProvider } from '../../contexts/SnackbarContext';
import { NotificationsBadgeProvider } from '../../features/notifications';
import { ChatProvider } from '../../features/chat';
import { RealtimeProvider } from '../../lib/realtime/RealtimeProvider';

/**
 * Composes every global provider into ONE component, so <App/> stays a single clean line and
 * we avoid "provider pyramid" sprawl scattered across the tree.
 *
 * Order matters (outer → inner):
 *   ColorModeProvider          → theme + CssBaseline; styling available to everything below
 *   ErrorBoundary              → catches errors from the router and all pages
 *   BrowserRouter              → routing context (needed by the Auth guard + nav)
 *   AuthProvider               → identity (guards + realtime read it)
 *   RealtimeProvider           → opens the WebSocket once authenticated
 *   SnackbarProvider           → toasts (any page can trigger)
 *   NotificationsBadgeProvider → shared unread count for the bell + notifications page
 *   ChatProvider               → chat drawer + unread badge for peer messaging
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ColorModeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <RealtimeProvider>
              <SnackbarProvider>
                <NotificationsBadgeProvider>
                  <ChatProvider>{children}</ChatProvider>
                </NotificationsBadgeProvider>
              </SnackbarProvider>
            </RealtimeProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ColorModeProvider>
  );
}
