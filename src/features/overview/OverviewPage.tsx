import { useEffect, useState } from 'react';
import { Text, makeStyles, Spinner } from '@fluentui/react-components';
import { FolderRegular, AddRegular } from '@fluentui/react-icons';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';
import type { DeckMeta, CellValue } from '../../shared/types/project';
import { renderCardRow } from '../preview/CardRenderer';

const useStyles = makeStyles({
  container: {
    height: '100%',
    overflow: 'auto',
    padding: '32px',
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px',
  },
  deckCard: {
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
    ':hover': {
      background: 'rgba(96, 205, 255, 0.08)',
      border: '1px solid rgba(96, 205, 255, 0.25)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  cardPreview: {
    width: '100%',
    aspectRatio: '63 / 88',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '11px 11px 0 0',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    pointerEvents: 'none',
  },
  deckInfo: {
    padding: '12px 14px 14px',
  },
  deckName: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  deckMeta: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  placeholder: {
    width: '100%',
    aspectRatio: '63 / 88',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '11px 11px 0 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60%',
    gap: '16px',
    opacity: 0.5,
  },
});

interface DeckOverview {
  meta: DeckMeta;
  html: string;
  css: string;
  sampleRow: Record<string, CellValue>;
  cardCount: number;
}

export function OverviewPage() {
  const styles = useStyles();
  const manifest = useProjectStore((s) => s.manifest);
  const projectPath = useProjectStore((s) => s.projectPath);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);
  const [deckOverviews, setDeckOverviews] = useState<DeckOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!manifest || !projectPath) {
      setDeckOverviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.all(
      manifest.decks.map(async (deck) => {
        const deckPath = `${projectPath}/${deck.path}`;
        let html = '';
        let css = '';
        let sampleRow: Record<string, CellValue> = {};
        let cardCount = 0;

        try {
          const files = await invoke<{ html: string; css: string }>('read_template', { deckPath });
          html = files.html;
          css = files.css;
        } catch {}

        try {
          const rows = await invoke<Record<string, string>[]>('read_csv', {
            path: `${deckPath}/cards.csv`,
          });
          cardCount = rows.length;
          if (rows.length > 0) sampleRow = rows[0];
        } catch {}

        return { meta: deck, html, css, sampleRow, cardCount };
      })
    ).then((results) => {
      setDeckOverviews(results);
      setLoading(false);
    });
  }, [manifest, projectPath]);

  const handleOpenDeck = async (deck: DeckMeta) => {
    if (!projectPath) return;
    const fullPath = `${projectPath}/${deck.path}`;
    setActiveDeck(deck.id);
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
    setSidebarTab('decks');
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!manifest || deckOverviews.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <FolderRegular fontSize={48} />
          <Text size={400}>No decks yet</Text>
          <Text size={300}>Create a new deck from the Decks tab</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">{manifest.name}</Text>
        <Text size={300} style={{ color: 'rgba(255,255,255,0.4)' }}>
          {deckOverviews.length} {deckOverviews.length === 1 ? 'deck' : 'decks'}
        </Text>
      </div>
      <div className={styles.grid}>
        {deckOverviews.map(({ meta, html, css, sampleRow, cardCount }) => {
          const cardHtml = html.trim()
            ? renderCardRow(html, css, sampleRow)
            : null;
          return (
            <div key={meta.id} className={styles.deckCard} onClick={() => handleOpenDeck(meta)}>
              {cardHtml ? (
                <div className={styles.cardPreview}>
                  <iframe
                    className={styles.iframe}
                    srcDoc={cardHtml}
                    title={meta.name}
                    sandbox="allow-scripts"
                  />
                </div>
              ) : (
                <div className={styles.placeholder}>
                  <AddRegular fontSize={24} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div className={styles.deckInfo}>
                <div className={styles.deckName}>{meta.name}</div>
                <div className={styles.deckMeta}>
                  <span>{cardCount} cards</span>
                  <span>{meta.cardSize.widthMm}×{meta.cardSize.heightMm}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
