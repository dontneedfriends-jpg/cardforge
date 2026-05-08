import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { mmToPx } from '../../theme';
import type { CardBackDesign } from '../../shared/types/project';

interface CardView {
  id: string;
  x: number;
  y: number;
  rotation: number;
  rotate3dX: number;
  rotate3dY: number;
  faceDown: boolean;
}

interface CardTableProps {
  cards: CardView[];
  handIds: Set<string>;
  cardWidthMm: number;
  cardHeightMm: number;
  onPlayCard: (id: string) => void;
  onFlipCard: (id: string) => void;
  onRotateCard: (id: string) => void;
  onRotateCard3d: (id: string, rotateX: number, rotateY: number) => void;
  onMoveCard: (id: string, x: number, y: number) => void;
  renderCardContent: (id: string) => string;
  cardBackDesign?: CardBackDesign;
}

function getPatternCss(pattern: string, color: string, opacity: number): string {
  const c = color.replace(/[\d.]+\)$/, `${opacity})`);
  switch (pattern) {
    case 'stripes':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${c} 10px, ${c} 11px)`;
    case 'dots':
      return `radial-gradient(${c} 1px, transparent 1px) 0 0 / 20px 20px`;
    case 'crosshatch':
      return [
        `repeating-linear-gradient(45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
        `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
      ].join(', ');
    default:
      return 'none';
  }
}

export function CardTable({
  cards,
  handIds,
  cardWidthMm,
  cardHeightMm,
  onPlayCard,
  onFlipCard,
  onRotateCard,
  onRotateCard3d,
  onMoveCard,
  renderCardContent,
  cardBackDesign,
}: CardTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    mode: 'move' | 'rotate';
  } | null>(null);
  const [_, setTick] = useState(0);

  const cardW = mmToPx(cardWidthMm);
  const cardH = mmToPx(cardHeightMm);

  const handCards = useMemo(() => cards.filter((c) => handIds.has(c.id)), [cards, handIds]);
  const playCards = useMemo(() => cards.filter((c) => !handIds.has(c.id)), [cards, handIds]);

  const design = cardBackDesign ?? {
    backgroundTop: '#1a0a2e',
    backgroundBottom: '#2a1a4e',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    symbol: '?',
    symbolSize: 36,
    symbolColor: 'rgba(255,255,255,0.6)',
    pattern: 'stripes',
    patternColor: 'rgba(255,255,255,0.02)',
    patternOpacity: 1,
  };

  const getHandPosition = useCallback(
    (index: number, total: number) => {
      const containerW = containerRef.current?.clientWidth ?? 800;
      const maxFanWidth = Math.min(containerW - 40, total * (cardW * 0.6));
      const overlap = total > 1 ? (maxFanWidth - cardW) / (total - 1) : 0;
      const startX = (containerW - maxFanWidth) / 2;
      return {
        x: startX + index * overlap,
        y: containerRef.current?.clientHeight
          ? containerRef.current.clientHeight - cardH - 20
          : 400,
      };
    },
    [cardW, cardH]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, card: CardView) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;

      const mode = e.altKey || e.button === 2 ? 'rotate' : 'move';

      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        id: card.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: card.x,
        origY: card.y,
        mode,
      };

      if (mode === 'rotate') {
        dragRef.current.origX = card.rotate3dY;
        dragRef.current.origY = card.rotate3dX;
      }
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (dragRef.current.mode === 'rotate') {
        onRotateCard3d(dragRef.current.id, dragRef.current.origY - dy, dragRef.current.origX + dx);
      } else {
        const newX = dragRef.current.origX + dx;
        const newY = dragRef.current.origY + dy;
        onMoveCard(dragRef.current.id, newX, newY);
      }
      setTick((t) => t + 1);
    },
    [onRotateCard3d, onMoveCard]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);

      if (dx < 5 && dy < 5 && dragRef.current.mode === 'move') {
        const inHand = handIds.has(dragRef.current.id);
        if (inHand) {
          onPlayCard(dragRef.current.id);
        }
      }
      dragRef.current = null;
    },
    [handIds, onPlayCard]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('pointerup', handlePointerUp);
    return () => el.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerUp]);

  const patternCss = useMemo(
    () => getPatternCss(design.pattern, design.patternColor, design.patternOpacity),
    [design.pattern, design.patternColor, design.patternOpacity]
  );

  const renderCard = (card: CardView, computedX?: number, computedY?: number) => {
    const inHand = handIds.has(card.id);
    const x = computedX ?? card.x;
    const y = computedY ?? card.y;
    const isDragging = dragRef.current?.id === card.id;

    return (
      <div
        key={card.id}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: cardW,
          height: cardH,
          cursor: isDragging ? 'grabbing' : inHand ? 'pointer' : 'grab',
          userSelect: 'none',
          transformStyle: 'preserve-3d',
          transform: `rotate(${card.rotation}deg) rotateX(${card.rotate3dX}deg) rotateY(${card.rotate3dY}deg)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease, left 0.2s ease, top 0.2s ease',
          zIndex: isDragging ? 999 : Math.round(y + (inHand ? 0 : 100)),
        }}
        onPointerDown={(e) => handlePointerDown(e, card)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (inHand) {
            onPlayCard(card.id);
          } else {
            onFlipCard(card.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!inHand) onRotateCard(card.id);
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${card.faceDown ? 180 : 0}deg)`,
            transition: 'transform 0.5s ease',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            <iframe
              srcDoc={renderCardContent(card.id)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                pointerEvents: 'none',
              }}
              title={`${card.id}-front`}
              sandbox="allow-scripts"
            />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${design.backgroundTop} 0%, ${design.backgroundBottom} 30%, ${design.backgroundTop} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: patternCss,
                }}
              />
              <div
                style={{
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  border: `2px solid ${design.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `radial-gradient(circle at center, ${design.backgroundBottom}66 0%, transparent 70%)`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: design.symbolSize,
                    fontWeight: 700,
                    color: design.symbolColor,
                    fontFamily: 'serif',
                    textShadow: `0 0 20px ${design.backgroundBottom}80`,
                  }}
                >
                  {design.symbol || '?'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--mica-layer-1)',
        borderRadius: 'var(--mica-radius-large)',
        border: '1px solid var(--mica-stroke)',
        touchAction: 'none',
        perspective: 1200,
      }}
      onPointerMove={handlePointerMove}
    >
      {playCards.map((card) => renderCard(card))}
      {handCards.map((card, i) => {
        const pos = getHandPosition(i, handCards.length);
        return renderCard(card, pos.x, pos.y);
      })}
    </div>
  );
}
