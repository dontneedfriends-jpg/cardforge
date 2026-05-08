import { Text, Title1, makeStyles, MessageBar, MessageBarBody } from '@fluentui/react-components';
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
    background: 'var(--mica-base)',
    overflow: 'auto',
    padding: '40px 20px',
  },
  logo: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 32px rgba(96, 205, 255, 0.4)',
    marginBottom: '8px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      transform: 'scale(1.05) rotate(-2deg)',
      boxShadow: '0 6px 40px rgba(96, 205, 255, 0.5)',
    },
  },
  logoText: {
    color: '#1c1c1c',
    fontWeight: 800,
    fontSize: '36px',
  },
  title: {
    fontWeight: 700,
    letterSpacing: '-1px',
    color: 'var(--mica-text-primary)',
  },
  subtitle: {
    color: 'var(--mica-text-tertiary)',
    fontSize: '16px',
    letterSpacing: '0.3px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    border: 'none',
    color: '#1c1c1c',
    fontWeight: 600,
    padding: '12px 28px',
    borderRadius: '10px',
    fontSize: '14px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    boxShadow: '0 2px 16px rgba(96, 205, 255, 0.3)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 24px rgba(96, 205, 255, 0.4)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  secondaryButton: {
    background: 'var(--mica-layer-2)',
    border: '1px solid var(--mica-stroke)',
    color: 'var(--mica-text-secondary)',
    fontWeight: 500,
    padding: '12px 28px',
    borderRadius: '10px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      background: 'var(--mica-layer-3)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
    },
  },
  recent: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '480px',
    width: '100%',
  },
  recentTitle: {
    color: 'var(--mica-text-tertiary)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    padding: '0 4px',
    fontWeight: 600,
  },
  card: {
    padding: '16px 20px',
    borderRadius: '12px',
    background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
      transform: 'translateX(4px)',
      boxShadow: 'var(--mica-shadow-md)',
    },
  },
  cardName: {
    fontWeight: 500,
    fontSize: '14px',
    color: 'var(--mica-text-primary)',
  },
  cardPath: {
    color: 'var(--mica-text-tertiary)',
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  cardBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
  },
  error: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: '300px',
    maxWidth: '90%',
    zIndex: 100,
  },
  version: {
    position: 'absolute',
    bottom: '20px',
    right: '24px',
    fontSize: '11px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: "'IBM Plex Mono', monospace",
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
      
      <Title1 className={styles.title}>CardForge</Title1>
      
      <Text size={400} className={styles.subtitle}>
        Design game cards with code, data, and visual editor
      </Text>
      
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handleCreate}>
          New Project
        </button>
        <button className={styles.secondaryButton} onClick={handleOpen}>
          Open Folder
        </button>
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
              <Text size={300} className={styles.cardName}>{project.name}</Text>
              <Text size={200} className={styles.cardPath}>
                {project.path}
              </Text>
              <div className={styles.cardMeta}>
                <span className={styles.cardBadge}>Project</span>
              </div>
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

      <div className={styles.version}>v0.2.0</div>
    </div>
  );
}
