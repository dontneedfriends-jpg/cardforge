import { Text, makeStyles, mergeClasses, Button, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Card, CardHeader, CardPreview, MessageBar, MessageBarBody, ProgressBar } from '@fluentui/react-components';
import { DocumentRegular, CodeRegular, TableRegular, FolderRegular, DocumentCssRegular, AddRegular, BoardRegular, HatGraduationRegular, type FluentIcon } from '@fluentui/react-icons';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import { TemplateWizardDialog } from '../template-wizard/TemplateWizardDialog';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import { useEffect, useState } from 'react';
import { cardTemplates, type CardTemplate } from '../../shared/templates/cardTemplates';
import { CARD_SIZE_PRESETS, DEFAULT_CARD_SIZE } from '../../shared/cardSizes';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { DeckMeta } from '../../shared/types/project';

  const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  header: {
    height: '36px',
    minHeight: '36px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)',
  },
  deckItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '4px 12px',
    transition: 'all 0.15s ease',
    color: 'var(--mica-text-secondary)',
    ':hover': {
      background: 'var(--mica-layer-2)',
      color: 'var(--mica-text-primary)',
    },
  },
  selectedDeck: {
    background: 'var(--mica-accent-tertiary)',
    color: 'var(--mica-accent)',
    boxShadow: '0 0 16px rgba(96, 205, 255, 0.08)',
  },
  fileItem: {
    padding: '6px 16px 6px 40px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '6px',
    margin: '2px 12px',
    color: 'var(--mica-text-tertiary)',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'var(--mica-layer-1)',
      color: 'var(--mica-text-secondary)',
    },
  },
  folderIcon: {
    marginRight: '4px',
    opacity: 0.6,
  },
});

const fileIcons: Record<string, FluentIcon> = {
  'template.html': CodeRegular,
  'template.css': DocumentCssRegular,
  'cards.csv': TableRegular,
};

