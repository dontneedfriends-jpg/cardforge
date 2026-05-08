import { Text, makeStyles } from '@fluentui/react-components';
import { useCanvasStore } from '../../../store/canvasStore';
import { useCallback } from 'react';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px',
    overflow: 'auto',
    height: '100%',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    ':hover': {
      background: 'var(--colorNeutralBackground1Hover)',
    },
  },
  selected: {
    background: 'var(--colorBrandBackground)',
    color: 'var(--colorNeutralForegroundOnBrand)',
  },
  hidden: {
    opacity: 0.4,
    textDecoration: 'line-through',
  },
});

export function LayersPanel() {
  const styles = useStyles();
  const elements = useCanvasStore((state) => state.elements);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const selectElement = useCanvasStore((state) => state.selectElement);

  const handleSelect = useCallback((id: string) => {
    selectElement(id);
  }, [selectElement]);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className={styles.panel}>
      <Text size={200} weight="semibold" style={{ padding: '4px 8px' }}>Layers</Text>
      {sortedElements.map((el) => (
        <div
          key={el.id}
          className={`${styles.item} ${selectedId === el.id ? styles.selected : ''} ${!el.visible ? styles.hidden : ''}`}
          onClick={() => handleSelect(el.id)}
        >
          <span>{el.type.charAt(0).toUpperCase() + el.type.slice(1)}</span>
        </div>
      ))}
      {sortedElements.length === 0 && (
        <Text size={200} style={{ color: 'var(--colorNeutralForeground2)', padding: '4px 8px' }}>
          Drag elements onto the card
        </Text>
      )}
    </div>
  );
}
