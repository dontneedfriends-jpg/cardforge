import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  DesignIdeasRegular,
  TableRegular,
  ImageRegular,
  PlayRegular,
  ArrowExportRegular,
  SettingsRegular,
  AddRegular,
  DocumentRegular,
  PaintBrushRegular,
  type FluentIcon,
} from '@fluentui/react-icons';
import { makeStyles, mergeClasses, Text } from '@fluentui/react-components';
import { useUiStore, useProjectStore, useDeckStore, useEditorStore } from '../../store';
import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { cardTemplates } from '../../shared/templates/cardTemplates';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  Button,
} from '@fluentui/react-components';

interface NavItem {
  icon: FluentIcon;
  label: string;
  tab: string;
  route: string;
}

const navItems: NavItem[] = [
  { icon: DesignIdeasRegular, label: 'Overview', tab: 'overview', route: '/editor' },
  { icon: PaintBrushRegular, label: 'Editor', tab: 'decks', route: '/editor' },
  { icon: TableRegular, label: 'Data', tab: 'data', route: '/editor' },
  { icon: ImageRegular, label: 'Assets', tab: 'assets', route: '/editor' },
  { icon: PlayRegular, label: 'Simulator', tab: 'simulator', route: '/simulator' },
  { icon: ArrowExportRegular, label: 'Export', tab: 'export', route: '/export' },
  { icon: SettingsRegular, label: 'Settings', tab: 'settings', route: '/settings' },
];

const useStyles = makeStyles({
  nav: {
    width: '240px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
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
    overflow: 'hidden',
    fontFamily: "'IBM Plex Sans', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px 20px',
    marginBottom: '8px',
    borderBottom: '1px solid var(--mica-stroke)',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 12px rgba(96, 205, 255, 0.3)',
  },
  logoText: {
    color: '#1c1c1c',
    fontWeight: 800,
    fontSize: '18px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  logoTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--mica-text-primary)',
    letterSpacing: '-0.3px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--mica-text-tertiary)',
    padding: '16px 16px 8px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 12px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'var(--mica-text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    position: 'relative',
    fontSize: '13px',
    fontWeight: 500,
    width: '100%',
    textAlign: 'left',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-2)',
      color: 'var(--mica-text-primary)',
    },
  },
  linkActive: {
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
    fontWeight: 600,
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
  deckList: {
    flex: 1,
    overflow: 'auto',
    padding: '0 12px',
  },
  deckItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--mica-text-secondary)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-2)',
      color: 'var(--mica-text-primary)',
    },
  },
  deckActive: {
    background: 'var(--mica-accent-tertiary)',
    color: 'var(--mica-accent)',
    fontWeight: 600,
  },
  deckIcon: {
    fontSize: '14px',
    opacity: 0.6,
  },
  bottomSection: {
    marginTop: 'auto',
    borderTop: '1px solid var(--mica-stroke)',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 12px 0',
  },
  noProject: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--mica-text-tertiary)',
    fontSize: '12px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  dialogSurface: {
    maxWidth: '560px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
  },
  dialogContent: {
    overflowY: 'auto',
    overflowX: 'hidden',
    flex: 1,
    paddingRight: '4px',
  },
  nameInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
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
    background: 'var(--mica-layer-1)',
    color: 'var(--mica-text-primary)',
    fontSize: '14px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
    },
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  templateCard: {
    padding: '14px',
    borderRadius: '10px',
    background: 'var(--mica-layer-1)',
    borderTopColor: 'var(--mica-stroke)',
    borderRightColor: 'var(--mica-stroke)',
    borderBottomColor: 'var(--mica-stroke)',
    borderLeftColor: 'var(--mica-stroke)',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
      transform: 'translateY(-1px)',
    },
  },
  templateCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  templateName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--mica-text-primary)',
    marginBottom: '6px',
  },
  templateDesc: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
    lineHeight: 1.4,
    marginBottom: '10px',
  },
  templateSize: {
    fontSize: '11px',
    color: 'var(--mica-text-tertiary)',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'var(--mica-layer-2)',
    display: 'inline-block',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--mica-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dialogActions: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--mica-stroke)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  deckActions: {
    display: 'flex',
    gap: '8px',
    padding: '0 12px',
    marginBottom: '8px',
  },
  quickAddBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flex: 1,
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--mica-text-primary)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
    background: 'var(--mica-layer-2)',
    textAlign: 'center',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-3)',
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
    },
  },
  templateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flex: 1,
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--mica-accent)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    background: 'var(--mica-accent-secondary)',
    textAlign: 'center',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-accent)',
      color: 'var(--mica-base-active)',
    },
  },
});

