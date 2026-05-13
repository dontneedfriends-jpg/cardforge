import { Text, makeStyles, SpinButton, Tooltip } from '@fluentui/react-components';
import type { SpinButtonOnChangeData } from '@fluentui/react-components';
import { useEditorStore, useDeckStore, useProjectStore, useUiStore } from '../../store';
import { mmToPx } from '../../theme';
import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { injectFontCss } from '../../shared/utils/fontUtils';
import type { CellValue } from '../../shared/types/project';

const DEFAULT_CARD_WIDTH = 63;
const DEFAULT_CARD_HEIGHT = 88;

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    height: '48px',
    minHeight: '48px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
  },
  canvas: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignContent: 'flex-start',
    justifyContent: 'center',
  },
  iframeWrap: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--mica-shadow-lg)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mica-shadow-xl)',
    },
  },
  dimensionBadge: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '3px 10px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: '11px',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  hint: {
    marginTop: '40px',
    color: 'var(--mica-text-tertiary)',
    textAlign: 'center',
    fontSize: '13px',
  },
  fitBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--mica-accent)',
    fontSize: '11px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: '2px 8px',
    borderRadius: '4px',
    ':hover': {
      background: 'var(--mica-accent-secondary)',
    },
  },
});

export function PreviewPanel() {
  const styles = useStyles();
  const html = useEditorStore((s) => s.html);
  const css = useEditorStore((s) => s.css);
  const deckData = useDeckStore((s) => s.deckData);
  const projectPath = useProjectStore((s) => s.projectPath);
  const manifest = useProjectStore((s) => s.manifest);
  const activeBoardId = useEditorStore((s) => s.activeBoardId);
  const previewBackground = useUiStore((s) => s.previewBackground);
  const [zoom, setZoom] = useState(1);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const projectPathRef = useRef(projectPath);
  projectPathRef.current = projectPath;

  const canvasRef = useRef<HTMLDivElement>(null);

  const activeBoard = activeBoardId ? manifest?.boards.find(b => b.id === activeBoardId) : null;
  const isBoardMode = !!activeBoard;

  const previewWidthMm = isBoardMode ? activeBoard!.widthMm : (deckData ? deckData.meta.cardSize.widthMm : DEFAULT_CARD_WIDTH);
  const previewHeightMm = isBoardMode ? activeBoard!.heightMm : (deckData ? deckData.meta.cardSize.heightMm : DEFAULT_CARD_HEIGHT);

  // Auto-fit zoom for large boards
  const fitZoom = useCallback(() => {
    if (!canvasRef.current) return 1;
    const pad = 40;
    const availW = canvasRef.current.clientWidth - pad * 2;
    const availH = canvasRef.current.clientHeight - pad * 2;
    if (availW <= 0 || availH <= 0) return 1;
    const pxW = mmToPx(previewWidthMm);
    const pxH = mmToPx(previewHeightMm);
    if (pxW <= 0 || pxH <= 0) return 1;
    const fit = Math.min(availW / pxW, availH / pxH);
    // Clamp to reasonable range
    return Math.max(0.15, Math.min(fit, 2));
  }, [previewWidthMm, previewHeightMm]);

  useEffect(() => {
    if (isBoardMode && zoom >= 1) {
      // On first render, auto-fit the board into the panel
      const fz = fitZoom();
      if (fz < 1) setZoom(Math.round(fz * 100) / 100);
    }
  }, [isBoardMode]);

  useEffect(() => {
    if (!html.trim()) {
      setBlobUrls([]);
      return;
    }

    const loadPreviews = async () => {
      setLoading(true);
      try {
        const rows = isBoardMode
          ? [{}]
          : (!deckData || deckData.rows.length === 0)
            ? [{}]
            : deckData.rows;

        let fontCss = css;
        try {
          if (projectPathRef.current) fontCss = await injectFontCss(css, projectPathRef.current);
        } catch { /* font CSS not critical */ }

        const renderedHtmls = await Promise.all(
          rows.map(async (row: Record<string, CellValue>) => {
            if (!projectPathRef.current) {
              const body = html.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
                return row[key] !== undefined ? String(row[key]) : '';
              });
              return `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  ${fontCss}
</style>
</head>
<body>${body}</body>
</html>`;
            }

            try {
              const result = await invoke('render_preview_html', {
                html,
                css: fontCss,
                rowJson: JSON.stringify(row),
                projectPath: projectPathRef.current,
              }) as string;
              return result;
            } catch {
              const body = html.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
                return row[key] !== undefined ? String(row[key]) : '';
              });
              return `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  ${fontCss}
</style>
</head>
<body>${body}</body>
</html>`;
            }
          })
        );

        const urls = renderedHtmls.map(htmlStr =>
          URL.createObjectURL(new Blob([htmlStr], { type: 'text/html' }))
        );

        setBlobUrls(prevUrls => {
          prevUrls.forEach(url => URL.revokeObjectURL(url));
          return urls;
        });
      } catch (e) {
        console.error('Preview rendering failed:', e);
      } finally {
        setLoading(false);
      }
    };

    loadPreviews();

    return () => {
      setBlobUrls(prevUrls => {
        prevUrls.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
    };
  }, [html, css, deckData, projectPath, isBoardMode]);

  const previewWidth = mmToPx(previewWidthMm) * zoom;
  const previewHeight = mmToPx(previewHeightMm) * zoom;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">{isBoardMode ? 'Board Preview' : 'Preview'}</Text>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isBoardMode && (
            <button
              className={styles.fitBtn}
              onClick={() => setZoom(Math.round(fitZoom() * 100) / 100)}
              title="Fit board to panel"
            >
              Fit
            </button>
          )}
          <SpinButton
            size="small"
            value={zoom}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(_e: unknown, data: SpinButtonOnChangeData) => {
              if (data.value !== undefined && data.value !== null) setZoom(data.value);
            }}
            style={{ width: 80 }}
          />
        </div>
      </div>
      <div className={styles.canvas} ref={canvasRef}>
        {!html.trim() && (
          <Text size={300} className={styles.hint}>
            Template is empty — write some HTML
          </Text>
        )}
        {html.trim() && !isBoardMode && (!deckData || deckData.rows.length === 0) && (
          <Text size={300} className={styles.hint}>
            {!deckData ? 'No card data loaded — add rows in the Data tab' : 'No cards to preview — add rows in the Data tab'}
          </Text>
        )}
        {isBoardMode && html.trim() && blobUrls.length === 0 && (
          <Text size={300} className={styles.hint}>
            {loading ? 'Rendering preview...' : 'Board is ready for editing'}
          </Text>
        )}
        {loading && blobUrls.length === 0 && !isBoardMode && (
          <Text size={300} className={styles.hint}>
            Rendering preview...
          </Text>
        )}
        {(isBoardMode || (deckData && deckData.rows.length > 0)) && blobUrls.length > 0 && blobUrls.map((url: string, i: number) => (
          <div
            key={`${i}-${url}`}
            className={styles.iframeWrap}
            style={{
              width: previewWidth,
              height: previewHeight,
              background:
                previewBackground === 'dark' ? '#1a1a1a' :
                previewBackground === 'light' ? '#ffffff' :
                'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px',
            }}
          >
            {isBoardMode && (
              <Tooltip content={`${previewWidthMm}×${previewHeightMm}mm — zoom ${Math.round(zoom * 100)}%`} relationship="label">
                <div className={styles.dimensionBadge}>
                  {previewWidthMm}×{previewHeightMm}mm
                </div>
              </Tooltip>
            )}
            <iframe
              src={url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={`${isBoardMode ? 'board' : 'card'}-${i}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
