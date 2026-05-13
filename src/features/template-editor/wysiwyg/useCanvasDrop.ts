import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { CanvasElement } from '../../../store/canvasStore';

interface UseCanvasDropResult {
  isDragOver: boolean;
  pendingImageElement: CanvasElement | null;
  assetPickerOpen: boolean;
  setAssetPickerOpen: (open: boolean) => void;
  setPendingImageElement: (el: CanvasElement | null) => void;
}

export function useCanvasDrop(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  syncIfVisual: () => void,
  elementsLength: number
): UseCanvasDropResult {
  const addElement = useCanvasStore((state) => state.addElement);
  const [isDragOver, setIsDragOver] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [pendingImageElement, setPendingImageElement] = useState<CanvasElement | null>(null);

  const addElementRef = useRef(addElement);
  addElementRef.current = addElement;
  const elementsLengthRef = useRef(elementsLength);
  elementsLengthRef.current = elementsLength;
  const syncRef = useRef(syncIfVisual);
  syncRef.current = syncIfVisual;

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

      const dt = e.dataTransfer;
      if (!dt) return;

      const assetPath = dt.getData('assetPath');
      if (assetPath) {
        const rect = getCanvasRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newElement: CanvasElement = {
          id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          x: x - 50,
          y: y - 50,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          zIndex: elementsLengthRef.current,
          visible: true,
          props: { src: assetPath, fieldName: '', isField: false },
        };
        addElementRef.current(newElement);
        setTimeout(() => syncRef.current(), 0);
        return;
      }

      const rawType = dt.getData('elementType') || dt.getData('text/plain');
      if (!rawType) return;
      const validTypes: CanvasElement['type'][] = ['text', 'image', 'shape', 'circle', 'line', 'icon', 'field', 'container', 'qr'];
      if (!validTypes.includes(rawType as CanvasElement['type'])) return;
      const type = rawType as CanvasElement['type'];

      const rect = getCanvasRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const defaultProps: Record<string, Record<string, unknown>> = {
        text: { text: 'Text', fontSize: 14, fontWeight: 'normal', color: '#ffffff', textAlign: 'left' },
        image: { src: '', fieldName: '', isField: false },
        shape: { background: '#444', fill: '', borderRadius: 0, borderWidth: 0, borderColor: '#000' },
        circle: { background: '#444', borderWidth: 0, borderColor: '#000' },
        line: { color: '#fff', lineWidth: 2 },
        icon: { iconName: 'star', iconSize: 24, color: '#fff' },
        field: { fieldName: 'name', fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'left' },
        container: { background: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 8, layout: 'free' },
        qr: { data: 'https://example.com', qrSize: 100, color: '#000000', bgColor: '#ffffff', errorCorrection: 'M' },
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
        qr: { width: 100, height: 100 },
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
        setPendingImageElement(newElement);
        setAssetPickerOpen(true);
      } else {
        addElementRef.current(newElement);
        setTimeout(() => syncRef.current(), 0);
      }
    };

    document.addEventListener('dragover', onDocDragOver);
    document.addEventListener('drop', onDocDrop);
    return () => {
      document.removeEventListener('dragover', onDocDragOver);
      document.removeEventListener('drop', onDocDrop);
    };
  }, [canvasRef]);

  return { isDragOver, pendingImageElement, assetPickerOpen, setAssetPickerOpen, setPendingImageElement };
}
