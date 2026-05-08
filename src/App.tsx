import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useProjectStore } from './store';
import { useEffect } from 'react';

export default function App() {
  const projectPath = useProjectStore((s) => s.projectPath);
  const openProject = useProjectStore((s) => s.openProject);

  useEffect(() => {
    if (projectPath) {
      openProject(projectPath).catch(() => {});
    }
  }, []);

  return <RouterProvider router={router} />;
}
