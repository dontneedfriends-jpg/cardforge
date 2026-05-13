import React, { useCallback, useRef, useState, useEffect } from 'react';
import { makeStyles } from '@fluentui/react-components';
import { useCanvasStore } from '../../../store/canvasStore';
import type { CanvasElement } from '../../../store/canvasStore';
import { useEditorStore, useUiStore } from '../../../store';
import { mmToPx } from '../../../theme';
import { AssetPickerDialog } from '../../assets/AssetPickerDialog';
import { assetPathToRelative } from '../../../shared/utils/assetPath';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { RulerOverlay, RULER_SIZE } from './Ruler';
import { ElementRenderer } from './ElementRenderer';
import { useCanvasDrop } from './useCanvasDrop';
import { useCanvasKeyboard } from './useCanvasKeyboard';

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
});

interface CanvasProps {
  widthMm: number;
  heightMm: number;
}

export function Canvas({ widthMm, heightMm }: CanvasProps) {
  const styles = useStyles();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [contextMenu, setContextMenu] = useState({
    visible: false, x: 0, y: 0, targetElement: null as string | null,
  });

  const elements = useCanvasStore((state) => state.elements);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const zoom = useCanvasStore((state) => state.zoom);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const toggleSelection = useCanvasStore((state) => state.toggleSelection);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const moveElement = useCanvasStore((state) => state.moveElement);
  const resizeElement = useCanvasStore((state) => state.resizeElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const deleteSelected = useCanvasStore((state) => state.deleteSelected);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const duplicateElement = useCanvasStore((state) => state.duplicateElement);
  const duplicateSelected = useCanvasStore((state) => state.duplicateSelected);
  const copySelected = useCanvasStore((state) => state.copySelected);
  const copyElement = useCanvasStore((state) => state.copyElement);
  const pasteElement = useCanvasStore((state) => state.pasteElement);
  const reorderElement = useCanvasStore((state) => state.reorderElement);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const groupSelected = useCanvasStore((state) => state.groupSelected);
  const ungroupSelected = useCanvasStore((state) => state.ungroupSelected);
  const guides = useCanvasStore((s) => s.guides);


  const syncVisualToCode = useEditorStore((s) => s.syncVisualToCode);
  const editorMode = useEditorStore((s) => s.editorMode);
  const showGrid = useUiStore((s) => s.showGrid);
  const snapToGrid = useUiStore((s) => s.snapToGrid);
  const gridSize = useUiStore((s) => s.gridSize);

  const syncRef = useRef(syncVisualToCode);
  syncRef.current = syncVisualToCode;
  const editorModeRef = useRef(editorMode);
  editorModeRef.current = editorMode;

  const syncIfVisual = useCallback(() => {
    if (editorModeRef.current === 'visual') {
      syncRef.current();
    }
  }, []);

  const cardW = mmToPx(widthMm);
  const cardH = mmToPx(heightMm);

  const { isDragOver, pendingImageElement, assetPickerOpen, setAssetPickerOpen, setPendingImageElement } = useCanvasDrop(
    canvasRef, syncIfVisual, elements.length
  );

  useCanvasKeyboard({
    elements, selectedId, selectedIds, zoom,
    selectElement, clearSelection, deleteSelected, moveElement,
    undo, redo, duplicateSelected, copySelected, pasteElement,
    setZoom, groupSelected, ungroupSelected, syncIfVisual,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const elementNode = target.closest('[data-element-id]');
      const elementId = elementNode?.getAttribute('data-element-id') || null;
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetElement: elementId });
      if (elementId) {
        selectElement(elementId);
      }
    },
    [selectElement]
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Scroll tracking for rulers
  useEffect(() => {
    const container = canvasRef.current?.closest('[data-canvas-container]') as HTMLElement | null;
    if (!container) return;
    const onScroll = () => setScrollPos({ left: container.scrollLeft, top: container.scrollTop });
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const topLevelElements = elements.filter((el) => !el.parentId);
  const childrenMap: Record<string, CanvasElement[]> = {};
  elements.forEach((el) => {
    if (el.parentId) {
      if (!childrenMap[el.parentId]) childrenMap[el.parentId] = [];
      childrenMap[el.parentId].push(el);
    }
  });

  return (
    <div className={styles.container} data-canvas-container>
      <div style={{ position: 'relative', margin: `${RULER_SIZE}px 0 0 ${RULER_SIZE}px` }}>
        <RulerOverlay
          canvasWidth={cardW}
          canvasHeight={cardH}
          scrollLeft={scrollPos.left}
          scrollTop={scrollPos.top}
        />
        <div
          ref={canvasRef}
          className={styles.canvas}
          role="application"
          tabIndex={0}
          style={{
            width: cardW, height: cardH,
            outline: isDragOver ? '2px dashed #60cdff' : undefined,
            outlineOffset: isDragOver ? '3px' : undefined,
            background: showGrid
              ? `linear-gradient(to right, rgba(96,205,255,0.15) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(96,205,255,0.15) 1px, transparent 1px),
                 #1a1a2e`
              : '#1a1a2e',
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, 100% 100%` : undefined,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); } }}
        >
          {topLevelElements.map((el) => (
            <ElementRenderer
              key={el.id}
              el={el}
              childrenMap={childrenMap}
              isSelected={selectedIds.includes(el.id)}
              zoom={zoom}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              guides={guides}
              onMoveElement={moveElement}
              onResizeElement={resizeElement}
              onSelectElement={selectElement}
              onToggleSelection={toggleSelection}
              onSync={syncIfVisual}
            />
          ))}
        </div>
      </div>

      <AssetPickerDialog
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={(assetPath) => {
          if (pendingImageElement) {
            const relativePath = assetPathToRelative(assetPath);
            const elementWithSrc = {
              ...pendingImageElement,
              props: { ...pendingImageElement.props, src: relativePath, isField: false },
            };
            useCanvasStore.getState().addElement(elementWithSrc);
            setTimeout(() => syncIfVisual(), 0);
            setPendingImageElement(null);
          }
        }}
        title="Select Image for Card"
      />

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleCloseContextMenu}
        items={
          contextMenu.targetElement
            ? [
                { label: 'Duplicate', action: () => { duplicateElement(contextMenu.targetElement!); syncIfVisual(); } },
                { label: 'Copy', action: () => copyElement(contextMenu.targetElement!) },
                { label: '', action: () => {}, separator: true },
                { label: 'Bring to Front', action: () => { reorderElement(contextMenu.targetElement!, 'top'); syncIfVisual(); } },
                { label: 'Send to Back', action: () => { reorderElement(contextMenu.targetElement!, 'bottom'); syncIfVisual(); } },
                { label: '', action: () => {}, separator: true },
                { label: 'Delete', action: () => { deleteElement(contextMenu.targetElement!); syncIfVisual(); } },
              ]
            : [
                { label: 'Paste', action: () => { pasteElement(); syncIfVisual(); }, disabled: !useCanvasStore.getState().clipboard },
                { label: '', action: () => {}, separator: true },
                { label: 'Clear Canvas', action: () => { if (confirm('Delete all elements?')) { clearCanvas(); syncIfVisual(); } }, disabled: elements.length === 0 },
              ]
        }
      />
    </div>
  );
}
