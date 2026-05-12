import React, { useCallback, useRef } from 'react';
import { makeStyles } from '@fluentui/react-components';
import { useCanvasStore } from '../../../store/canvasStore';

export const RULER_SIZE = 24;
const TICK_STEP = 50;
const SUBTICK_STEP = 10;
const LABEL_STEP = 100;
const GUIDE_THRESHOLD = 10;

const useStyles = makeStyles({
  rulerH: {
    position: 'absolute',
    top: '0',
    left: '24px',
    right: '0',
    height: '24px',
    background: 'var(--mica-layer-2)',
    borderBottom: '1px solid var(--mica-stroke)',
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: '100',
  },
  rulerV: {
    position: 'absolute',
    top: '24px',
    left: '0',
    bottom: '0',
    width: '24px',
    background: 'var(--mica-layer-2)',
    borderRight: '1px solid var(--mica-stroke)',
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: '100',
  },
  rulerCorner: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '24px',
    height: '24px',
    background: 'var(--mica-layer-2)',
    borderRight: '1px solid var(--mica-stroke)',
    borderBottom: '1px solid var(--mica-stroke)',
    zIndex: '101',
  },
  tick: {
    position: 'absolute',
    background: 'var(--mica-text-tertiary)',
  },
  label: {
    position: 'absolute',
    fontSize: '9px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: "'IBM Plex Mono', monospace",
    userSelect: 'none',
    pointerEvents: 'none',
  },
  guideLine: {
    position: 'absolute',
    pointerEvents: 'all',
    zIndex: 50,
    ':hover': { opacity: 0.8 },
  },
  guideLineH: {
    left: 0,
    right: 0,
    height: '1px',
    background: '#60cdff',
    cursor: 'ns-resize',
  },
  guideLineV: {
    top: 0,
    bottom: 0,
    width: '1px',
    background: '#60cdff',
    cursor: 'ew-resize',
  },
  guideLabel: {
    position: 'absolute',
    fontSize: '9px',
    color: '#60cdff',
    fontFamily: "'IBM Plex Mono', monospace",
    background: 'var(--mica-layer-2)',
    padding: '0 4px',
    borderRadius: '2px',
    pointerEvents: 'none',
  },
});

interface RulerProps {
  canvasWidth: number;
  canvasHeight: number;
  scrollLeft: number;
  scrollTop: number;
}

function RulerH({ canvasWidth, scrollLeft }: { canvasWidth: number; scrollLeft: number }) {
  const styles = useStyles();
  const addGuide = useCanvasStore((s) => s.addGuide);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = e.clientX - rect.left + scrollLeft;
    if (pos >= 0 && pos <= canvasWidth) {
      addGuide('vertical', pos);
    }
  }, [addGuide, canvasWidth, scrollLeft]);

  const ticks: React.ReactNode[] = [];
  for (let x = 0; x <= canvasWidth; x += SUBTICK_STEP) {
    const isMain = x % TICK_STEP === 0;
    const isLabel = x % LABEL_STEP === 0;
    ticks.push(
      <div
        key={x}
        className={styles.tick}
        style={{
          left: x,
          bottom: 0,
          width: '1px',
          height: isMain ? 10 : 5,
          opacity: isMain ? 0.5 : 0.25,
        }}
      />
    );
    if (isLabel) {
      ticks.push(
        <div key={`l${x}`} className={styles.label} style={{ left: x + 3, top: 4 }}>
          {x}
        </div>
      );
    }
  }

  return (
    <div ref={rulerRef} className={styles.rulerH} onMouseDown={handleMouseDown}>
      {ticks}
    </div>
  );
}

