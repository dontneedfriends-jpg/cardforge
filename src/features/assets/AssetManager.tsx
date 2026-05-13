import { Text, Button, makeStyles, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MessageBar, MessageBarBody, Input, Breadcrumb, BreadcrumbItem } from '@fluentui/react-components';
import { ImageRegular, DeleteRegular, CopyRegular, OpenRegular, FolderRegular, ArrowUploadRegular, AddRegular, WandRegular, SearchRegular, RenameRegular, DismissRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { AssetGeneratorDialog } from '../asset-generator';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toUpperCase() : '';
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    flexShrink: 0,
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
  },
  sortGroup: {
    display: 'flex',
    gap: '2px',
    marginLeft: 'auto',
  },
  sortBtn: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid var(--mica-stroke)',
    background: 'var(--mica-base)',
    color: 'var(--mica-text-tertiary)',
    cursor: 'pointer',
    ':hover': { background: 'var(--mica-layer-1)', color: 'var(--mica-text-primary)' },
  },
  sortBtnActive: {
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
  },
  breadcrumb: {
    padding: '8px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    flexShrink: 0,
  },
  detailStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    flexShrink: 0,
  },
  detailPreview: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'cover',
    background: 'var(--mica-layer-2)',
    flexShrink: 0,
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  detailName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--mica-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailMeta: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
  detailActions: {
    display: 'flex',
    gap: '6px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  folderSidebar: {
    width: '200px',
    minWidth: '200px',
    background: 'var(--mica-base)',
    borderRight: '1px solid var(--mica-stroke)',
    overflow: 'auto',
    padding: '8px',
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--mica-text-secondary)',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'var(--mica-layer-1)',
      color: 'var(--mica-text-primary)',
    },
  },
  folderActive: {
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
    ':hover': {
      background: 'var(--mica-accent-secondary)',
    },
  },
  folderIcon: {
    fontSize: '16px',
    opacity: 0.7,
  },
  gridArea: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
    alignContent: 'flex-start',
  },
  folderCard: {
    padding: '16px',
    borderRadius: '10px',
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
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mica-shadow-md)',
    },
  },
  folderIconLarge: {
    fontSize: '48px',
    color: 'var(--mica-accent)',
    marginBottom: '8px',
    opacity: 0.8,
  },
  assetCard: {
    padding: '12px',
    borderRadius: '10px',
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
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mica-shadow-md)',
    },
  },
  assetCardSelected: {
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  thumbnail: {
    width: '100%',
    height: '96px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '8px',
    background: 'var(--mica-layer-2)',
  },
  fileName: {
    fontSize: '11px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--mica-text-secondary)',
  },
  fileSize: {
    fontSize: '10px',
    color: 'var(--mica-text-tertiary)',
    marginTop: '2px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    color: 'var(--mica-text-tertiary)',
  },
  errorBar: {
    margin: '12px 20px 0',
    flexShrink: 0,
  },
  renameInput: {
    fontSize: '13px',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--mica-accent)',
    background: 'var(--mica-layer-2)',
    color: 'var(--mica-text-primary)',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  noResults: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: 'var(--mica-text-tertiary)',
    gap: '8px',
  },
});

interface AssetEntry {
  name: string;
  path: string;
  relativePath: string;
  sizeBytes: number;
  thumbnailBase64?: string;
  isFolder: boolean;
}

type SortKey = 'name' | 'size';

