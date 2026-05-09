import { Text, Button, makeStyles, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { ImageRegular, AddRegular, DeleteRegular, CopyRegular, OpenRegular, FolderRegular, ArrowUploadRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useCallback } from 'react';

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
    padding: '16px 20px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    flexShrink: 0,
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  dropZone: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  dropZoneActive: {
    background: 'var(--mica-accent-secondary)',
    border: '2px dashed var(--mica-accent)',
    borderRadius: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
    alignContent: 'flex-start',
  },
  card: {
    padding: '12px',
    borderRadius: '12px',
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
    minHeight: '300px',
  },
  errorBar: {
    margin: '12px 20px 0',
    flexShrink: 0,
  },
});

interface AssetEntry {
  name: string;
  path: string;
  size?: number;
  thumbnailBase64?: string;
}

export function AssetManager() {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadAssets = useCallback(async () => {
    if (!projectPath) return;
    try {
      setError(null);
      console.log('Loading assets from:', projectPath);
      
      const result = await invoke('list_assets', { projectPath }) as any[];
      console.log('Assets loaded:', result.length);
      
      setAssets(result.map((a: any) => ({
        name: a.name,
        path: a.path,
        size: a.sizeBytes,
        thumbnailBase64: a.thumbnailBase64,
      })));
    } catch (e: any) {
      console.error('Failed to load assets:', e);
      setError(`Failed to load assets: ${e?.message || e}`);
      setAssets([]);
    }
  }, [projectPath]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleImportFiles = async (files: string[]) => {
    if (!projectPath) {
      setError('No project is open');
      return;
    }
    
    setError(null);
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      try {
        console.log('Importing asset:', file);
        await invoke('import_asset', { projectPath, sourcePath: file });
        successCount++;
      } catch (e: any) {
        console.error('Failed to import asset:', file, e);
        errorCount++;
      }
    }
    
    if (errorCount > 0) {
      setError(`Imported ${successCount} files, ${errorCount} failed. Check console for details.`);
    }
    
    if (successCount > 0) {
      loadAssets();
    }
  };

  const handleImport = async () => {
    if (!projectPath) {
      setError('No project is open');
      return;
    }
    
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
      console.log('Selected files:', files);
      await handleImportFiles(files);
    } catch (e: any) {
      console.error('Failed to open file dialog:', e);
      setError(`Failed to open file dialog: ${e?.message || e}`);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await invoke('delete_asset', { assetPath: path });
      loadAssets();
    } catch (e: any) {
      console.error('Failed to delete asset:', e);
      setError(`Failed to delete asset: ${e?.message || e}`);
    }
    setDeleteTarget(null);
  };

  const handleCopyPath = async (path: string) => {
    try {
      const relativePath = path.replace(`${projectPath}/`, '');
      await navigator.clipboard.writeText(relativePath);
    } catch (e) {
      console.error('Failed to copy path', e);
      setError('Failed to copy path to clipboard');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!projectPath) {
      setError('No project is open');
      return;
    }
    
    // Browser drag & drop doesn't provide full file paths for security reasons
    setError('Please use the Import button to select files from your computer');
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
        <Text size={400} weight="semibold">Assets ({assets.length})</Text>
        <div className={styles.toolbar}>
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

      {error && (
        <div className={styles.errorBar}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}
      
      <div 
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {assets.length === 0 ? (
          <div className={styles.empty}>
            <ImageRegular fontSize={48} />
            <Text size={300}>No assets yet</Text>
            <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
              Click Import to add images from your computer
            </Text>
            <Button 
              icon={<AddRegular />} 
              size="small" 
              onClick={handleImport}
              appearance="secondary"
            >
              Import Images
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {assets.map((asset) => (
              <Menu key={asset.name}>
                <MenuTrigger disableButtonEnhancement>
                  <div
                    className={styles.card}
                    title={asset.name}
                    draggable
                    onDragStart={(e) => {
                      const relativePath = asset.path.replace(`${projectPath}/`, '');
                      e.dataTransfer.setData('elementType', 'image');
                      e.dataTransfer.setData('assetPath', relativePath);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                  >
                    {asset.thumbnailBase64 ? (
                      <img 
                        src={asset.thumbnailBase64} 
                        alt={asset.name} 
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div className={styles.thumbnail} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--mica-text-tertiary)'
                      }}>
                        <ImageRegular fontSize={24} />
                      </div>
                    )}
                    <div className={styles.fileName}>{asset.name}</div>
                  </div>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem icon={<CopyRegular />} onClick={() => handleCopyPath(asset.path)}>
                      Copy relative path
                    </MenuItem>
                    <MenuItem icon={<OpenRegular />} onClick={() => invoke('open_asset_externally', { assetPath: asset.path }).catch(() => {})}>
                      Open externally
                    </MenuItem>
                    <MenuItem icon={<DeleteRegular />} onClick={() => setDeleteTarget(asset.path)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete asset?</DialogTitle>
            <DialogContent>
              This action cannot be undone. The file will be permanently removed from the project.
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
