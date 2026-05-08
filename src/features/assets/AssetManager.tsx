import { Text, Button, makeStyles, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components';
import { ImageRegular, AddRegular, DeleteRegular, CopyRegular, OpenRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { readDir } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  grid: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignContent: 'flex-start',
  },
  card: {
    width: '132px',
    padding: '10px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
    cursor: 'pointer',
  },
  thumbnail: {
    width: '100%',
    height: '88px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  fileName: {
    fontSize: '11px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    color: 'rgba(255, 255, 255, 0.40)',
  },
});

interface AssetEntry {
  name: string;
  path: string;
}

export function AssetManager() {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadAssets = async () => {
    if (!projectPath) return;
    try {
      const entries = await readDir(`${projectPath}/assets`);
      setAssets(entries.filter(e => e.isFile).map(e => ({ name: e.name, path: `${projectPath}/assets/${e.name}` })));
    } catch { setAssets([]); }
  };

  useEffect(() => { loadAssets(); }, [projectPath]);

  const handleImportFiles = async (files: string[]) => {
    if (!projectPath) return;
    for (const file of files) {
      try { await invoke('import_asset', { projectPath, sourcePath: file }); } catch (e) { console.error(e); }
    }
    loadAssets();
  };

  const handleImport = async () => {
    if (!projectPath) return;
    const selected = await open({ multiple: true, filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }] });
    if (!selected) return;
    const files = Array.isArray(selected) ? selected : [selected];
    await handleImportFiles(files);
  };

  const handleDelete = async (path: string) => {
    try { await invoke('delete_asset', { assetPath: path }); loadAssets(); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const handleCopyPath = async (path: string) => {
    try {
      const relativePath = path.replace(`${projectPath}/`, '');
      await navigator.clipboard.writeText(relativePath);
    } catch (e) { console.error('Failed to copy path', e); }
  };

  if (!projectPath) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><Text size={400} weight="semibold">Assets</Text></div>
        <div className={styles.empty}><Text size={300}>No project open</Text></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">Assets ({assets.length})</Text>
        <Button icon={<AddRegular />} size="small" onClick={handleImport}>Import</Button>
      </div>
      
      {assets.length === 0 ? (
        <div className={styles.empty}>
          <ImageRegular fontSize={48} />
          <Text size={300}>Click Import to add images</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {assets.map((asset) => (
            <Menu key={asset.name}>
              <MenuTrigger disableButtonEnhancement>
                <div className={styles.card} title={asset.name}>
                  <img src={convertFileSrc(asset.path)} alt={asset.name} className={styles.thumbnail} />
                  <div className={styles.fileName}>{asset.name}</div>
                </div>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem icon={<CopyRegular />} onClick={() => handleCopyPath(asset.path)}>
                    Copy path
                  </MenuItem>
                  <MenuItem icon={<OpenRegular />} onClick={() => invoke('open_asset', { assetPath: asset.path }).catch(() => {})}>
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

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete asset?</DialogTitle>
            <DialogContent>
              This action cannot be undone. The file will be permanently removed from the project.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button appearance="primary" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