export function AssetManager() {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('assets');
  const [deleteTarget, setDeleteTarget] = useState<AssetEntry | null>(null);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [generatorDialog, setGeneratorDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [selectedAsset, setSelectedAsset] = useState<AssetEntry | null>(null);
  const [renamingAsset, setRenamingAsset] = useState<AssetEntry | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadAssets = useCallback(async () => {
    if (!projectPath) return;
    try {
      setError(null);
      const result = await invoke('list_assets', { projectPath }) as AssetEntry[];
      setAssets(result);
    } catch (e: any) {
      setError(`Failed to load assets: ${e?.message || e}`);
      setAssets([]);
    }
  }, [projectPath]);

  useEffect(() => {
    async function init() {
      if (!projectPath) return;
      try {
        await invoke('create_asset_folder', { projectPath, folderPath: 'assets' });
      } catch {}
      await loadAssets();
    }
    init();
  }, [loadAssets, projectPath]);

  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    folderSet.add('assets');
    assets.forEach(asset => {
      if (!asset.relativePath) return;
      if (asset.isFolder) {
        folderSet.add(asset.relativePath);
      }
      const parts = asset.relativePath.split('/');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}/${parts[i]}` : parts[i];
        folderSet.add(path);
      }
    });
    return Array.from(folderSet).sort();
  }, [assets]);

  const currentItems = useMemo(() => {
    let items = (assets || []).filter(asset => {
      if (!asset || !asset.relativePath) return false;
      const lastSlashIndex = asset.relativePath.lastIndexOf('/');
      const parent = lastSlashIndex === -1 ? '' : asset.relativePath.substring(0, lastSlashIndex);
      return parent === currentFolder;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a => a.name.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [assets, currentFolder, searchQuery, sortBy]);

  const breadcrumbParts = currentFolder.split('/');

  const handleImport = async () => {
    if (!projectPath) {
      setError('No project is open');
      return;
    }
    setError(null);
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Images & Fonts',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ttf', 'otf'],
        }],
      });
      if (!selected) return;
      const files = Array.isArray(selected) ? selected : [selected];
      let successCount = 0;
      const errors: string[] = [];
      for (const file of files) {
        try {
          await invoke('import_asset', {
            projectPath,
            sourcePath: file,
            targetFolder: currentFolder,
          });
          successCount++;
        } catch (e: any) {
          const fileName = file.split(/[/\\]/).pop() || file;
          errors.push(`${fileName}: ${e?.message || e}`);
        }
      }
      if (successCount > 0) {
        await loadAssets();
        if (errors.length > 0) {
          setError(`Imported ${successCount}/${files.length}. Errors: ${errors.join('; ')}`);
        }
      } else if (errors.length > 0) {
        setError(`All imports failed: ${errors.join('; ')}`);
      }
    } catch (e: any) {
      setError(`Failed to open dialog: ${e?.message || e}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!projectPath || !newFolderName.trim()) return;
    const folderPath = currentFolder === 'assets'
      ? `assets/${newFolderName.trim()}`
      : `${currentFolder}/${newFolderName.trim()}`;
    try {
      setError(null);
      await invoke('create_asset_folder', { projectPath, folderPath });
      setNewFolderName('');
      setNewFolderDialog(false);
      await loadAssets();
    } catch (e: any) {
      setError(`Failed to create folder '${folderPath}': ${e?.message || e}`);
    }
  };

  const handleDelete = async (asset: AssetEntry) => {
    try {
      if (asset.isFolder) {
        await invoke('delete_asset_folder', { folderPath: asset.path });
      } else {
        await invoke('delete_asset', { assetPath: asset.path });
      }
      if (selectedAsset?.path === asset.path) setSelectedAsset(null);
      await loadAssets();
    } catch (e: any) {
      setError(`Failed to delete: ${e?.message || e}`);
    }
    setDeleteTarget(null);
  };

  const handleCopyPath = async (relativePath: string) => {
    try {
      await navigator.clipboard.writeText(relativePath);
    } catch {
      setError('Failed to copy path');
    }
  };

  const handleRenameStart = (asset: AssetEntry) => {
    setRenamingAsset(asset);
    setRenameValue(asset.name);
  };

  const handleRenameSubmit = async () => {
    if (!renamingAsset || !renameValue.trim() || renameValue === renamingAsset.name) {
      setRenamingAsset(null);
      return;
    }
    try {
      const dir = renamingAsset.path.substring(0, renamingAsset.path.lastIndexOf('/') + 1);
      const newPath = `${dir}${renameValue.trim()}`;
      await invoke('move_asset', { sourcePath: renamingAsset.path, destPath: newPath });
      setRenamingAsset(null);
      if (selectedAsset?.path === renamingAsset.path) {
        setSelectedAsset({ ...selectedAsset, name: renameValue.trim(), path: newPath, relativePath: `${currentFolder}/${renameValue.trim()}` });
      }
      await loadAssets();
    } catch (e: any) {
      setError(`Failed to rename: ${e?.message || e}`);
      setRenamingAsset(null);
    }
  };

  const handleSelect = (asset: AssetEntry) => {
    if (renamingAsset) return;
    if (asset.isFolder) {
      setCurrentFolder(asset.relativePath);
      setSelectedAsset(null);
    } else {
      setSelectedAsset(prev => prev?.path === asset.path ? null : asset);
    }
  };

  if (!projectPath) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={400} weight="semibold">Assets</Text>
        </div>
        <div className={styles.empty}>
          <FolderRegular fontSize={48} />
          <Text size={300}>Open a project to manage assets</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">Assets</Text>
        <div className={styles.toolbar}>
          <Button icon={<AddRegular />} size="small" onClick={() => setNewFolderDialog(true)} appearance="subtle">
            New Folder
          </Button>
          <Button icon={<WandRegular />} size="small" onClick={() => setGeneratorDialog(true)} appearance="subtle">
            Generate
          </Button>
          <Button icon={<ArrowUploadRegular />} size="small" onClick={handleImport} appearance="primary">
            Import
          </Button>
        </div>
      </div>

      <div className={styles.searchRow}>
        <Input
          className={styles.searchInput}
          placeholder="Search assets..."
          contentBefore={<SearchRegular />}
          value={searchQuery}
          onChange={(_e, d) => setSearchQuery(d.value)}
          appearance="outline"
          size="small"
        />
        <div className={styles.sortGroup}>
          <button
            className={`${styles.sortBtn} ${sortBy === 'name' ? styles.sortBtnActive : ''}`}
            onClick={() => setSortBy('name')}
          >
            Name
          </button>
          <button
            className={`${styles.sortBtn} ${sortBy === 'size' ? styles.sortBtnActive : ''}`}
            onClick={() => setSortBy('size')}
          >
            Size
          </button>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Breadcrumb>
          {breadcrumbParts.map((part, index) => (
            <BreadcrumbItem
              key={`item-${index}`}
              onClick={() => {
                const path = breadcrumbParts.slice(0, index + 1).join('/');
                setCurrentFolder(path);
                setSelectedAsset(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {part}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>

      {selectedAsset && !selectedAsset.isFolder && (
        <div className={styles.detailStrip}>
          {selectedAsset.thumbnailBase64 ? (
            <img src={selectedAsset.thumbnailBase64} alt={selectedAsset.name} className={styles.detailPreview} />
          ) : (
            <div className={styles.detailPreview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mica-text-tertiary)' }}>
              <ImageRegular fontSize={24} />
            </div>
          )}
          <div className={styles.detailInfo}>
            <div className={styles.detailName}>{selectedAsset.name}</div>
            <div className={styles.detailMeta}>
              {formatSize(selectedAsset.sizeBytes)} &middot; {getExtension(selectedAsset.name)} &middot; {selectedAsset.relativePath}
            </div>
          </div>
          <div className={styles.detailActions}>
            <Button icon={<CopyRegular />} size="small" appearance="subtle" onClick={() => handleCopyPath(selectedAsset.relativePath)} title="Copy relative path" />
            <Button icon={<OpenRegular />} size="small" appearance="subtle" onClick={() => invoke('open_asset_externally', { assetPath: selectedAsset.path }).catch(() => {})} title="Open externally" />
            <Button icon={<RenameRegular />} size="small" appearance="subtle" onClick={() => handleRenameStart(selectedAsset)} title="Rename" />
            <Button icon={<DismissRegular />} size="small" appearance="subtle" onClick={() => setSelectedAsset(null)} title="Deselect" />
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorBar}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.folderSidebar}>
          {folders.map(folder => {
            const name = folder.split('/').pop() || folder;
            const depth = folder.split('/').length - 1;
            return (
              <div
                key={folder}
                className={`${styles.folderItem} ${folder === currentFolder ? styles.folderActive : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => { setCurrentFolder(folder); setSelectedAsset(null); }}
              >
                <FolderRegular className={styles.folderIcon} />
                <span>{name}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.gridArea}>
          {currentItems.length === 0 && !searchQuery ? (
            <div className={styles.empty}>
              <ImageRegular fontSize={48} />
              <Text size={300}>No assets in this folder</Text>
              <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
                Import images or create folders to organize assets
              </Text>
            </div>
          ) : currentItems.length === 0 && searchQuery ? (
            <div className={styles.empty}>
              <SearchRegular fontSize={48} />
              <Text size={300}>No results for &ldquo;{searchQuery}&rdquo;</Text>
            </div>
          ) : (
            <div className={styles.grid}>
              {currentItems.map((asset) => (
                <Menu key={asset.path}>
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      className={`${asset.isFolder ? styles.folderCard : styles.assetCard} ${selectedAsset?.path === asset.path ? styles.assetCardSelected : ''}`}
                      title={asset.name}
                      onClick={() => handleSelect(asset)}
                      draggable={!asset.isFolder}
                      onDragStart={(e) => {
                        if (!asset.isFolder) {
                          e.dataTransfer.setData('elementType', 'image');
                          e.dataTransfer.setData('assetPath', asset.relativePath);
                          e.dataTransfer.effectAllowed = 'copy';
                        }
                      }}
                    >
                      {asset.isFolder ? (
                        <>
                          <div className={styles.folderIconLarge}><FolderRegular /></div>
                          <div className={styles.fileName}>{asset.name}</div>
                        </>
                      ) : renamingAsset?.path === asset.path ? (
                        <input
                          className={styles.renameInput}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={handleRenameSubmit}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenamingAsset(null); }}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                        />
                      ) : asset.thumbnailBase64 ? (
                        <>
                          <img src={asset.thumbnailBase64} alt={asset.name} className={styles.thumbnail} />
                          <div className={styles.fileName}>{asset.name}</div>
                          <div className={styles.fileSize}>{formatSize(asset.sizeBytes)}</div>
                        </>
                      ) : (
                        <>
                          <div className={styles.thumbnail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mica-text-tertiary)' }}>
                            <ImageRegular fontSize={24} />
                          </div>
                          <div className={styles.fileName}>{asset.name}</div>
                        </>
                      )}
                    </div>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {!asset.isFolder && renamingAsset?.path !== asset.path && (
                        <MenuItem icon={<RenameRegular />} onClick={() => handleRenameStart(asset)}>Rename</MenuItem>
                      )}
                      <MenuItem icon={<CopyRegular />} onClick={() => handleCopyPath(asset.relativePath)}>Copy relative path</MenuItem>
                      {!asset.isFolder && (
                        <MenuItem icon={<OpenRegular />} onClick={() => invoke('open_asset_externally', { assetPath: asset.path }).catch(() => {})}>Open externally</MenuItem>
                      )}
                      <MenuItem icon={<DeleteRegular />} onClick={() => setDeleteTarget(asset)}>Delete</MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              ))}
            </div>
          )}
        </div>
      </div>

      <AssetGeneratorDialog open={generatorDialog} onOpenChange={setGeneratorDialog} onSaved={loadAssets} />
      <Dialog open={newFolderDialog} onOpenChange={() => { setNewFolderDialog(false); setNewFolderName(''); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogContent>
              <Input placeholder="Folder name" value={newFolderName} onChange={(_e, data) => setNewFolderName(data.value)} autoFocus />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setNewFolderDialog(false); setNewFolderName(''); }}>Cancel</Button>
              <Button appearance="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete {deleteTarget?.isFolder ? 'Folder' : 'Asset'}?</DialogTitle>
            <DialogContent>
              {deleteTarget?.isFolder ? 'All contents will be deleted.' : `"${deleteTarget?.name}" will be permanently removed.`}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                appearance="primary"
                style={{ background: 'var(--mica-error)', borderColor: 'var(--mica-error)' }}
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
              >
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
