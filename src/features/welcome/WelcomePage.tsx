import { Button, Text, Title1, makeStyles, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useProjectStore } from '../../store';
import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '24px',
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30,35,50,0.3) 0%, rgba(20,20,25,0.1) 50%, rgba(25,30,45,0.2) 100%)',
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 24px rgba(96, 205, 255, 0.3)',
    marginBottom: '8px',
  },
  logoText: {
    color: '#1c1c1c',
    fontWeight: 800,
    fontSize: '32px',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontSize: '16px',
    letterSpacing: '0.3px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  recent: {
    marginTop: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '420px',
    width: '100%',
  },
  recentTitle: {
    color: 'rgba(255, 255, 255, 0.40)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    padding: '0 4px',
  },
  card: {
    padding: '14px 18px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'pointer',
  },
  cardPath: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: '11px',
    marginTop: '4px',
  },
  error: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: '300px',
    maxWidth: '90%',
  },
});

export function WelcomePage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { openProject, createProject } = useProjectStore();
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const [error, setError] = useState<string | null>(null);

  const handleOpenRecent = async (path: string) => {
    try {
      setError(null);
      await openProject(path);
      navigate({ to: '/editor' });
    } catch (e: any) {
      setError(e?.toString() || 'Failed to open project');
    }
  };

  const handleOpen = async () => {
    try {
      setError(null);
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        await openProject(selected);
        navigate({ to: '/editor' });
      }
    } catch (e: any) {
      setError(e?.toString() || 'Failed to open project');
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        const name = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';
        await createProject(selected, name);
        navigate({ to: '/editor' });
      }
    } catch (e: any) {
      setError(e?.toString() || 'Failed to create project');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <span className={styles.logoText}>C</span>
      </div>
      <Title1 style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>CardForge</Title1>
      <Text size={400} className={styles.subtitle}>Design game cards with code, data, and preview</Text>
      <div className={styles.actions}>
        <Button appearance="primary" size="large" onClick={handleCreate}>
          New Project
        </Button>
        <Button size="large" onClick={handleOpen}>
          Open Folder
        </Button>
      </div>

      {recentProjects.length > 0 && (
        <div className={styles.recent}>
          <Text size={300} weight="semibold" className={styles.recentTitle}>Recent Projects</Text>
          {recentProjects.map((project) => (
            <div
              key={project.path}
              className={styles.card}
              onClick={() => handleOpenRecent(project.path)}
            >
              <Text size={300} style={{ fontWeight: 500 }}>{project.name}</Text>
              <Text size={200} className={styles.cardPath}>
                {project.path}
              </Text>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}
    </div>
  );
}
