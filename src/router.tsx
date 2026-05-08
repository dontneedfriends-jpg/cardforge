import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { NavRail } from './shared/components/NavRail';
import { WelcomePage } from './features/welcome/WelcomePage';
import { EditorPage } from './features/welcome/EditorPage';
import { SimulatorPage } from './features/simulator/SimulatorPage';
import { ExportPage } from './features/export/ExportPage';
import { useUiStore } from './store';

function Shell() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
      <div 
        className="mica-backdrop"
        style={{ 
          display: 'flex', 
          height: '100vh', 
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background gradient layer for depth */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(40,45,60,0.4) 0%, rgba(20,20,25,0.2) 50%, rgba(30,35,50,0.3) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <NavRail />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </div>
    </FluentProvider>
  );
}

const rootRoute = createRootRoute({
  component: Shell,
});

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: WelcomePage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor',
  component: EditorPage,
});

const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simulator',
  component: SimulatorPage,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: ExportPage,
});

import { SettingsPage } from './features/settings/SettingsPage';

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([welcomeRoute, editorRoute, simulatorRoute, exportRoute, settingsRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
