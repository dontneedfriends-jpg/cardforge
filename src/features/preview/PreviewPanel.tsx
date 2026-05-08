import { Text, makeStyles, SpinButton } from '@fluentui/react-components';
import type { SpinButtonOnChangeData } from '@fluentui/react-components';
import { useEditorStore, useDeckStore, useProjectStore } from '../../store';
import { mmToPx } from '../../theme';
import { renderCardRow } from './CardRenderer';
import { useMemo, useState, useEffect } from 'react';

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
    background: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
    background: '#fff',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    },
  },
  hint: {
    marginTop: '40px',
    color: 'rgba(255, 255, 255, 0.40)',
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
  const [zoom, setZoom] = useState(1);

  // Render cards: if no deck data, show one empty preview
  const rendered = useMemo(() => {
    if (!html.trim()) return [];
    if (!deckData || deckData.rows.length === 0) {
      // Show one card with empty data so user can see the template
      return [renderCardRow(html, css, {}, projectPath || undefined)];
    }
    return deckData.rows.map((row: Record<string, any>) => 
      renderCardRow(html, css, row, projectPath || undefined)
    );
  }, [html, css, deckData, projectPath]);

  const [blobUrls, setBlobUrls] = useState<string[]>([]);

  useEffect(() => {
    if (rendered.length === 0) {
      setBlobUrls([]);
      return;
    }
    const urls = rendered.map(htmlStr => URL.createObjectURL(new Blob([htmlStr], { type: 'text/html' })));
    setBlobUrls(prevUrls => {
      prevUrls.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [rendered]);

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
        {blobUrls.map((url: string, i: number) => (
          <div
            key={`${i}-${url}`}
            className={styles.iframeWrap}
            style={{ width: cardWidth, height: cardHeight }}
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
