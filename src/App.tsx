import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useProjectStore, useUiStore } from './store';
import { useEffect } from 'react';
import { loadFontsIntoDocument } from './shared/utils/fontUtils';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const projectPath = useProjectStore((s) => s.projectPath);
  const openProject = useProjectStore((s) => s.openProject);
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    if (projectPath) {
      openProject(projectPath).catch(() => {
        console.warn('[App] Failed to open project');
      });
    }
  }, [projectPath]);

  useEffect(() => {
    if (projectPath) {
      loadFontsIntoDocument(projectPath).catch(() => {
        console.warn('[App] Failed to load fonts');
      });
    }
  }, [projectPath]);

  // Theme + system changes listener
  useEffect(() => {
    const apply = () => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      document.body.setAttribute('data-theme', resolved);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', apply);
      return () => mq.removeEventListener?.('change', apply);
    }
  }, [theme]);

  // Font size & Density
  const fontSize = useUiStore((s) => s.fontSize);
  const density = useUiStore((s) => s.density);
  useEffect(() => {
    document.body.setAttribute('data-font-size', fontSize);
    document.body.setAttribute('data-density', density);
  }, [fontSize, density]);

  return <RouterProvider router={router} />;
}
