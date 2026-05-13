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
  HatGraduationRegular,
  SaveRegular,
  DeleteRegular,
  OpenRegular,
  DocumentAddRegular,
  RenameRegular,
  ContentViewGalleryRegular,
  type FluentIcon,
} from '@fluentui/react-icons';
import { makeStyles, mergeClasses, Text } from '@fluentui/react-components';
import { useUiStore, useProjectStore, useDeckStore, useEditorStore } from '../../store';
import { useCallback, useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { DEFAULT_CARD_SIZE } from '../cardSizes';
import type { DeckMeta, BoardMeta } from '../../shared/types/project';
import { TemplateWizardDialog } from '../../features/template-wizard/TemplateWizardDialog';
import { SettingsDialog } from '../../features/settings/SettingsDialog';

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
  logoWrapper: {
    position: 'relative',
  },
  logoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px 20px',
    marginBottom: '8px',
    borderBottom: '1px solid var(--mica-stroke)',
    cursor: 'pointer',
    background: 'none',
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  fileMenu: {
    position: 'fixed',
    top: '12px',
    left: '248px',
    width: '220px',
    background: 'var(--mica-layer-2)',
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
    backdropFilter: 'blur(60px)',
    WebkitBackdropFilter: 'blur(60px)',
    zIndex: 100,
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    padding: '4px 0',
  },
  fileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--mica-text-primary)',
    transition: 'background 0.15s',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-3)',
    },
  },
  fileMenuSeparator: {
    height: '1px',
    background: 'var(--mica-stroke)',
    margin: '4px 0',
  },
  fileMenuSection: {
    padding: '6px 14px 4px',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  contextMenu: {
    position: 'fixed',
    width: '160px',
    background: 'var(--mica-layer-2)',
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
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(60px)',
    WebkitBackdropFilter: 'blur(60px)',
    zIndex: 200,
    overflow: 'hidden',
    padding: '4px 0',
  },
  contextMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--mica-text-primary)',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
    fontFamily: "'IBM Plex Sans', sans-serif",
    ':hover': {
      background: 'var(--mica-layer-3)',
    },
  },
  contextMenuDanger: {
    color: '#e74c3c',
    ':hover': {
      background: 'rgba(231, 76, 60, 0.1)',
    },
  },
  renameInput: {
    width: '100%',
    padding: '4px 6px',
    fontSize: '12px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRadius: '4px',
    outline: 'none',
    background: 'var(--mica-layer-1)',
    color: 'var(--mica-text-primary)',
    boxSizing: 'border-box',
  },
  saveBtn: {
    color: 'var(--mica-accent)',
    fontWeight: 600,
    marginBottom: '4px',
    ':hover': {
      background: 'var(--mica-accent-secondary)',
      color: 'var(--mica-accent)',
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
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const addDeck = useProjectStore((s) => s.addDeck);
  const removeDeck = useProjectStore((s) => s.removeDeck);
  const renameDeck = useProjectStore((s) => s.renameDeck);
  const openProject = useProjectStore((s) => s.openProject);
  const createProject = useProjectStore((s) => s.createProject);
  const saveManifest = useProjectStore((s) => s.saveManifest);
  const addBoard = useProjectStore((s) => s.addBoard);
  const removeBoard = useProjectStore((s) => s.removeBoard);
  const renameBoard = useProjectStore((s) => s.renameBoard);
  const activeBoardId = useEditorStore((s) => s.activeBoardId);
  const setActiveBoard = useEditorStore((s) => s.setActiveBoard);

  const [isWizardDialogOpen, setIsWizardDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ type: 'deck' | 'board'; id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renamingIdRef = useRef(renamingId);
  renamingIdRef.current = renamingId;
  const [renameValue, setRenameValue] = useState('');
  const renameValueRef = useRef(renameValue);
  renameValueRef.current = renameValue;
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (logoButtonRef.current?.contains(e.target as Node)) return;
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
      }
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFileMenuOpen(false);
        setContextMenu(null);
        setRenamingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  const handleNavClick = useCallback((item: NavItem) => {
    setSidebarTab(item.tab);
    navigate({ to: item.route });
  }, [setSidebarTab, navigate]);

  const handleSelectDeck = useCallback(async (deck: DeckMeta) => {
    if (!projectPath) return;
    setActiveDeck(deck.id);
    setActiveBoard(null);
    const fullPath = `${projectPath}/${deck.path}`;
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
    setSidebarTab('decks');
    navigate({ to: '/editor' });
  }, [projectPath, setActiveDeck, setActiveBoard, loadTemplate, loadData, loadCardBack, setSidebarTab, navigate]);

  const handleSelectBoard = useCallback(async (board: BoardMeta) => {
    if (!projectPath) return;
    setActiveBoard(board.id);
    setActiveDeck('');
    const fullPath = `${projectPath}/${board.path}`;
    await loadTemplate(fullPath);
    setSidebarTab('decks');
    navigate({ to: '/editor' });
  }, [projectPath, setActiveBoard, setActiveDeck, loadTemplate, setSidebarTab, navigate]);

  const handleSaveAll = useCallback(async () => {
    if (!projectPath) return;
    try {
      await useEditorStore.getState().saveTemplate();
      await useDeckStore.getState().saveData();
      await useEditorStore.getState().saveCardBack();
      await saveManifest();
    } catch (e) {
      console.error('Save All failed:', e);
    }
  }, [projectPath, saveManifest]);

  const handleQuickCreateDeck = useCallback(async () => {
    if (!projectPath) return;
    const name = `Deck ${(manifest?.decks.length || 0) + 1}`;
    await addDeck(name, DEFAULT_CARD_SIZE);
    
    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find((d: DeckMeta) => d.name === name);
    
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

  const handleQuickCreateBoard = useCallback(async () => {
    if (!projectPath) return;
    const name = `Board ${(manifest?.boards.length || 0) + 1}`;
    await addBoard(name, 420, 297);
    
    const updatedManifest = useProjectStore.getState().manifest;
    const newBoard = updatedManifest?.boards.find((b: BoardMeta) => b.name === name);
    
    if (newBoard) {
      await handleSelectBoard(newBoard);
    }
  }, [projectPath, manifest, addBoard, handleSelectBoard]);

  const handleDeleteItem = useCallback(async () => {
    const menu = contextMenu;
    setContextMenu(null);
    if (!menu) return;
    if (menu.type === 'deck') {
      await removeDeck(menu.id);
      if (activeDeckId === menu.id) setActiveDeck('');
    } else {
      await removeBoard(menu.id);
      if (activeBoardId === menu.id) setActiveBoard(null);
    }
  }, [contextMenu, removeDeck, removeBoard, activeDeckId, activeBoardId, setActiveDeck, setActiveBoard]);

  const handleStartRename = useCallback(() => {
    const menu = contextMenu;
    setContextMenu(null);
    if (!menu) return;
    const item = menu.type === 'deck'
      ? manifest?.decks.find(d => d.id === menu.id)
      : manifest?.boards.find(b => b.id === menu.id);
    if (item) {
      setRenamingId(menu.id);
      setRenameValue(item.name);
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [contextMenu, manifest]);

  const handleFinishRename = useCallback(async () => {
    const id = renamingIdRef.current;
    const val = renameValueRef.current ? renameValueRef.current.trim() : '';
    if (id && val) {
      const isBoard = manifest?.boards.some(b => b.id === id);
      if (isBoard) {
        await renameBoard(id, val);
      } else {
        await renameDeck(id, val);
      }
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renameDeck, renameBoard, manifest]);

  const handleFileNewProject = useCallback(async () => {
    setFileMenuOpen(false);
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        const name = selected.split(/[\\/]/).filter(Boolean).pop() || 'Untitled';
        await createProject(selected, name);
        navigate({ to: '/editor' });
      }
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  }, [createProject, navigate]);

  const handleFileOpenProject = useCallback(async () => {
    setFileMenuOpen(false);
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        await openProject(selected);
        navigate({ to: '/editor' });
      }
    } catch (e) {
      console.error('Failed to open project:', e);
    }
  }, [openProject, navigate]);

  const handleFileOpenRecent = useCallback(async (path: string) => {
    setFileMenuOpen(false);
    try {
      await openProject(path);
      navigate({ to: '/editor' });
    } catch (e) {
      console.error('Failed to open recent project:', e);
    }
  }, [openProject, navigate]);

  const handleFileSettings = useCallback(() => {
    setFileMenuOpen(false);
    setSettingsDialogOpen(true);
  }, []);

  const mainNavItems = navItems.slice(0, 5);
  const bottomNavItems = navItems.slice(5);

  return (
    <nav className={styles.nav}>
      <div className={styles.logoWrapper}>
        <button ref={logoButtonRef} className={styles.logoButton} onClick={() => setFileMenuOpen((v) => !v)}>
          <div className={styles.logoIcon}>
            <span className={styles.logoText}>C</span>
          </div>
          <span className={styles.logoTitle}>CardForge</span>
        </button>
        
        {fileMenuOpen && (
          <div ref={fileMenuRef} className={styles.fileMenu}>
            <button className={styles.fileMenuItem} onClick={handleFileNewProject}>
              <DocumentAddRegular fontSize={16} />
              <span>New Project</span>
            </button>
            <button className={styles.fileMenuItem} onClick={handleFileOpenProject}>
              <OpenRegular fontSize={16} />
              <span>Open Project</span>
            </button>
            
            {recentProjects.length > 0 && (
              <>
                <div className={styles.fileMenuSeparator} />
                <div className={styles.fileMenuSection}>Recent</div>
                {recentProjects.slice(0, 5).map((p) => (
                  <button key={p.path} className={styles.fileMenuItem} onClick={() => handleFileOpenRecent(p.path)}>
                    <DocumentRegular fontSize={16} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </button>
                ))}
              </>
            )}
            
            <div className={styles.fileMenuSeparator} />
            <button className={styles.fileMenuItem} onClick={handleSaveAll}>
              <SaveRegular fontSize={16} />
              <span>Save All</span>
            </button>
            <button className={styles.fileMenuItem} onClick={handleFileSettings}>
              <SettingsRegular fontSize={16} />
              <span>Settings</span>
            </button>
          </div>
        )}
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
            onClick={() => setIsWizardDialogOpen(true)}
            className={styles.templateBtn}
            title="Template Wizard — step by step"
          >
            <HatGraduationRegular fontSize={14} />
            <span>Wizard</span>
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
              <div key={deck.id} style={{ position: 'relative' }}>
                {renamingId === deck.id ? (
                  <input
                    ref={renameInputRef}
                    className={styles.renameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                        setRenameValue('');
                      }
                    }}
                    style={{ margin: '4px 0' }}
                  />
                ) : (
                  <button
                    onClick={() => handleSelectDeck(deck)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ type: 'deck', id: deck.id, x: e.clientX, y: e.clientY });
                    }}
                    className={mergeClasses(
                      styles.deckItem,
                      activeDeckId === deck.id && styles.deckActive
                    )}
                  >
                    <DocumentRegular fontSize={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {deck.name}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div className={styles.sectionTitle}>Boards</div>

      {projectPath && (
        <div className={styles.deckActions}>
          <button
            onClick={handleQuickCreateBoard}
            className={styles.quickAddBtn}
            title="Quick add empty board"
          >
            <AddRegular fontSize={14} />
            <span>Add</span>
          </button>
        </div>
      )}

      <div className={styles.deckList}>
        {manifest?.boards.map((board) => (
          <div key={board.id} style={{ position: 'relative' }}>
            {renamingId === board.id ? (
              <input
                ref={renameInputRef}
                className={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                style={{ margin: '4px 0' }}
              />
            ) : (
              <button
                onClick={() => handleSelectBoard(board)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ type: 'board', id: board.id, x: e.clientX, y: e.clientY });
                }}
                className={mergeClasses(
                  styles.deckItem,
                  activeBoardId === board.id && styles.deckActive
                )}
              >
                <ContentViewGalleryRegular fontSize={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {board.name}
                </span>
                <span style={{ fontSize: 10, opacity: 0.4, fontFamily: 'monospace' }}>
                  {board.widthMm}×{board.heightMm}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(e) => { e.preventDefault(); }}
        >
          <button className={styles.contextMenuItem} onClick={handleStartRename}>
            <RenameRegular fontSize={14} />
            <span>Rename</span>
          </button>
          <button
            className={mergeClasses(styles.contextMenuItem, styles.contextMenuDanger)}
            onClick={handleDeleteItem}
          >
            <DeleteRegular fontSize={14} />
            <span>Delete</span>
          </button>
        </div>
      )}

      <div className={styles.bottomSection}>
        <button
          onClick={handleSaveAll}
          className={mergeClasses(styles.link, styles.saveBtn)}
        >
          <SaveRegular fontSize={18} />
          <span>Save All</span>
        </button>
        {bottomNavItems.map((item) => {
          const isActive = item.route === '/editor'
            ? sidebarTab === item.tab
            : location.pathname === item.route;

          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.tab === 'settings') {
                  setSettingsDialogOpen(true);
                } else {
                  handleNavClick(item);
                }
              }}
              className={mergeClasses(styles.link, isActive && styles.linkActive)}
            >
              <item.icon fontSize={18} />
              <span>{item.label}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      <TemplateWizardDialog open={isWizardDialogOpen} onOpenChange={setIsWizardDialogOpen} />
      <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </nav>
  );
}
