import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  makeStyles,
} from '@fluentui/react-components';
import { ImageRegular, FolderRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useCallback } from 'react';

const useStyles = makeStyles({
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '300px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px',
    maxHeight: '400px',
    overflow: 'auto',
    padding: '4px',
  },
  assetCard: {
    padding: '8px',
    borderRadius: '8px',
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
    transition: 'all 0.2s ease',
    textAlign: 'center',
    ':hover': {
      background: 'var(--mica-layer-2)',
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
    },
  },
  assetCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  thumbnail: {
    width: '100%',
    height: '72px',
    objectFit: 'cover',
    borderRadius: '6px',
    marginBottom: '6px',
    background: 'var(--mica-layer-2)',
  },
  fileName: {
    fontSize: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--mica-text-secondary)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
    color: 'var(--mica-text-tertiary)',
  },
});

interface AssetInfo {
  name: string;
  path: string;
  thumbnailBase64?: string;
}

interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assetPath: string) => void;
  title?: string;
}

export function AssetPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = 'Select Asset',
}: AssetPickerDialogProps) {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  interface AssetEntry {
  name: string;
  path: string;
  thumbnailBase64: string;
}

const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await invoke<AssetEntry[]>('list_assets', { projectPath });
      setAssets(result);
    } catch (e) {
      console.error('Failed to load assets:', e);
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    if (open) {
      loadAssets();
      setSelectedAsset(null);
    }
  }, [open, loadAssets]);

  const handleSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_e, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogBody className={styles.dialogBody}>
          <DialogTitle>{title}</DialogTitle>
          
          {loading && (
            <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>Loading assets...</Text>
          )}
          
          {!loading && assets.length === 0 && (
            <div className={styles.empty}>
              <FolderRegular fontSize={32} />
              <Text size={300}>No assets found</Text>
              <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
                Import images in the Assets tab first
              </Text>
            </div>
          )}
          
          {!loading && assets.length > 0 && (
            <div className={styles.grid}>
              {assets.map((asset) => {
                const isSelected = selectedAsset === asset.path;
                return (
                  <div
                    key={asset.name}
                    className={`${styles.assetCard} ${isSelected ? styles.assetCardSelected : ''}`}
                    onClick={() => setSelectedAsset(asset.path)}
                    title={asset.name}
                  >
                    {asset.thumbnailBase64 ? (
                      <img
                        src={asset.thumbnailBase64}
                        alt={asset.name}
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div
                        className={styles.thumbnail}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--mica-text-tertiary)',
                        }}
                      >
                        <ImageRegular fontSize={20} />
                      </div>
                    )}
                    <div className={styles.fileName}>{asset.name}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSelect}
              disabled={!selectedAsset}
            >
              Select
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
