import { Text, makeStyles, SpinButton } from '@fluentui/react-components';
import type { SpinButtonOnChangeData } from '@fluentui/react-components';
import { useEditorStore, useDeckStore, useProjectStore, useUiStore } from '../../store';
import { mmToPx } from '../../theme';
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { injectFontCss } from '../../shared/utils/fontUtils';

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
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mica-shadow-xl)',
    },
  },
  hint: {
    marginTop: '40px',
    color: 'var(--mica-text-tertiary)',
    textAlign: 'center',
    fontSize: '13px',
  },
});

export function PreviewPanel() {
  const styles = useStyles();
  const html = useEditorStore((s) => s.html);
  const css = useEditorStore((s) => s.css);
  const deckData = useDeckStore((s) => s.deckData);
  const projectPath = useProjectStore((s) => s.projectPath);
  const previewBackground = useUiStore((s) => s.previewBackground);
  const [zoom, setZoom] = useState(1);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const projectPathRef = useRef(projectPath);
  projectPathRef.current = projectPath;

  useEffect(() => {
    if (!html.trim()) {
      setBlobUrls([]);
      return;
    }

    const loadPreviews = async () => {
      setLoading(true);
      try {
        const rows = (!deckData || deckData.rows.length === 0)
          ? [{}]
          : deckData.rows;

        const fontCss = projectPathRef.current ? await injectFontCss(css, projectPathRef.current) : css;

        const renderedHtmls = await Promise.all(
          rows.map(async (row: Record<string, any>) => {
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
  }, [html, css, deckData, projectPath]);

  const cardWidth = (deckData ? mmToPx(deckData.meta.cardSize.widthMm) : mmToPx(DEFAULT_CARD_WIDTH)) * zoom;
  const cardHeight = (deckData ? mmToPx(deckData.meta.cardSize.heightMm) : mmToPx(DEFAULT_CARD_HEIGHT)) * zoom;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">Preview</Text>
        <SpinButton
          size="small"
          value={zoom}
          min={0.25}
          max={3}
          step={0.25}
          onChange={(_e: unknown, data: SpinButtonOnChangeData) => {
            if (data.value !== undefined && data.value !== null) setZoom(data.value);
          }}
          style={{ width: 80 }}
        />
      </div>
      <div className={styles.canvas}>
        {!html.trim() && (
          <Text size={300} className={styles.hint}>
            Template is empty — write some HTML
          </Text>
        )}
        {html.trim() && !deckData && (
          <Text size={300} className={styles.hint}>
            No project open — preview shows empty template
          </Text>
        )}
        {html.trim() && deckData && deckData.rows.length === 0 && (
          <Text size={300} className={styles.hint}>
            No cards to preview — add rows in the Data tab
          </Text>
        )}
        {loading && blobUrls.length === 0 && (
          <Text size={300} className={styles.hint}>
            Rendering preview...
          </Text>
        )}
        {blobUrls.map((url: string, i: number) => (
          <div
            key={`${i}-${url}`}
            className={styles.iframeWrap}
            style={{
              width: cardWidth,
              height: cardHeight,
              background:
                previewBackground === 'dark' ? '#1a1a1a' :
                previewBackground === 'light' ? '#ffffff' :
                'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px',
            }}
          >
            <iframe
              src={url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={`card-${i}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
