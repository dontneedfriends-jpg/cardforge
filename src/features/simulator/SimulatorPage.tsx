import { useEffect, useCallback, useMemo } from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import { useSimulatorStore } from './simulatorStore';
import { useDeckStore, useProjectStore, useEditorStore } from '../../store';
import { CardTable } from './CardTable';
import { DeckZone } from './DeckZone';
import { renderCardRow } from '../preview/CardRenderer';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--mica-layer-0)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    padding: '0 16px',
    borderBottom: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)',
    backdropFilter: 'blur(40px)',
    flexShrink: 0,
  },
  playArea: {
    flex: 1,
    minHeight: 0,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    color: 'var(--mica-text-secondary)',
  },
});

export function SimulatorPage() {
  const styles = useStyles();
  const deckData = useDeckStore((s) => s.deckData);
  const projectPath = useProjectStore((s) => s.projectPath);
  const editorHtml = useEditorStore((s) => s.html);
  const editorCss = useEditorStore((s) => s.css);
  const cardBackDesign = useEditorStore((s) => s.cardBack);

  const store = useSimulatorStore();
  const deck = useSimulatorStore((s) => s.deck);
  const hand = useSimulatorStore((s) => s.hand);
  const playArea = useSimulatorStore((s) => s.playArea);
  const discard = useSimulatorStore((s) => s.discard);

  useEffect(() => {
    if (deckData?.rows && deckData.meta) {
      store.loadDeck(deckData.rows, deckData.meta.id);
    }
  }, [deckData?.meta?.id, deckData?.rows?.length]);

  const handIds = useMemo(() => new Set<string>(hand.map((c) => c.id)), [hand]);

  const renderCardContent = useCallback(
    (cardId: string) => {
      const allCards = [...deck, ...hand, ...playArea, ...discard];
      const card = allCards.find((c) => c.id === cardId);
      if (!card || !deckData) return '<html><body></body></html>';
      const row = deckData.rows[card.rowIndex];
      if (!row) return '<html><body></body></html>';
      return renderCardRow(editorHtml, editorCss, row, projectPath ?? undefined);
    },
    [deck, hand, playArea, discard, deckData, editorHtml, editorCss, projectPath]
  );

  const cardSize = useMemo(
    () => deckData?.meta.cardSize || { widthMm: 63, heightMm: 88, bleedMm: 3 },
    [deckData]
  );

  const deckCards = useMemo(() => {
    if (!deckData) return [];
    return deck.map((card) => ({
      rowIndex: card.rowIndex,
      row: deckData.rows[card.rowIndex] || {},
    }));
  }, [deck, deckData]);

  if (!deckData || deckData.rows.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={500} weight="semibold">Simulator</Text>
        </div>
        <div className={styles.empty}>
          <Text size={300}>Open a deck with cards to use the simulator</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">Simulator — {deckData.meta.name}</Text>
      </div>
      <div className={styles.playArea}>
        <CardTable
          cards={[...playArea, ...hand]}
          handIds={handIds}
          cardWidthMm={cardSize.widthMm}
          cardHeightMm={cardSize.heightMm}
          onPlayCard={store.playCard}
          onFlipCard={store.flipCard}
          onRotateCard={store.rotateCard}
          onRotateCard3d={store.rotateCard3d}
          onMoveCard={store.moveCard}
          renderCardContent={renderCardContent}
          cardBackDesign={cardBackDesign}
        />
      </div>
      <DeckZone
        deckCount={deck.length}
        handCount={hand.length}
        discardCount={discard.length}
        deckCards={deckCards}
        onShuffle={store.shuffle}
        onDraw={() => store.drawCard()}
        onDrawAll={() => store.drawCards(deck.length)}
        onDrawSpecific={store.drawSpecificCard}
      />
    </div>
  );
}