function RulerV({ canvasHeight, scrollTop }: { canvasHeight: number; scrollTop: number }) {
  const styles = useStyles();
  const addGuide = useCanvasStore((s) => s.addGuide);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = e.clientY - rect.top + scrollTop;
    if (pos >= 0 && pos <= canvasHeight) {
      addGuide('horizontal', pos);
    }
  }, [addGuide, canvasHeight, scrollTop]);

  const ticks: React.ReactNode[] = [];
  for (let y = 0; y <= canvasHeight; y += SUBTICK_STEP) {
    const isMain = y % TICK_STEP === 0;
    const isLabel = y % LABEL_STEP === 0;
    ticks.push(
      <div
        key={y}
        className={styles.tick}
        style={{
          top: y,
          right: 0,
          height: '1px',
          width: isMain ? 10 : 5,
          opacity: isMain ? 0.5 : 0.25,
        }}
      />
    );
    if (isLabel) {
      ticks.push(
        <div key={`l${y}`} className={styles.label} style={{ top: y + 3, left: 4 }}>
          {y}
        </div>
      );
    }
  }

  return (
    <div ref={rulerRef} className={styles.rulerV} onMouseDown={handleMouseDown}>
      {ticks}
    </div>
  );
}

export function RulerOverlay({ canvasWidth, canvasHeight, scrollLeft, scrollTop }: RulerProps) {
  const styles = useStyles();
  const guides = useCanvasStore((s) => s.guides);
  const removeGuide = useCanvasStore((s) => s.removeGuide);

  return (
    <>
      <div className={styles.rulerCorner} />
      <RulerH canvasWidth={canvasWidth} scrollLeft={scrollLeft} />
      <RulerV canvasHeight={canvasHeight} scrollTop={scrollTop} />
      {guides.map((g) => {
        if (g.orientation === 'horizontal') {
          return (
            <div
              key={g.id}
              className={`${styles.guideLine} ${styles.guideLineH}`}
              style={{ top: g.position - scrollTop }}
              onDoubleClick={() => removeGuide(g.id)}
              title="Double-click to remove"
            >
              <span className={styles.guideLabel} style={{ left: 4, top: 2 }}>{g.position}px</span>
            </div>
          );
        }
        return (
          <div
            key={g.id}
            className={`${styles.guideLine} ${styles.guideLineV}`}
            style={{ left: g.position - scrollLeft }}
            onDoubleClick={() => removeGuide(g.id)}
            title="Double-click to remove"
          >
            <span className={styles.guideLabel} style={{ top: 4, left: 2 }}>{g.position}px</span>
          </div>
        );
      })}
    </>
  );
}

export function snapToGuides(
  value: number,
  guides: { orientation: string; position: number }[],
  orientation: 'horizontal' | 'vertical',
  threshold: number = GUIDE_THRESHOLD
): number | null {
  for (const g of guides) {
    if (g.orientation !== orientation) continue;
    const diff = Math.abs(value - g.position);
    if (diff <= threshold) return g.position;
  }
  return null;
}

export function snapElementToGuides(
  el: { x: number; y: number; width: number; height: number },
  guides: { orientation: string; position: number }[],
  threshold: number = GUIDE_THRESHOLD
): { x?: number; y?: number } {
  const result: { x?: number; y?: number } = {};

  const leftSnap = snapToGuides(el.x, guides, 'vertical', threshold);
  if (leftSnap !== null) { result.x = leftSnap; return result; }

  const rightSnap = snapToGuides(el.x + el.width, guides, 'vertical', threshold);
  if (rightSnap !== null) { result.x = rightSnap - el.width; return result; }

  const centerSnap = snapToGuides(el.x + el.width / 2, guides, 'vertical', threshold);
  if (centerSnap !== null) { result.x = centerSnap - el.width / 2; return result; }

  const topSnap = snapToGuides(el.y, guides, 'horizontal', threshold);
  if (topSnap !== null) { result.y = topSnap; return result; }

  const bottomSnap = snapToGuides(el.y + el.height, guides, 'horizontal', threshold);
  if (bottomSnap !== null) { result.y = bottomSnap - el.height; return result; }

  const middleSnap = snapToGuides(el.y + el.height / 2, guides, 'horizontal', threshold);
  if (middleSnap !== null) { result.y = middleSnap - el.height / 2; return result; }

  return result;
}
