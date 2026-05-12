import { Text, Button, makeStyles, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MessageBar, MessageBarBody, Input, Breadcrumb, BreadcrumbItem } from '@fluentui/react-components';
import { ImageRegular, DeleteRegular, CopyRegular, OpenRegular, FolderRegular, ArrowUploadRegular, FolderOpenRegular, AddRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useCallback, useMemo } from 'react';

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
  breadcrumb: {
    padding: '8px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
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
});

interface AssetEntry {
  name: string;
  path: string;
  relativePath: string;
  sizeBytes: number;
  thumbnailBase64?: string;
  isFolder: boolean;
}

export function AssetManager() {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('assets');
  const [deleteTarget, setDeleteTarget] = useState<AssetEntry | null>(null);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      // Ensure the assets directory exists first
      try {
        await invoke('create_asset_folder', { projectPath, folderPath: 'assets' });
      } catch (_) {}
      await loadAssets();
    }
    init();
  }, [loadAssets, projectPath]);

  // Build folder tree
  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    folderSet.add('assets');
    
    assets.forEach(asset => {
      if (!asset.relativePath) return;
      
      if (asset.isFolder) {
        folderSet.add(asset.relativePath);
      }
      // Also add parent folders
      const parts = asset.relativePath.split('/');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}/${parts[i]}` : parts[i];
        folderSet.add(path);
      }
    });
    
    return Array.from(folderSet).sort();
  }, [assets]);

  // Get items in current folder
  const currentItems = useMemo(() => {
    return (assets || []).filter(asset => {
      if (!asset || !asset.relativePath) return false;
      const lastSlashIndex = asset.relativePath.lastIndexOf('/');
      const parent = lastSlashIndex === -1 ? '' : asset.relativePath.substring(0, lastSlashIndex);
      return parent === currentFolder;
    });
  }, [assets, currentFolder]);

  // Breadcrumb path
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
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ttf', 'otf'] 
        }] 
      });
      
      if (!selected) return;
      
      const files = Array.isArray(selected) ? selected : [selected];
      let successCount = 0;
      const errors: string[] = [];
      
      for (const file of files) {
        try {
          console.log('[Import] Importing to folder:', currentFolder);
          await invoke('import_asset', { 
            projectPath, 
            sourcePath: file,
            targetFolder: currentFolder 
          });
          successCount++;
        } catch (e: any) {
          const fileName = file.split(/[/\\]/).pop() || file;
          errors.push(`${fileName}: ${e?.message || e}`);
          console.error('Failed to import:', file, e);
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
      await loadAssets();
    } catch (e: any) {
      setError(`Failed to delete: ${e?.message || e}`);
    }
    setDeleteTarget(null);
  };

  const handleCopyPath = async (relativePath: string) => {
    try {
      await navigator.clipboard.writeText(relativePath);
    } catch (e) {
      setError('Failed to copy path');
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
            <Button 
            icon={<AddRegular />} 
            size="small" 
            onClick={() => setNewFolderDialog(true)}
            appearance="subtle"
          >
            New Folder
          </Button>
          <Button 
            icon={<ArrowUploadRegular />} 
            size="small" 
            onClick={handleImport}
            appearance="primary"
          >
            Import
          </Button>
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
              }}
              style={{ cursor: 'pointer' }}
            >
              {part}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>

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
                onClick={() => setCurrentFolder(folder)}
              >
                <FolderRegular className={styles.folderIcon} />
                <span>{name}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.gridArea}>
          {currentItems.length === 0 ? (
            <div className={styles.empty}>
              <ImageRegular fontSize={48} />
              <Text size={300}>No assets in this folder</Text>
              <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
                Import images or create folders to organize assets
              </Text>
            </div>
          ) : (
            <div className={styles.grid}>
              {currentItems.map((asset) => (
                <Menu key={asset.path}>
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      className={asset.isFolder ? styles.folderCard : styles.assetCard}
                      title={asset.name}
                      onDoubleClick={() => {
                        if (asset.isFolder) setCurrentFolder(asset.relativePath);
                      }}
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
                          <div className={styles.folderIconLarge}>
                            <FolderOpenRegular />
                          </div>
                          <div className={styles.fileName}>{asset.name}</div>
                        </>
                      ) : asset.thumbnailBase64 ? (
                        <>
                          <img 
                            src={asset.thumbnailBase64} 
                            alt={asset.name} 
                            className={styles.thumbnail}
                          />
                          <div className={styles.fileName}>{asset.name}</div>
                          <div className={styles.fileSize}>
                            {(asset.sizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.thumbnail} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--mica-text-tertiary)'
                          }}>
                            <ImageRegular fontSize={24} />
                          </div>
                          <div className={styles.fileName}>{asset.name}</div>
                        </>
                      )}
                    </div>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem icon={<CopyRegular />} onClick={() => handleCopyPath(asset.relativePath)}>
                        Copy relative path
                      </MenuItem>
                      {!asset.isFolder && (
                        <MenuItem icon={<OpenRegular />} onClick={() => invoke('open_asset_externally', { assetPath: asset.path }).catch(() => {})}>
                          Open externally
                        </MenuItem>
                      )}
                      <MenuItem icon={<DeleteRegular />} onClick={() => setDeleteTarget(asset)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={newFolderDialog} onOpenChange={() => setNewFolderDialog(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogContent>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(_e, data) => setNewFolderName(data.value)}
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setNewFolderDialog(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete {deleteTarget?.isFolder ? 'Folder' : 'Asset'}?</DialogTitle>
            <DialogContent>
              This action cannot be undone. {deleteTarget?.isFolder ? 'All contents will be deleted.' : 'The file will be permanently removed.'}
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
