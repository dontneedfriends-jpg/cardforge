import React, { useCallback, useRef, useState, useEffect } from 'react';
import { makeStyles } from '@fluentui/react-components';
import { useCanvasStore } from '../../../store/canvasStore';
import { CanvasElement } from '../../../store/canvasStore';
import { useEditorStore, useDeckStore, useUiStore } from '../../../store';
import { mmToPx } from '../../../theme';
import { Rnd } from 'react-rnd';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { ShapeElement } from './elements/ShapeElement';
import { CircleElement } from './elements/CircleElement';
import { LineElement } from './elements/LineElement';
import { IconElement } from './elements/IconElement';
import { FieldBadge } from './elements/FieldBadge';
import { ContainerElement } from './elements/ContainerElement';
import { AssetPickerDialog } from '../../assets/AssetPickerDialog';
import { assetPathToRelative } from '../../../shared/utils/assetPath';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '24px',
  },
  canvas: {
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--mica-stroke)',
    background: '#1a1a2e',
    borderRadius: '8px',
    flexShrink: 0,
  },
  selected: {
    outline: '2px solid var(--mica-accent)',
    outlineOffset: '2px',
  },
});

interface CanvasProps {
  widthMm: number;
  heightMm: number;
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
};

export function Canvas({ widthMm, heightMm }: CanvasProps) {
  const styles = useStyles();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [pendingImageElement, setPendingImageElement] = useState<CanvasElement | null>(null);
  const elements = useCanvasStore((state) => state.elements);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const addElement = useCanvasStore((state) => state.addElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const moveElement = useCanvasStore((state) => state.moveElement);
  const resizeElement = useCanvasStore((state) => state.resizeElement);

  const syncVisualToCode = useEditorStore((s) => s.syncVisualToCode);
  const editorMode = useEditorStore((s) => s.editorMode);
  const deckData = useDeckStore((s) => s.deckData);
  const cardSize = deckData?.meta.cardSize ?? { widthMm, heightMm, bleedMm: 3 };
  const showGrid = useUiStore((s) => s.showGrid);
  const snapToGrid = useUiStore((s) => s.snapToGrid);
  const gridSize = useUiStore((s) => s.gridSize);

  // Вызываем синхронизацию только в visual режиме.
  // Используем ref чтобы иметь актуальный cardSize в нативных обработчиках.
  const syncRef = useRef(syncVisualToCode);
  syncRef.current = syncVisualToCode;
  const cardSizeRef = useRef(cardSize);
  cardSizeRef.current = cardSize;
  const editorModeRef = useRef(editorMode);
  editorModeRef.current = editorMode;

  const syncIfVisual = useCallback(() => {
    if (editorModeRef.current === 'visual') {
      syncRef.current(cardSizeRef.current);
    }
  }, []);

  const addElementRef = useRef(addElement);
  addElementRef.current = addElement;
  const elementsLengthRef = useRef(elements.length);
  elementsLengthRef.current = elements.length;

  const cardW = mmToPx(widthMm);
  const cardH = mmToPx(heightMm);

  // Нативные обработчики на document для обхода react-rnd
  useEffect(() => {
    const getCanvasRect = () => canvasRef.current?.getBoundingClientRect() ?? null;

    const isOverCanvas = (e: DragEvent): boolean => {
      const rect = getCanvasRect();
      if (!rect) return false;
      return (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      );
    };

    const onDocDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = isOverCanvas(e) ? 'copy' : 'none';
      }
      setIsDragOver(isOverCanvas(e));
    };

    const onDocDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!isOverCanvas(e)) return;

      const type = (e.dataTransfer?.getData('elementType') || e.dataTransfer?.getData('text/plain')) as CanvasElement['type'];
      if (!type) return;

      const rect = getCanvasRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const defaultProps: Record<string, any> = {
        text: { text: 'Text', fontSize: 14, fontWeight: 'normal', color: '#ffffff', textAlign: 'left' },
        image: { src: '', fieldName: '', isField: false },
        shape: { background: '#444', fill: '', borderRadius: 0, borderWidth: 0, borderColor: '#000' },
        circle: { background: '#444', borderWidth: 0, borderColor: '#000' },
        line: { color: '#fff', lineWidth: 2 },
        icon: { iconName: 'star', iconSize: 24, color: '#fff' },
        field: { fieldName: 'name', fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'left' },
        container: { background: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 8 },
      };

      const defaultSizes: Record<string, { width: number; height: number }> = {
        text: { width: 180, height: 30 },
        image: { width: 100, height: 100 },
        shape: { width: 100, height: 100 },
        circle: { width: 80, height: 80 },
        line: { width: 100, height: 4 },
        icon: { width: 40, height: 40 },
        field: { width: 180, height: 30 },
        container: { width: 150, height: 100 },
      };

      const size = defaultSizes[type];

      const newElement: CanvasElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        x: x - size.width / 2,
        y: y - size.height / 2,
        width: size.width,
        height: size.height,
        rotation: 0,
        opacity: 1,
        zIndex: elementsLengthRef.current,
        visible: true,
        props: defaultProps[type] || {},
      };

      if (type === 'image') {
        // Show asset picker for images
        setPendingImageElement(newElement);
        setAssetPickerOpen(true);
      } else {
        addElementRef.current(newElement);
        // Синхронизируем canvas → код после добавления элемента.
        // Используем setTimeout чтобы дождаться коммита Zustand.
        setTimeout(() => syncIfVisual(), 0);
      }
    };

    document.addEventListener('dragover', onDocDragOver);
    document.addEventListener('drop', onDocDrop);
    return () => {
      document.removeEventListener('dragover', onDocDragOver);
      document.removeEventListener('drop', onDocDrop);
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        selectElement(null);
      }
    },
    [selectElement]
  );

  return (
    <div className={styles.container}>
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{ 
          width: cardW, 
          height: cardH,
          outline: isDragOver ? '2px dashed #60cdff' : undefined,
          outlineOffset: isDragOver ? '3px' : undefined,
          background: showGrid
            ? `
                linear-gradient(to right, rgba(96,205,255,0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(96,205,255,0.15) 1px, transparent 1px),
                #1a1a2e
              `
            : '#1a1a2e',
          backgroundSize: showGrid ? `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, 100% 100%` : undefined,
        }}
        onClick={handleClick}
      >
        {elements.map((el) => {
          const Component = elementMap[el.type];
          if (!Component) return null;

          const isSelected = selectedId === el.id;

          return (
            <Rnd
              key={el.id}
              default={{
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
              }}
              position={{ x: el.x, y: el.y }}
              size={{ width: el.width, height: el.height }}
              onDragStop={(_e, d) => {
                const x = snapToGrid ? Math.round(d.x / gridSize) * gridSize : d.x;
                const y = snapToGrid ? Math.round(d.y / gridSize) * gridSize : d.y;
                moveElement(el.id, x, y);
                syncIfVisual();
              }}
              onResizeStop={(_e, _direction, ref, _delta, position) => {
                const w = parseInt(ref.style.width);
                const h = parseInt(ref.style.height);
                const newW = snapToGrid ? Math.round(w / gridSize) * gridSize : w;
                const newH = snapToGrid ? Math.round(h / gridSize) * gridSize : h;
                const newX = snapToGrid ? Math.round(position.x / gridSize) * gridSize : position.x;
                const newY = snapToGrid ? Math.round(position.y / gridSize) * gridSize : position.y;
                resizeElement(el.id, newW, newH);
                moveElement(el.id, newX, newY);
                syncIfVisual();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                selectElement(el.id);
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
              <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                <Component {...el.props} />
              </div>
            </Rnd>
          );
        })}
      </div>
      
      <AssetPickerDialog
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={(assetPath) => {
          if (pendingImageElement) {
            const relativePath = assetPathToRelative(assetPath);
            const elementWithSrc = {
              ...pendingImageElement,
              props: {
                ...pendingImageElement.props,
                src: relativePath,
                isField: false,
              }
            };
            addElementRef.current(elementWithSrc);
            setTimeout(() => syncIfVisual(), 0);
            setPendingImageElement(null);
          }
        }}
        title="Select Image for Card"
      />
    </div>
  );
}
