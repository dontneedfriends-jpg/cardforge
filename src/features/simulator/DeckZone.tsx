import { useState } from 'react';
import { Button, Text, makeStyles, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions } from '@fluentui/react-components';
import type { CellValue } from '../../shared/types/project';

interface DeckZoneProps {
  deckCount: number;
  handCount: number;
  discardCount: number;
  deckCards: { rowIndex: number; row: Record<string, CellValue> }[];
  onShuffle: () => void;
  onDraw: () => void;
  onDrawAll: () => void;
  onDrawSpecific: (rowIndex: number) => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    alignItems: 'center',
    borderTop: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)',
    backdropFilter: 'blur(40px)',
    minHeight: '48px',
  },
  pile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: '80px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--mica-radius-default)',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'var(--mica-layer-2)',
    },
  },
  pileBox: {
    width: '56px',
    height: '40px',
    borderRadius: 'var(--mica-radius-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    border: '2px solid var(--mica-stroke)',
    background: 'var(--mica-layer-2)',
    transition: 'all 0.15s ease',
  },
  pileBoxActive: {
    background: 'var(--mica-accent)',
    color: 'var(--mica-base-active)',
    border: '2px solid var(--mica-accent)',
    boxShadow: '0 0 12px rgba(96,205,255,0.3)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '300px',
    overflow: 'auto',
  },
  cardListItem: {
    padding: '8px 12px',
    borderRadius: 'var(--mica-radius-default)',
    cursor: 'pointer',
    background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'var(--mica-layer-2)',
      border: '1px solid var(--mica-accent)',
    },
  },
});

export function DeckZone({
  deckCount,
  handCount,
  discardCount,
  deckCards,
  onShuffle,
  onDraw,
  onDrawAll,
  onDrawSpecific,
}: DeckZoneProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const getCardLabel = (row: Record<string, CellValue>) => {
    const name = row.name || row.title || row.card_name || row.Name || row.Title;
    if (name) return String(name);
    const firstValue = Object.values(row).find((v) => v !== undefined && v !== '');
    return firstValue ? String(firstValue).slice(0, 30) : 'Unnamed Card';
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.pile} onClick={() => deckCount > 0 && setOpen(true)}>
          <div className={`${styles.pileBox} ${deckCount > 0 ? styles.pileBoxActive : ''}`}>
            {deckCount}
          </div>
          <Text size={200}>Deck</Text>
        </div>

        <div className={styles.pile}>
          <div className={`${styles.pileBox} ${handCount > 0 ? styles.pileBoxActive : ''}`}>
            {handCount}
          </div>
          <Text size={200}>Hand</Text>
        </div>

        <div className={styles.pile}>
          <div className={`${styles.pileBox} ${discardCount > 0 ? styles.pileBoxActive : ''}`}>
            {discardCount}
          </div>
          <Text size={200}>Discard</Text>
        </div>

        <div className={styles.actions}>
          <Button size="small" onClick={onShuffle} disabled={deckCount === 0}>
            Shuffle
          </Button>
          <Button size="small" onClick={onDraw} disabled={deckCount === 0}>
            Draw 1
          </Button>
          <Button size="small" onClick={onDrawAll} disabled={deckCount === 0}>
            Draw All
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(_e, data) => setOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Draw from Deck</DialogTitle>
            <DialogContent>
              <div className={styles.cardList}>
                {deckCards.map(({ rowIndex, row }) => (
                  <div
                    key={rowIndex}
                    className={styles.cardListItem}
                    onClick={() => {
                      onDrawSpecific(rowIndex);
                      setOpen(false);
                    }}
                  >
                    <Text size={300}>{getCardLabel(row)}</Text>
                  </div>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
