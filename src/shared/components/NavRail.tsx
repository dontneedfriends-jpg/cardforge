import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  LayerRegular,
  DesignIdeasRegular,
  TableRegular,
  ImageRegular,
  PlayRegular,
  ArrowExportRegular,
  SettingsRegular,
} from '@fluentui/react-icons';
import { Tooltip } from '@fluentui/react-components';
import { useUiStore } from '../../store';

interface NavItem {
  icon: React.FC<{ fontSize?: number }>;
  label: string;
  tab: string;
  route: string;
}

const navItems: NavItem[] = [
  { icon: LayerRegular, label: 'Decks', tab: 'decks', route: '/editor' },
  { icon: DesignIdeasRegular, label: 'Template', tab: 'template', route: '/editor' },
  { icon: TableRegular, label: 'Data', tab: 'data', route: '/editor' },
  { icon: ImageRegular, label: 'Assets', tab: 'assets', route: '/editor' },
  { icon: PlayRegular, label: 'Simulator', tab: 'simulator', route: '/simulator' },
  { icon: ArrowExportRegular, label: 'Export', tab: 'export', route: '/export' },
  { icon: SettingsRegular, label: 'Settings', tab: 'settings', route: '/settings' },
];

const navStyle: React.CSSProperties = {
  width: 64,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: 16,
  paddingBottom: 16,
  gap: 4,
  background: 'rgba(255, 255, 255, 0.03)',
  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(60px)',
  WebkitBackdropFilter: 'blur(60px)',
  flexShrink: 0,
  position: 'relative',
  zIndex: 10,
};

const baseLinkStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  color: 'rgba(255, 255, 255, 0.65)',
  textDecoration: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  position: 'relative',
  overflow: 'hidden',
};

export function NavRail() {
  const location = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  const handleClick = (item: NavItem) => {
    setSidebarTab(item.tab);
    navigate({ to: item.route });
  };

  return (
    <nav style={navStyle}>
      {/* App Logo */}
      <div style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 2px 12px rgba(96, 205, 255, 0.3)',
      }}>
        <span style={{ color: '#1c1c1c', fontWeight: 800, fontSize: 16 }}>C</span>
      </div>

      <div style={{ 
        width: 24, 
        height: 1, 
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        marginBottom: 12,
      }} />

      {navItems.map((item) => {
        const isActive = item.route === '/editor'
          ? sidebarTab === item.tab
          : location.pathname === item.route;

        return (
          <Tooltip content={item.label} relationship="label" positioning="after" key={item.label}>
            <button
              onClick={() => handleClick(item)}
              style={{
                ...baseLinkStyle,
                ...(isActive
                  ? { 
                      background: 'rgba(96, 205, 255, 0.12)', 
                      color: '#60cdff',
                      boxShadow: '0 0 20px rgba(96, 205, 255, 0.1)',
                    }
                  : { ':hover': { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' } }),
              }}
            >
              <item.icon fontSize={22} />
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    background: '#60cdff',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 8px rgba(96, 205, 255, 0.5)',
                  }}
                />
              )}
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
