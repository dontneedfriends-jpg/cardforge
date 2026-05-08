import { makeStyles } from '@fluentui/react-components';

interface ContextMenuProps {
  x: number;
  y: number;
  zone: 'hand' | 'playArea' | 'discard';
  onFlip: () => void;
  onAlign: () => void;
  onRotate: () => void;
  onPlay: () => void;
  onDiscard: () => void;
  onReturnToDeck: () => void;
  onClose: () => void;
}

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
  },
  menu: {
    position: 'fixed',
    zIndex: 9999,
    minWidth: '140px',
    background: 'rgba(30, 30, 35, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '4px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  item: {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
    ':hover': {
      background: 'rgba(96, 205, 255, 0.15)',
      color: '#60cdff',
    },
  },
  separator: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.06)',
    margin: '4px 0',
  },
});

export function ContextMenu({ x, y, zone, onFlip, onAlign, onRotate, onPlay, onDiscard, onReturnToDeck, onClose }: ContextMenuProps) {
  const styles = useStyles();

  return (
    <>
      <div className={styles.overlay} onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        {zone === 'hand' && (
          <div className={styles.item} onClick={onPlay}>Play to Table</div>
        )}
        {zone !== 'hand' && (
          <>
            <div className={styles.item} onClick={onFlip}>Flip</div>
            <div className={styles.item} onClick={onAlign}>Align</div>
            <div className={styles.item} onClick={onRotate}>Rotate 45°</div>
          </>
        )}
        {(zone === 'hand' || zone === 'playArea') && (
          <div className={styles.item} onClick={onDiscard}>Discard</div>
        )}
        <div className={styles.item} onClick={onReturnToDeck}>Return to Deck</div>
      </div>
    </>
  );
}
