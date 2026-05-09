import { getCurrentWindow } from '@tauri-apps/api/window';
import { useProjectStore } from '../../store';
import { useState, useEffect } from 'react';

export function TitleBar() {
  const projectPath = useProjectStore((s) => s.projectPath);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized()
      .then(setIsMaximized)
      .catch((e) => console.error('[TitleBar] isMaximized failed:', e));
  }, []);

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error('[TitleBar] minimize failed:', e);
    }
  };

  const handleMaximize = async () => {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      const maximized = await win.isMaximized();
      setIsMaximized(maximized);
    } catch (e) {
      console.error('[TitleBar] toggleMaximize failed:', e);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error('[TitleBar] close failed:', e);
    }
  };

  const projectName = projectPath
    ? (projectPath.replace(/\\/g, '/').split('/').pop() || projectPath)
    : null;

  return (
    <div
      data-tauri-drag-region
      style={{
        height: '32px',
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--mica-layer-1)',
        borderBottom: '1px solid var(--mica-stroke)',
        userSelect: 'none',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      {/* Левая часть: лого + имя проекта — перетаскивает окно */}
      <div
        data-tauri-drag-region
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px',
          overflow: 'hidden',
          flex: 1,
          minWidth: 0,
          height: '100%',
        }}
      >
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--mica-text-primary)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontFamily: 'IBM Plex Sans, sans-serif',
        }}>
          CardForge
        </span>

        {projectName && (
          <>
            <span style={{
              fontSize: '11px',
              color: 'var(--mica-text-tertiary)',
              flexShrink: 0,
            }}>
              —
            </span>
            <span
              title={projectPath ?? undefined}
              style={{
                fontSize: '11px',
                color: 'var(--mica-text-tertiary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'IBM Plex Mono', monospace",
                minWidth: 0,
              }}
            >
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Правая часть: кнопки управления окном — НЕ перетаскивают */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          title="Minimize"
          style={btnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--mica-layer-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <rect x="0" y="8" width="10" height="1.5" fill="currentColor" />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={btnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--mica-layer-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isMaximized ? (
            /* Restore icon — два прямоугольника */
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <polyline points="0,2 0,10 8,10" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            /* Maximize icon — квадрат */
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          title="Close"
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#c42b1c';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--mica-text-secondary)';
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: '46px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: 'var(--mica-text-secondary)',
  cursor: 'pointer',
  transition: 'background 0.1s ease, color 0.1s ease',
  flexShrink: 0,
  padding: 0,
};