export function NavRail() {
  const styles = useStyles();
  const location = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);
  
  const manifest = useProjectStore((s) => s.manifest);
  const projectPath = useProjectStore((s) => s.projectPath);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const addDeck = useProjectStore((s) => s.addDeck);
  
  const handleNavClick = useCallback((item: NavItem) => {
    setSidebarTab(item.tab);
    navigate({ to: item.route });
  }, [setSidebarTab, navigate]);

  const handleSelectDeck = useCallback(async (deck: any) => {
    if (!projectPath) return;
    setActiveDeck(deck.id);
    const fullPath = `${projectPath}/${deck.path}`;
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
    setSidebarTab('decks');
    navigate({ to: '/editor' });
  }, [projectPath, setActiveDeck, loadTemplate, loadData, loadCardBack, setSidebarTab, navigate]);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof cardTemplates[0] | null>(null);
  const [deckName, setDeckName] = useState('');

  const handleQuickCreateDeck = useCallback(async () => {
    if (!projectPath) return;
    const name = `Deck ${(manifest?.decks.length || 0) + 1}`;
    addDeck(name, { widthMm: 63, heightMm: 88, bleedMm: 3 });
    
    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find((d: any) => d.name === name);
    
    if (newDeck) {
      const deckPath = `${projectPath}/${newDeck.path}`;
      try {
        await invoke('write_template', { 
          deckPath, 
          html: '<div class="card-root" style="position:relative;width:100%;height:100%;"></div>', 
          css: '.card-root { width: 100%; height: 100%; }' 
        });
        await handleSelectDeck(newDeck);
      } catch (e) {
        console.error('Failed to create deck:', e);
      }
    }
  }, [projectPath, manifest, addDeck, handleSelectDeck]);

  const handleOpenTemplateDialog = useCallback(() => {
    if (!projectPath) return;
    setDeckName(`Deck ${(manifest?.decks.length || 0) + 1}`);
    setSelectedTemplate(null);
    setIsTemplateDialogOpen(true);
  }, [projectPath, manifest]);

  const handleConfirmCreateDeck = useCallback(async () => {
    if (!projectPath || !deckName.trim()) return;
    
    const template = selectedTemplate || cardTemplates[0];
    addDeck(deckName, template.cardSize);
    
    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find((d: any) => d.name === deckName);
    
    if (newDeck) {
      const deckPath = `${projectPath}/${newDeck.path}`;
      try {
        await invoke('write_template', { 
          deckPath, 
          html: template.html, 
          css: template.css 
        });
        
        // Create CSV with sample data
        if (template.sampleData.length > 0) {
          const headers = Object.keys(template.sampleData[0]);
          const csvContent = [
            headers.join(','),
            ...template.sampleData.map(row => 
              headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
            )
          ].join('\n');
          
          await invoke('write_csv_content', { 
            path: `${deckPath}/cards.csv`, 
            content: csvContent 
          });
        }
        
        await handleSelectDeck(newDeck);
      } catch (e) {
        console.error('Failed to create deck:', e);
      }
    }
    
    setIsTemplateDialogOpen(false);
  }, [projectPath, deckName, selectedTemplate, addDeck, handleSelectDeck]);

  const mainNavItems = navItems.slice(0, 5);
  const bottomNavItems = navItems.slice(5);

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <span className={styles.logoText}>C</span>
        </div>
        <span className={styles.logoTitle}>CardForge</span>
      </div>

      <div className={styles.navItems}>
        {mainNavItems.map((item) => {
          const isActive = item.route === '/editor'
            ? sidebarTab === item.tab
            : location.pathname === item.route;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={mergeClasses(styles.link, isActive && styles.linkActive)}
            >
              <item.icon fontSize={18} />
              <span>{item.label}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      <div className={styles.sectionTitle}>Decks</div>
      
      {projectPath && (
        <div className={styles.deckActions}>
          <button
            onClick={handleQuickCreateDeck}
            className={styles.quickAddBtn}
            title="Quick add empty deck"
          >
            <AddRegular fontSize={14} />
            <span>Add</span>
          </button>
          <button
            onClick={handleOpenTemplateDialog}
            className={styles.templateBtn}
            title="Create from template"
          >
            <PaintBrushRegular fontSize={14} />
            <span>Template</span>
          </button>
        </div>
      )}
      
      <div className={styles.deckList}>
        {!projectPath ? (
          <div className={styles.noProject}>
            <Text size={200}>No project open</Text>
          </div>
        ) : (
          <>
            {manifest?.decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => handleSelectDeck(deck)}
                className={mergeClasses(
                  styles.deckItem,
                  activeDeckId === deck.id && styles.deckActive
                )}
              >
                <DocumentRegular fontSize={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deck.name}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      <div className={styles.bottomSection}>
        {bottomNavItems.map((item) => {
          const isActive = item.route === '/editor'
            ? sidebarTab === item.tab
            : location.pathname === item.route;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={mergeClasses(styles.link, isActive && styles.linkActive)}
            >
              <item.icon fontSize={18} />
              <span>{item.label}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={(_e, data) => setIsTemplateDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogTitle style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
            Create New Deck
          </DialogTitle>
          <DialogBody className={styles.dialogBody}>
            <div>
              <label className={styles.sectionLabel} style={{ marginBottom: '8px', display: 'block' }}>
                Deck Name
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className={styles.nameInput}
                placeholder="Enter deck name"
                autoFocus
              />
            </div>
            
            <div>
              <label className={styles.sectionLabel} style={{ marginBottom: '10px', display: 'block' }}>
                Choose Template
              </label>
              <div className={styles.dialogContent}>
                <div className={styles.templateGrid}>
                  {cardTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={mergeClasses(
                        styles.templateCard,
                        selectedTemplate?.id === template.id && styles.templateCardSelected
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className={styles.templateName}>{template.name}</div>
                      <div className={styles.templateDesc}>{template.description}</div>
                      <div className={styles.templateSize}>
                        {template.cardSize.widthMm}×{template.cardSize.heightMm}mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>
          <div className={styles.dialogActions}>
            <Button appearance="secondary" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleConfirmCreateDeck} 
              disabled={!deckName.trim()}
              style={{ minWidth: '120px' }}
            >
              Create Deck
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </nav>
  );
}
