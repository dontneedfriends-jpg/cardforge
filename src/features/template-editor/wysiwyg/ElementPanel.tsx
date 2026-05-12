import React from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import {
  TextTRegular,
  ImageRegular,
  SquareRegular,
  CircleRegular,
  LineRegular,
  StarRegular,
  TagRegular,
  SquareMultipleRegular,
  DocumentBulletListRegular,
} from '@fluentui/react-icons';
import { CanvasElement } from '../../../store/canvasStore';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px',
    overflow: 'auto',
    height: '100%',
  },
  category: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--mica-text-tertiary)',
    padding: '8px 8px 4px',
    marginTop: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    color: 'var(--mica-text-secondary)',
    ':hover': {
      background: 'var(--mica-layer-2)',
      color: 'var(--mica-text-primary)',
    },
    ':active': {
      cursor: 'grabbing',
    },
    userSelect: 'none',
  },
  label: {
    fontSize: '12px',
    lineHeight: 1,
  },
});

interface DraggableItemProps {
  icon: React.ReactElement;
  label: string;
  elementType: CanvasElement['type'];
}

function DraggableItem({ icon, label, elementType }: DraggableItemProps) {
  const styles = useStyles();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.setData('text/plain', elementType);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
      <div
      className={styles.item}
      draggable="true"
      onDragStart={handleDragStart}
    >
      {icon}
      <Text className={styles.label}>{label}</Text>
    </div>
  );
}

export function ElementPanel() {
  const styles = useStyles();

  return (
    <div className={styles.panel}>
      <div className={styles.category}>Basic</div>
      <DraggableItem
        icon={<TextTRegular fontSize={18} />}
        label="Text"
        elementType="text"
      />
      <DraggableItem
        icon={<ImageRegular fontSize={18} />}
        label="Image"
        elementType="image"
      />
      <DraggableItem
        icon={<TagRegular fontSize={18} />}
        label="Data Field"
        elementType="field"
      />

      <div className={styles.category}>Shapes</div>
      <DraggableItem
        icon={<SquareRegular fontSize={18} />}
        label="Rectangle"
        elementType="shape"
      />
      <DraggableItem
        icon={<CircleRegular fontSize={18} />}
        label="Circle"
        elementType="circle"
      />
      <DraggableItem
        icon={<LineRegular fontSize={18} />}
        label="Line"
        elementType="line"
      />

      <div className={styles.category}>Elements</div>
      <DraggableItem
        icon={<StarRegular fontSize={18} />}
        label="Icon"
        elementType="icon"
      />
      <DraggableItem
        icon={<SquareMultipleRegular fontSize={18} />}
        label="Container"
        elementType="container"
      />
      <DraggableItem
        icon={<DocumentBulletListRegular fontSize={18} />}
        label="QR Code"
        elementType="qr"
      />
    </div>
  );
}