export function ProjectSidebar() {
  const styles = useStyles();
  const manifest = useProjectStore((s) => s.manifest);
  const projectPath = useProjectStore((s) => s.projectPath);
  const addDeck = useProjectStore((s) => s.addDeck);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const defaultCardSizePreset = useUiStore((s) => s.defaultCardSizePreset);
  const [files, setFiles] = useState<string[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isWizardDialogOpen, setIsWizardDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [deckName, setDeckName] = useState('');
  const [isTtsDialogOpen, setIsTtsDialogOpen] = useState(false);
  const [ttsInfo, setTtsInfo] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const activeDeck = manifest?.decks.find(d => d.id === activeDeckId);

  useEffect(() => {
    if (!projectPath || !activeDeck) { setFiles([]); return; }
    const deckPath = `${projectPath}/${activeDeck.path}`;
    readDir(deckPath).then(entries => {
      setFiles(entries.filter(e => e.isFile).map(e => e.name).sort());
    }).catch(() => setFiles([]));
  }, [projectPath, activeDeck]);

  const handleSelectDeck = async (deck: DeckMeta) => {
    if (!projectPath) return;
    const fullPath = `${projectPath}/${deck.path}`;
    setActiveDeck(deck.id);
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
  };

  const handleCreateDeck = async () => {
    if (!projectPath || !deckName.trim()) return;

    const preset = CARD_SIZE_PRESETS.find(p => p.id === defaultCardSizePreset);
    const cardSize = selectedTemplate?.cardSize ?? preset ?? DEFAULT_CARD_SIZE;
    
    // Add deck to manifest
    addDeck(deckName, cardSize);
    
    // Get the newly created deck
    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find(d => d.name === deckName);
    
    if (newDeck) {
      const deckPath = `${projectPath}/${newDeck.path}`;
      
        // Create template files
      try {
        await invoke('write_template', { 
          deckPath, 
          html: selectedTemplate?.html ?? '<div class="card-root" style="position:relative;width:100%;height:100%;"></div>', 
          css: selectedTemplate?.css ?? '.card-root { width: 100%; height: 100%; }' 
        });

        // Create initial canvas.json with a raw container showing the template
        const cardPxW = (selectedTemplate?.cardSize.widthMm ?? 63) * 3;
        const cardPxH = (selectedTemplate?.cardSize.heightMm ?? 88) * 3;
        const rawElements = [{
          id: 'raw_template_container',
          type: 'container',
          x: 0, y: 0, width: cardPxW, height: cardPxH,
          rotation: 0, opacity: 1, zIndex: 0, visible: true,
          props: { rawHtml: selectedTemplate?.html ?? '', rawCss: selectedTemplate?.css ?? '' },
        }];
        await invoke('write_canvas', { deckPath, content: JSON.stringify(rawElements) });
        
        // Create CSV with sample data
        if (selectedTemplate && selectedTemplate.sampleData.length > 0) {
          const headers = Object.keys(selectedTemplate.sampleData[0]);
          const csvContent = [
            headers.join(','),
            ...selectedTemplate.sampleData.map(row => 
              headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
            )
          ].join('\n');
          
          await invoke('write_csv_content', { 
            path: `${deckPath}/cards.csv`, 
            content: csvContent 
          });
        }
        
        // Select the new deck
        await handleSelectDeck(newDeck);
      } catch (e) {
        console.error('Failed to create deck files:', e);
      }
    }
    
    setIsTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setDeckName('');
  };

  const handleImportTts = async () => {
    if (!projectPath) return;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'TTS Save Object', extensions: ['json'] }],
      });
      if (!selected) return;

      setImportStatus('Parsing TTS JSON...');
      const info = await invoke<any>('parse_tts_json', { ttsJsonPath: selected });
      setTtsInfo(info);
      setIsTtsDialogOpen(true);
      setImportStatus('');
    } catch (e: any) {
      setImportStatus(`Error: ${e?.toString() || e}`);
    }
  };

  const handleConfirmTtsImport = async () => {
    if (!projectPath || !ttsInfo) return;
    setImporting(true);
    setImportStatus('Downloading spritesheet...');

    try {
      let spritesheetData: Uint8Array;
      let backData: Uint8Array;

      // Download or select face image
      if (ttsInfo.faceUrl && ttsInfo.faceUrl.startsWith('http')) {
        const resp = await fetch(ttsInfo.faceUrl);
        const buf = await resp.arrayBuffer();
        spritesheetData = new Uint8Array(buf);
      } else {
        const imgPath = await open({
          multiple: false,
          filters: [{ name: 'Spritesheet Image', extensions: ['png', 'jpg', 'jpeg'] }],
          title: 'Select spritesheet image file',
        });
        if (!imgPath) { setImporting(false); return; }
        const buf = await readFile(imgPath);
        spritesheetData = new Uint8Array(buf);
      }

      // Download or select back image  
      if (ttsInfo.backUrl && ttsInfo.backUrl.startsWith('http')) {
        const resp = await fetch(ttsInfo.backUrl);
        const buf = await resp.arrayBuffer();
        backData = new Uint8Array(buf);
      } else {
        backData = spritesheetData; // fallback: use face sheet as back
      }

      setImportStatus('Slicing spritesheet and creating deck...');
      const result = await invoke<any>('slice_tts_spritesheet', {
        projectPath,
        deckName: ttsInfo.deckName,
        spritesheetData: Array.from(spritesheetData),
        backData: Array.from(backData),
        numWidth: ttsInfo.numWidth,
        numHeight: ttsInfo.numHeight,
        cardNames: ttsInfo.cardNames,
      });

      // Add deck to manifest and select it
      addDeck(ttsInfo.deckName, DEFAULT_CARD_SIZE);

      // Select the new deck
      const updatedManifest = useProjectStore.getState().manifest;
      const newDeck = updatedManifest?.decks.find(d => d.name === ttsInfo.deckName);
      if (newDeck) {
        await handleSelectDeck(newDeck);
      }

      setIsTtsDialogOpen(false);
      setTtsInfo(null);
      setImportStatus(`Imported ${result.cardCount} cards from TTS`);
    } catch (e: any) {
      setImportStatus(`Import error: ${e?.toString() || e}`);
    }
    setImporting(false);
  };

  if (!manifest) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={400} weight="semibold">Decks</Text>
        </div>
        <div style={{ padding: 16 }}>
          <Text size={300}>No project open</Text>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={300} weight="semibold">Decks</Text>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              icon={<HatGraduationRegular />}
              size="small"
              onClick={(e) => { e.stopPropagation(); setIsWizardDialogOpen(true); }}
              title="Template Wizard — step by step"
            >
              Wizard
            </Button>
            <Button
              icon={<BoardRegular />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleImportTts(); }}
              disabled={importing}
              title="Import from TTS save file"
            >
              TTS
            </Button>
            <Button 
              icon={<AddRegular />} 
              size="small" 
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              New
            </Button>
          </div>
        </div>
        {manifest.decks.map((deck) => (
          <div key={deck.id}>
            <div
              className={mergeClasses(styles.deckItem, activeDeckId === deck.id && styles.selectedDeck)}
              onClick={() => handleSelectDeck(deck)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderRegular fontSize={16} className={styles.folderIcon} />
                <Text size={300}>{deck.name}</Text>
              </div>
            </div>
            {activeDeckId === deck.id && files.map(f => {
              const Icon = fileIcons[f] || DocumentRegular;
              return (
                <div key={f} className={styles.fileItem}>
                  <Icon fontSize={14} />
                  <Text size={200}>{f}</Text>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <TemplateWizardDialog open={isWizardDialogOpen} onOpenChange={setIsWizardDialogOpen} />

      <Dialog open={isTemplateDialogOpen} onOpenChange={() => setIsTemplateDialogOpen(false)}>
        <DialogSurface style={{ maxWidth: 700, maxHeight: '80vh' }}>
          <DialogBody>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogContent>
              <div style={{ marginBottom: 16 }}>
                <Text size={300}>Deck Name:</Text>
                <input 
                  type="text" 
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="My Deck"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    marginTop: 8,
                    borderRadius: 4,
                    border: '1px solid var(--colorNeutralStroke2)',
                    background: 'var(--colorNeutralBackground1)',
                    color: 'var(--colorNeutralForeground1)'
                  }}
                />
              </div>
              
              <Text size={300} weight="semibold" style={{ marginBottom: 12, display: 'block' }}>
                Choose a Template:
              </Text>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 12,
                maxHeight: 400,
                overflow: 'auto',
                padding: 4
              }}>
                {cardTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={selectedTemplate?.id === template.id ? 'selected-template' : ''}
                    onClick={() => setSelectedTemplate(template)}
                    style={{ 
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? '2px solid var(--colorBrandStroke1)' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CardPreview style={{ height: 80, background: 'var(--colorNeutralBackground2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text size={500}>{template.name[0]}</Text>
                    </CardPreview>
                    <CardHeader 
                      header={<Text weight="semibold">{template.name}</Text>}
                      description={<Text size={200}>{template.description}</Text>}
                    />
                  </Card>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
              <Button 
                appearance="primary" 
                onClick={handleCreateDeck}
                disabled={!selectedTemplate || !deckName.trim()}
              >
                Create Deck
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={isTtsDialogOpen} onOpenChange={(_, d) => { if (!importing) setIsTtsDialogOpen(d.open); }}>
        <DialogSurface style={{ maxWidth: 500 }}>
          <DialogBody>
            <DialogTitle>Import TTS Deck</DialogTitle>
            <DialogContent>
              {ttsInfo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Text weight="semibold">Deck:</Text>
                    <Text> {ttsInfo.deckName}</Text>
                  </div>
                  <div>
                    <Text weight="semibold">Cards:</Text>
                    <Text> {ttsInfo.cardCount}</Text>
                  </div>
                  <div>
                    <Text weight="semibold">Grid:</Text>
                    <Text> {ttsInfo.numWidth}×{ttsInfo.numHeight}</Text>
                  </div>
                  {ttsInfo.faceUrl && (
                    <div>
                      <Text weight="semibold">Face URL:</Text>
                      <Text size={200}> {ttsInfo.faceUrl.length > 60 ? ttsInfo.faceUrl.substring(0, 60) + '…' : ttsInfo.faceUrl}</Text>
                    </div>
                  )}
                  {ttsInfo.cardNames.length > 0 && (
                    <div>
                      <Text weight="semibold">Card Names:</Text>
                      <div style={{ maxHeight: 120, overflow: 'auto', marginTop: 4, fontSize: 12, opacity: 0.8 }}>
                        {ttsInfo.cardNames.map((n: string, i: number) => (
                          <div key={i}>{i + 1}. {n}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {importing && (
                <div style={{ marginTop: 12 }}>
                  <ProgressBar thickness="large" />
                </div>
              )}
              {importStatus && (
                <MessageBar intent={importStatus.startsWith('Error') || importStatus.startsWith('Import error') ? 'error' : 'info'} style={{ marginTop: 12 }}>
                  <MessageBarBody>{importStatus}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsTtsDialogOpen(false)} disabled={importing}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmTtsImport} disabled={importing || !ttsInfo}>
                {importing ? 'Importing...' : 'Import Deck'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
