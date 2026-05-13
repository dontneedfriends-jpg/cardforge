import React from 'react';
import { makeStyles } from '@fluentui/react-components';
import { Rnd } from 'react-rnd';
import type { CanvasElement } from '../../../store/canvasStore';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { ShapeElement } from './elements/ShapeElement';
import { CircleElement } from './elements/CircleElement';
import { LineElement } from './elements/LineElement';
import { IconElement } from './elements/IconElement';
import { FieldBadge } from './elements/FieldBadge';
import { ContainerElement } from './elements/ContainerElement';
import { QrElement } from './elements/QrElement';
import { snapElementToGuides } from './Ruler';

const useStyles = makeStyles({
  selected: {
    outline: '2px solid var(--mica-accent)',
    outlineOffset: '2px',
  },
});

function areElementPropsEqual(prev: CanvasElement, next: CanvasElement): boolean {
  return prev.id === next.id
    && prev.x === next.x && prev.y === next.y
    && prev.width === next.width && prev.height === next.height
    && prev.rotation === next.rotation
    && prev.opacity === next.opacity
    && prev.zIndex === next.zIndex
    && prev.visible === next.visible
    && prev.parentId === next.parentId
    && JSON.stringify(prev.props) === JSON.stringify(next.props);
}

const elementMap: Record<CanvasElement['type'], React.FC<any>> = {
  text: TextElement,
  image: ImageElement,
  shape: ShapeElement,
  circle: CircleElement,
  line: LineElement,
  icon: IconElement,
  field: FieldBadge,
  container: ContainerElement,
  qr: QrElement,
};

interface ElementRendererProps {
  el: CanvasElement;
  childrenMap: Record<string, CanvasElement[]>;
  isSelected: boolean;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  guides: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[];
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, width: number, height: number) => void;
  onSelectElement: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSync: () => void;
}

export const ElementRenderer = React.memo(function ElementRenderer({
  el, childrenMap, isSelected, zoom,
  snapToGrid, gridSize, guides,
  onMoveElement, onResizeElement, onSelectElement, onToggleSelection, onSync,
}: ElementRendererProps) {
  const styles = useStyles();
  const Component = elementMap[el.type];
  if (!Component) return null;

  if (el.props?.rawHtml) {
    return (
      <div
        key={el.id}
        data-element-id={el.id}
        style={{
          position: 'absolute',
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          zIndex: el.zIndex,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Component {...el.props} meta={el.meta} />
      </div>
    );
  }

  const children = childrenMap[el.id];

  if (children && children.length > 0 && el.type === 'container') {
    return (
      <Rnd
        key={el.id}
        default={{ x: el.x, y: el.y, width: el.width, height: el.height }}
        position={{ x: el.x, y: el.y }}
        size={{ width: el.width, height: el.height }}
        scale={zoom}
        onDragStop={(_e, d) => {
          const dx = d.x - el.x;
          const dy = d.y - el.y;
          children.forEach((child) => {
            onMoveElement(child.id, child.x + dx, child.y + dy);
          });
          onMoveElement(el.id, d.x, d.y);
          onSync();
        }}
        onResizeStop={(_e, _direction, ref, _delta, position) => {
          const w = parseInt(ref.style.width);
          const h = parseInt(ref.style.height);
          const isAutoLayout = el.props?.layout && el.props.layout !== 'free';
          if (!isAutoLayout) {
            const scaleX = w / el.width;
            const scaleY = h / el.height;
            children.forEach((child) => {
              onMoveElement(child.id, child.x * scaleX, child.y * scaleY);
              onResizeElement(child.id, child.width * scaleX, child.height * scaleY);
            });
          }
          onResizeElement(el.id, w, h);
          onMoveElement(el.id, position.x, position.y);
          onSync();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) {
            onToggleSelection(el.id);
          } else {
            onSelectElement(el.id);
          }
        }}
        bounds="parent"
        style={{
          zIndex: el.zIndex,
          opacity: el.opacity,
          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        }}
        className={isSelected ? styles.selected : ''}
        enableResizing={isSelected}
        disableDragging={!isSelected}
      >
        <div data-element-id={el.id} style={{ width: '100%', height: '100%', position: 'relative', pointerEvents: 'none' }}>
          <Component {...el.props} meta={el.meta} />
          {children.map((child) => {
            const ChildComp = elementMap[child.type];
            if (!ChildComp) return null;
            const isAutoLayout = el.props?.layout && el.props.layout !== 'free';
            return (
              <div
                key={child.id}
                data-element-id={child.id}
                style={{
                  position: isAutoLayout ? 'relative' : 'absolute',
                  left: isAutoLayout ? undefined : child.x,
                  top: isAutoLayout ? undefined : child.y,
                  width: child.width,
                  height: child.height,
                  zIndex: child.zIndex,
                  opacity: child.opacity,
                  transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
                }}
              >
                <ChildComp {...child.props} meta={child.meta} />
              </div>
            );
          })}
        </div>
      </Rnd>
    );
  }

  return (
    <Rnd
      key={el.id}
      default={{ x: el.x, y: el.y, width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      size={{ width: el.width, height: el.height }}
      scale={zoom}
      onDragStop={(_e, d) => {
        let x = d.x;
        let y = d.y;
        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
        }
        const snapResult = snapElementToGuides(
          { x, y, width: el.width, height: el.height },
          guides
        );
        if (snapResult.x !== undefined) x = snapResult.x;
        if (snapResult.y !== undefined) y = snapResult.y;
        onMoveElement(el.id, x, y);
        onSync();
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        let w = parseInt(ref.style.width);
        let h = parseInt(ref.style.height);
        let newX = position.x;
        let newY = position.y;
        if (snapToGrid) {
          w = Math.round(w / gridSize) * gridSize;
          h = Math.round(h / gridSize) * gridSize;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }
        onResizeElement(el.id, w, h);
        onMoveElement(el.id, newX, newY);
        onSync();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
          onToggleSelection(el.id);
        } else {
          onSelectElement(el.id);
        }
      }}
      bounds="parent"
      style={{
        zIndex: el.zIndex,
        opacity: el.opacity,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
      className={isSelected ? styles.selected : ''}
      enableResizing={isSelected}
      disableDragging={!isSelected}
    >
      <div data-element-id={el.id} style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        <Component {...el.props} meta={el.meta} />
      </div>
    </Rnd>
  );
}, (prevProps, nextProps) => {
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.zoom !== nextProps.zoom) return false;
  if (prevProps.snapToGrid !== nextProps.snapToGrid) return false;
  if (prevProps.gridSize !== nextProps.gridSize) return false;
  return areElementPropsEqual(prevProps.el, nextProps.el);
});
