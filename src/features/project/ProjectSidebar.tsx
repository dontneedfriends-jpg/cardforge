import { Text, makeStyles, mergeClasses, Button, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Card, CardHeader, CardPreview } from '@fluentui/react-components';
import { DocumentRegular, CodeRegular, TableRegular, FolderRegular, DocumentCssRegular, AddRegular } from '@fluentui/react-icons';
import { useProjectStore, useDeckStore, useEditorStore } from '../../store';
import { readDir } from '@tauri-apps/plugin-fs';
import { useEffect, useState } from 'react';
import { cardTemplates, type CardTemplate } from '../../shared/templates/cardTemplates';
import { invoke } from '@tauri-apps/api/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  header: {
    height: '48px',
    minHeight: '48px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  deckItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '4px 12px',
    transition: 'all 0.15s ease',
    color: 'rgba(255, 255, 255, 0.65)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.06)',
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
  selectedDeck: {
    background: 'rgba(96, 205, 255, 0.12)',
    color: '#60cdff',
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
    color: 'rgba(255, 255, 255, 0.40)',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.04)',
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  folderIcon: {
    marginRight: '4px',
    opacity: 0.6,
  },
});

const fileIcons: Record<string, React.FC<{ fontSize?: number }>> = {
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
  const [files, setFiles] = useState<string[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [deckName, setDeckName] = useState('');

  const activeDeck = manifest?.decks.find(d => d.id === activeDeckId);

  useEffect(() => {
    if (!projectPath || !activeDeck) { setFiles([]); return; }
    const deckPath = `${projectPath}/${activeDeck.path}`;
    readDir(deckPath).then(entries => {
      setFiles(entries.filter(e => e.isFile).map(e => e.name).sort());
    }).catch(() => setFiles([]));
  }, [projectPath, activeDeck]);

  const handleSelectDeck = async (deck: any) => {
    if (!projectPath) return;
    const fullPath = `${projectPath}/${deck.path}`;
    setActiveDeck(deck.id);
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
  };

  const handleCreateDeck = async () => {
    if (!projectPath || !selectedTemplate || !deckName.trim()) return;
    
    // Add deck to manifest
    addDeck(deckName, selectedTemplate.cardSize);
    
    // Get the newly created deck
    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find(d => d.name === deckName);
    
    if (newDeck) {
      const deckPath = `${projectPath}/${newDeck.path}`;
      
      // Create template files
      try {
        await invoke('write_template', { 
          deckPath, 
          html: selectedTemplate.html, 
          css: selectedTemplate.css 
        });
        
        // Create CSV with sample data
        if (selectedTemplate.sampleData.length > 0) {
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
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text size={400} weight="semibold">{manifest.name}</Text>
          <Button 
            icon={<AddRegular />} 
            size="small" 
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            New Deck
          </Button>
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
    </>
  );
}
