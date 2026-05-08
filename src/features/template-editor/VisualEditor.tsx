import { makeStyles } from '@fluentui/react-components';
import { Canvas } from './wysiwyg/Canvas';
import { ElementPanel } from './wysiwyg/ElementPanel';
import { PropertiesPanel } from './wysiwyg/PropertiesPanel';
import { LayersPanel } from './wysiwyg/LayersPanel';
import { useDeckStore } from '../../store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '200px',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    overflow: 'auto',
    flexShrink: 0,
    background: 'rgba(255, 255, 255, 0.02)',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.01)',
    position: 'relative',
  },
  rightPanel: {
    width: '240px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    overflow: 'auto',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  toolbar: {
    height: '36px',
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(255, 255, 255, 0.03)',
  },
});

export function VisualEditor() {
  const styles = useStyles();
  const deckData = useDeckStore((s) => s.deckData);
  const cardSize = deckData?.meta.cardSize || { widthMm: 63, heightMm: 88, bleedMm: 3 };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.toolbar}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Elements</span>
        </div>
        <ElementPanel />
      </div>
      <div className={styles.center}>
        <div className={styles.toolbar}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Canvas</span>
        </div>
        <Canvas 
          widthMm={cardSize.widthMm} 
          heightMm={cardSize.heightMm} 
        />
      </div>
      <div className={styles.rightPanel}>
        <div style={{ flex: 1, overflow: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className={styles.toolbar}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Properties</span>
          </div>
          <PropertiesPanel />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className={styles.toolbar}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Layers</span>
          </div>
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
