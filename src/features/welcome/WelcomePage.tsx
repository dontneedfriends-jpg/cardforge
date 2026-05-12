import { Text, Title1, makeStyles, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useProjectStore } from '../../store';
import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  AddRegular,
  FolderOpenRegular,
  DocumentRegular,
  ClockRegular,
} from '@fluentui/react-icons';

function getFolderName(path: string): string {
  if (!path) return 'Untitled';
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'Untitled';
}

function getFolderInitial(name: string): string {
  return (name[0] || '?').toUpperCase();
}

function getGradientFromString(str: string): string {
  const gradients = [
    'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
    'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
    'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
    'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
    'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
    'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

const useStyles = makeStyles({
  page: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  sidebar: {
    width: '380px',
    minWidth: '380px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '48px 40px',
    background: 'var(--mica-base)',
    borderRight: '1px solid var(--mica-stroke)',
    position: 'relative',
    overflow: 'hidden',
  },
  sidebarGlow: {
    position: 'absolute',
    top: '-100px',
    left: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,205,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '48px',
    animation: 'fadeInUp 0.6s ease forwards',
  },
  logo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(96, 205, 255, 0.3)',
  },
  logoText: {
    color: '#0a0a0a',
    fontWeight: 800,
    fontSize: '22px',
    lineHeight: 1,
  },
  brandTitle: {
    fontWeight: 700,
    fontSize: '24px',
    letterSpacing: '-0.5px',
    color: 'var(--mica-text-primary)',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
    marginTop: '2px',
    letterSpacing: '0.5px',
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
    animation: 'fadeInUp 0.6s 0.1s ease forwards',
    opacity: 0,
  },
  heroTitle: {
    fontWeight: 700,
    fontSize: '32px',
    letterSpacing: '-1px',
    lineHeight: 1.2,
    color: 'var(--mica-text-primary)',
  },
  heroDesc: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--mica-text-secondary)',
    maxWidth: '280px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '32px',
    animation: 'fadeInUp 0.6s 0.2s ease forwards',
    opacity: 0,
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    border: 'none',
    color: '#0a0a0a',
    fontWeight: 600,
    padding: '14px 24px',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 16px rgba(96, 205, 255, 0.25)',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 24px rgba(96, 205, 255, 0.35)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'transparent',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'var(--mica-stroke)',
    borderRightColor: 'var(--mica-stroke)',
    borderBottomColor: 'var(--mica-stroke)',
    borderLeftColor: 'var(--mica-stroke)',
    color: 'var(--mica-text-secondary)',
    fontWeight: 500,
    padding: '14px 24px',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
    },
  },
  content: {
    flex: 1,
    height: '100%',
    overflow: 'auto',
    padding: '48px 48px 48px 56px',
    background: 'var(--mica-base-active)',
  },
  contentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--mica-text-primary)',
    letterSpacing: '-0.2px',
  },
  sectionMeta: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  projectCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '20px',
    borderRadius: '12px',
    background: 'var(--mica-layer-1)',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'var(--mica-stroke)',
    borderRightColor: 'var(--mica-stroke)',
    borderBottomColor: 'var(--mica-stroke)',
    borderLeftColor: 'var(--mica-stroke)',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mica-shadow-lg)',
    },
  },
  projectAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  projectName: {
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--mica-text-primary)',
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  projectPath: {
    fontSize: '11px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: "'IBM Plex Mono', monospace",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    gap: '16px',
    color: 'var(--mica-text-tertiary)',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'var(--mica-layer-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--mica-stroke)',
  },
  error: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    minWidth: '300px',
    maxWidth: '90%',
    zIndex: 100,
  },
  version: {
    position: 'absolute',
    bottom: '24px',
    left: '40px',
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
        const name = getFolderName(selected);
        await createProject(selected, name);
        navigate({ to: '/editor' });
      }
    } catch (e: any) {
      setError(e?.toString() || 'Failed to create project');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarGlow} />

        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoText}>C</span>
          </div>
          <div>
            <div className={styles.brandTitle}>CardForge</div>
            <div className={styles.brandSubtitle}>PROFESSIONAL EDITION</div>
          </div>
        </div>

        <div className={styles.hero}>
          <Title1 className={styles.heroTitle}>
            Design game cards
            <br />
            at scale
          </Title1>
          <Text size={300} className={styles.heroDesc}>
            Professional card design tool with code editor, 
            visual canvas, and data-driven rendering for 
            tabletop and digital games.
          </Text>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={handleCreate}>
            <AddRegular fontSize={16} />
            New Project
          </button>
          <button className={styles.secondaryButton} onClick={handleOpen}>
            <FolderOpenRegular fontSize={16} />
            Open Folder
          </button>
        </div>

        <div className={styles.version}>v0.2.0</div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div className={styles.sectionTitle}>
            <ClockRegular fontSize={16} />
            <span>Recent Projects</span>
          </div>
          {recentProjects.length > 0 && (
            <span className={styles.sectionMeta}>
              {recentProjects.length} project{recentProjects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <DocumentRegular fontSize={28} style={{ opacity: 0.5 }} />
            </div>
            <Text size={300} weight="semibold" style={{ color: 'var(--mica-text-secondary)' }}>
              No recent projects
            </Text>
            <Text size={200} style={{ color: 'var(--mica-text-tertiary)', textAlign: 'center' }}>
              Create a new project or open an existing folder to get started
            </Text>
          </div>
        ) : (
          <div className={styles.grid}>
            {recentProjects.map((project, index) => {
              const name = getFolderName(project.name || project.path);
              const initial = getFolderInitial(name);
              const gradient = getGradientFromString(project.path);

              return (
                <div
                  key={project.path}
                  className={styles.projectCard}
                  onClick={() => handleOpenRecent(project.path)}
                  style={{
                    animation: `fadeInUp 0.4s ${0.05 * index}s ease forwards`,
                    opacity: 0,
                  }}
                >
                  <div
                    className={styles.projectAvatar}
                    style={{ background: gradient }}
                  >
                    {initial}
                  </div>
                  <div className={styles.projectInfo}>
                    <div className={styles.projectName}>{name}</div>
                    <div className={styles.projectPath} title={project.path}>
                      {project.path}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
