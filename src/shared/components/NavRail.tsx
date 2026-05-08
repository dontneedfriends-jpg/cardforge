import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  LayerRegular,
  DesignIdeasRegular,
  TableRegular,
  ImageRegular,
  PlayRegular,
  ArrowExportRegular,
  SettingsRegular,
  type FluentIcon,
} from '@fluentui/react-icons';
import { Tooltip, makeStyles, mergeClasses } from '@fluentui/react-components';
import { useUiStore } from '../../store';

interface NavItem {
  icon: FluentIcon;
  label: string;
  tab: string;
  route: string;
}

const navItems: NavItem[] = [
  { icon: LayerRegular, label: 'Decks', tab: 'decks', route: '/editor' },
  { icon: DesignIdeasRegular, label: 'Overview', tab: 'overview', route: '/editor' },
  { icon: TableRegular, label: 'Data', tab: 'data', route: '/editor' },
  { icon: ImageRegular, label: 'Assets', tab: 'assets', route: '/editor' },
  { icon: PlayRegular, label: 'Simulator', tab: 'simulator', route: '/simulator' },
  { icon: ArrowExportRegular, label: 'Export', tab: 'export', route: '/export' },
  { icon: SettingsRegular, label: 'Settings', tab: 'settings', route: '/settings' },
];

const useStyles = makeStyles({
  nav: {
    width: '64px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '16px',
    paddingBottom: '16px',
    gap: '4px',
    background: 'var(--mica-layer-1)',
    borderRight: '1px solid var(--mica-stroke)',
    backdropFilter: 'blur(60px)',
    WebkitBackdropFilter: 'blur(60px)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  logo: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(96, 205, 255, 0.3)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 3px 16px rgba(96, 205, 255, 0.4)',
    },
  },
  logoText: {
    color: '#1c1c1c',
    fontWeight: 800,
    fontSize: '16px',
  },
  divider: {
    width: '24px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--mica-stroke-strong), transparent)',
    marginBottom: '12px',
  },
  link: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    color: 'var(--mica-text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    ':hover': {
      background: 'var(--mica-layer-2)',
      color: 'var(--mica-text-primary)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  linkActive: {
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
    boxShadow: '0 0 20px rgba(96, 205, 255, 0.1)',
    ':hover': {
      background: 'var(--mica-accent-secondary)',
      color: 'var(--mica-accent)',
    },
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    background: 'var(--mica-accent)',
    borderRadius: '0 4px 4px 0',
    boxShadow: '0 0 8px rgba(96, 205, 255, 0.5)',
  },
  bottomSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
});

export function NavRail() {
  const styles = useStyles();
  const location = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  const handleClick = (item: NavItem) => {
    setSidebarTab(item.tab);
    navigate({ to: item.route });
  };

  const mainItems = navItems.slice(0, 5);
  const bottomItems = navItems.slice(5);

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoText}>C</span>
      </div>

      <div className={styles.divider} />

      {mainItems.map((item) => {
        const isActive = item.route === '/editor'
          ? sidebarTab === item.tab
          : location.pathname === item.route;

        return (
          <Tooltip content={item.label} relationship="label" positioning="after" key={item.label}>
            <button
              onClick={() => handleClick(item)}
              className={mergeClasses(styles.link, isActive && styles.linkActive)}
            >
              <item.icon fontSize={22} />
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          </Tooltip>
        );
      })}

      <div className={styles.bottomSection}>
        <div className={styles.divider} />
        
        {bottomItems.map((item) => {
          const isActive = item.route === '/editor'
            ? sidebarTab === item.tab
            : location.pathname === item.route;

          return (
            <Tooltip content={item.label} relationship="label" positioning="after" key={item.label}>
              <button
                onClick={() => handleClick(item)}
                className={mergeClasses(styles.link, isActive && styles.linkActive)}
              >
                <item.icon fontSize={22} />
                {isActive && <div className={styles.activeIndicator} />}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
