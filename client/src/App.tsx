import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';

// Top-level composition: global providers wrap the router. No business logic here — this
// is purely "assemble the application shell". Keeping it tiny keeps concerns separated.
export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
