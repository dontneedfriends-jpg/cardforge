import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { mmToPx } from '../../theme';
import type { CardBackDesign } from '../../shared/types/project';
import { ContextMenu } from './ContextMenu';

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
  onAlignCard: (id: string) => void;
  onRotateCard: (id: string) => void;
  onRotateCard3d: (id: string, rotateX: number, rotateY: number) => void;
  onMoveCard: (id: string, x: number, y: number) => void;
  onDiscardCard: (id: string, from: 'hand' | 'playArea') => void;
  onReturnToDeck: (id: string) => void;
  renderCardContent: (id: string) => string;
  cardBackDesign?: CardBackDesign;
}

import { getPatternCss } from '../../shared/utils/patternCss';

export function CardTable({
  cards,
  handIds,
  cardWidthMm,
  cardHeightMm,
  onPlayCard,
  onFlipCard,
  onAlignCard,
  onRotateCard,
  onRotateCard3d,
  onMoveCard,
  onDiscardCard,
  onReturnToDeck,
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
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cardId: string;
    zone: 'hand' | 'playArea' | 'discard';
  } | null>(null);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrlHeld = useRef(false);

  const cardW = mmToPx(cardWidthMm);
  const cardH = mmToPx(cardHeightMm);

  const handCards = useMemo(() => cards.filter((c) => handIds.has(c.id)), [cards, handIds]);
  const playCards = useMemo(() => cards.filter((c) => !handIds.has(c.id)), [cards, handIds]);

  const design = cardBackDesign ?? {
    backgroundTop: '#1a0a2e', backgroundMid: '#1f1240', backgroundBottom: '#2a1a4e',
    gradientAngle: 135,
    borderColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderRadius: 8,
    shadowColor: 'rgba(0,0,0,0.4)', shadowSize: 12,
    symbol: '?', symbolSet: 'none', symbolSize: 36, symbolColor: 'rgba(255,255,255,0.6)',
    symbol2: '', symbol2Size: 18, symbol2Color: 'rgba(255,255,255,0.3)',
    pattern: 'stripes', patternColor: 'rgba(255,255,255,0.02)', patternOpacity: 1,
    textureUrl: '', textureOpacity: 0.3,
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

      const cardEl = e.currentTarget as HTMLElement;
      const cardRect = cardEl.getBoundingClientRect();
      const containerRect = el.getBoundingClientRect();
      const visualX = cardRect.left - containerRect.left;
      const visualY = cardRect.top - containerRect.top;

      dragRef.current = {
        id: card.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: visualX,
        origY: visualY,
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

  // Context menu closes via overlay onClick in ContextMenu component

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Control') ctrlHeld.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        ctrlHeld.current = false;
        setHovered(null);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const patternCss = useMemo(
    () => getPatternCss(design.pattern, design.patternColor, design.patternOpacity),
    [design.pattern, design.patternColor, design.patternOpacity]
  );

  const handleContextMenu = (e: React.MouseEvent, card: CardView) => {
    e.preventDefault();
    dragRef.current = null;
    const inHand = handIds.has(card.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cardId: card.id,
      zone: inHand ? 'hand' : 'playArea',
    });
  };

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
        onPointerEnter={(e) => {
          if (!ctrlHeld.current) return;
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          hoverTimer.current = setTimeout(() => {
            setHovered({ id: card.id, x: e.clientX, y: e.clientY });
          }, 400);
        }}
        onPointerLeave={() => {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          setHovered(null);
        }}
        onContextMenu={(e) => handleContextMenu(e, card)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (inHand) {
            onPlayCard(card.id);
          } else {
            onFlipCard(card.id);
          }
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
              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
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
              borderRadius: design.borderRadius,
              overflow: 'hidden',
              boxShadow: `${design.shadowColor} 0 ${design.shadowSize}px ${design.shadowSize * 2}px`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(${design.gradientAngle}deg, ${design.backgroundTop} 0%, ${design.backgroundMid} 50%, ${design.backgroundBottom} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {design.textureUrl && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${design.textureUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: design.textureOpacity,
                  }}
                />
              )}
              <div style={{ position: 'absolute', inset: 0, background: patternCss }} />
              {design.symbol2 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12%',
                    right: '12%',
                    fontSize: design.symbol2Size,
                    color: design.symbol2Color,
                    fontWeight: 700,
                    fontFamily: 'serif',
                    zIndex: 2,
                  }}
                >
                  {design.symbol2}
                </div>
              )}
              <div
                style={{
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  border: `${design.borderWidth}px solid ${design.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `radial-gradient(circle at center, ${design.backgroundMid}66 0%, transparent 70%)`,
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          zone={contextMenu.zone}
          onFlip={() => { onFlipCard(contextMenu.cardId); setContextMenu(null); }}
          onAlign={() => { onAlignCard(contextMenu.cardId); setContextMenu(null); }}
          onRotate={() => { onRotateCard(contextMenu.cardId); setContextMenu(null); }}
          onPlay={() => { onPlayCard(contextMenu.cardId); setContextMenu(null); }}
          onDiscard={() => { onDiscardCard(contextMenu.cardId, contextMenu.zone === 'hand' ? 'hand' : 'playArea'); setContextMenu(null); }}
          onReturnToDeck={() => { onReturnToDeck(contextMenu.cardId); setContextMenu(null); }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {hovered && ctrlHeld.current && !contextMenu && !dragRef.current && (() => {
        const card = cards.find((c) => c.id === hovered.id);
        if (!card) return null;
        const previewW = cardW * 2;
        const previewH = cardH * 2;
        let left = hovered.x + 16;
        let top = hovered.y - previewH / 2;
        if (left + previewW > window.innerWidth - 16) left = hovered.x - previewW - 16;
        if (top < 16) top = 16;
        if (top + previewH > window.innerHeight - 16) top = window.innerHeight - previewH - 16;
        return (
          <div
            style={{
              position: 'fixed',
              left,
              top,
              width: previewW,
              height: previewH,
              zIndex: 10000,
              pointerEvents: 'none',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${card.faceDown ? 180 : 0}deg)`,
              transition: 'transform 0.2s ease',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
              <iframe
                srcDoc={renderCardContent(card.id)}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`${card.id}-hover`}
                sandbox="allow-scripts"
              />
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: design.borderRadius,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(${design.gradientAngle}deg, ${design.backgroundTop} 0%, ${design.backgroundMid} 50%, ${design.backgroundBottom} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {design.textureUrl && (
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${design.textureUrl})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      opacity: design.textureOpacity,
                    }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: patternCss }} />
                {design.symbol2 && (
                  <div
                    style={{
                      position: 'absolute', top: '12%', right: '12%',
                      fontSize: design.symbol2Size,
                      color: design.symbol2Color,
                      fontWeight: 700, fontFamily: 'serif', zIndex: 2,
                    }}
                  >
                    {design.symbol2}
                  </div>
                )}
                <div
                  style={{
                    width: '70%', height: '70%',
                    borderRadius: '50%',
                    border: `${design.borderWidth}px solid ${design.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `radial-gradient(circle at center, ${design.backgroundMid}66 0%, transparent 70%)`,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <span style={{ fontSize: design.symbolSize, fontWeight: 700, color: design.symbolColor, fontFamily: 'serif' }}>
                    {design.symbol || '?'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
