import { makeStyles, Button, Tooltip } from '@fluentui/react-components';
import {
  ArrowUndoRegular,
  ArrowRedoRegular,
  CopyRegular,
  DeleteRegular,
  ZoomInRegular,
  ZoomOutRegular,
  ZoomFitRegular,
  AlignLeftRegular,
  TextAlignCenterRegular,
  AlignRightRegular,
  GroupRegular,
  GroupDismissRegular,
  LineRegular,
} from '@fluentui/react-icons';
import { Canvas } from './wysiwyg/Canvas';
import { ElementPanel } from './wysiwyg/ElementPanel';
import { PropertiesPanel } from './wysiwyg/PropertiesPanel';
import { LayersPanel } from './wysiwyg/LayersPanel';
import { useDeckStore, useCanvasStore } from '../../store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '200px',
    borderRight: '1px solid var(--mica-stroke)',
    overflow: 'auto',
    flexShrink: 0,
    background: 'var(--mica-layer-1)',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--mica-base)',
    position: 'relative',
  },
  rightPanel: {
    width: '240px',
    borderLeft: '1px solid var(--mica-stroke)',
    overflow: 'auto',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--mica-layer-1)',
  },
  toolbar: {
    height: '32px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    borderBottom: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-2)',
  },
});

export function VisualEditor() {
  const styles = useStyles();
  const deckData = useDeckStore((s) => s.deckData);
  const cardSize = deckData?.meta.cardSize || { widthMm: 63, heightMm: 88, bleedMm: 3 };
  
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const alignElements = useCanvasStore((s) => s.alignElements);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.toolbar}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mica-text-tertiary)' }}>Elements</span>
        </div>
        <ElementPanel />
      </div>
      <div className={styles.center}>
        <div className={styles.toolbar}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mica-text-tertiary)' }}>Canvas</span>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <Tooltip content="Undo (Ctrl+Z)" relationship="label">
              <Button icon={<ArrowUndoRegular />} size="small" appearance="subtle" onClick={undo} />
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Y)" relationship="label">
              <Button icon={<ArrowRedoRegular />} size="small" appearance="subtle" onClick={redo} />
            </Tooltip>
            <div style={{ width: '1px', height: '16px', background: 'var(--mica-stroke)', margin: '0 4px' }} />
            <Tooltip content={`Duplicate (${selectedIds.length > 1 ? selectedIds.length + ' items' : 'Ctrl+D'})`} relationship="label">
              <Button icon={<CopyRegular />} size="small" appearance="subtle" onClick={duplicateSelected} disabled={selectedIds.length === 0} />
            </Tooltip>
            <Tooltip content={`Delete (${selectedIds.length > 1 ? selectedIds.length + ' items' : 'Del'})`} relationship="label">
              <Button icon={<DeleteRegular />} size="small" appearance="subtle" onClick={deleteSelected} disabled={selectedIds.length === 0} />
            </Tooltip>
            <div style={{ width: '1px', height: '16px', background: 'var(--mica-stroke)', margin: '0 4px' }} />
            <Tooltip content="Align Left" relationship="label">
              <Button icon={<AlignLeftRegular />} size="small" appearance="subtle" onClick={() => alignElements('left')} disabled={selectedIds.length < 2} />
            </Tooltip>
            <Tooltip content="Align Center" relationship="label">
              <Button icon={<TextAlignCenterRegular />} size="small" appearance="subtle" onClick={() => alignElements('center')} disabled={selectedIds.length < 2} />
            </Tooltip>
            <Tooltip content="Align Right" relationship="label">
              <Button icon={<AlignRightRegular />} size="small" appearance="subtle" onClick={() => alignElements('right')} disabled={selectedIds.length < 2} />
            </Tooltip>
            <Tooltip content="Distribute Horizontally" relationship="label">
              <Button icon={<LineRegular />} size="small" appearance="subtle" onClick={() => alignElements('distributeH')} disabled={selectedIds.length < 3} />
            </Tooltip>
            <div style={{ width: '1px', height: '16px', background: 'var(--mica-stroke)', margin: '0 4px' }} />
            <Tooltip content="Group" relationship="label">
              <Button icon={<GroupRegular />} size="small" appearance="subtle" onClick={groupSelected} disabled={selectedIds.length < 2} />
            </Tooltip>
            <Tooltip content="Ungroup" relationship="label">
              <Button icon={<GroupDismissRegular />} size="small" appearance="subtle" onClick={ungroupSelected} disabled={selectedIds.length === 0} />
            </Tooltip>
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <Tooltip content="Zoom Out (Ctrl+-)" relationship="label">
              <Button icon={<ZoomOutRegular />} size="small" appearance="subtle" onClick={() => setZoom(zoom - 0.1)} />
            </Tooltip>
            <span style={{ fontSize: '11px', color: 'var(--mica-text-secondary)', minWidth: '40px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip content="Zoom In (Ctrl++)" relationship="label">
              <Button icon={<ZoomInRegular />} size="small" appearance="subtle" onClick={() => setZoom(zoom + 0.1)} />
            </Tooltip>
            <Tooltip content="Reset Zoom (Ctrl+0)" relationship="label">
              <Button icon={<ZoomFitRegular />} size="small" appearance="subtle" onClick={() => setZoom(1)} />
            </Tooltip>
          </div>
        </div>
        <Canvas 
          widthMm={cardSize.widthMm} 
          heightMm={cardSize.heightMm} 
        />
      </div>
      <div className={styles.rightPanel}>
        <div style={{ flex: 1, overflow: 'auto', borderBottom: '1px solid var(--mica-stroke)' }}>
          <div className={styles.toolbar}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mica-text-tertiary)' }}>Properties</span>
          </div>
          <PropertiesPanel />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className={styles.toolbar}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mica-text-tertiary)' }}>Layers</span>
          </div>
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
