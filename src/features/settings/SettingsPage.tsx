import {
  Text,
  makeStyles,
  RadioGroup,
  Radio,
  Dropdown,
  Option,
  Switch,
  Slider,
  TabList,
  Tab,
  Divider,
  Button,
} from '@fluentui/react-components';
import {
  ArrowResetRegular,
} from '@fluentui/react-icons';
import { useState } from 'react';
import { useUiStore } from '../../store';
import { CARD_SIZE_PRESETS } from '../../shared/cardSizes';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--mica-base)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    borderBottom: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)',
    backdropFilter: 'blur(40px)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  tabs: {
    padding: '0 32px',
    borderBottom: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px 32px',
  },
  contentInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '720px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)',
    borderRadius: '12px',
    backdropFilter: 'blur(40px)',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--mica-text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    background: 'var(--mica-accent-secondary)',
    color: 'var(--mica-accent)',
    fontSize: '12px',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '8px 0',
  },
  settingLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  settingTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--mica-text-primary)',
  },
  settingDescription: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
  settingControl: {
    minWidth: '200px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  aboutHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '32px',
    background: 'linear-gradient(135deg, var(--mica-layer-2) 0%, var(--mica-layer-1) 100%)',
    borderRadius: '12px',
    border: '1px solid var(--mica-stroke)',
  },
  aboutLogo: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #60cdff 0%, #0099ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 24px rgba(96, 205, 255, 0.3)',
    flexShrink: 0,
  },
  aboutLogoText: {
    color: '#1c1c1c',
    fontWeight: 800,
    fontSize: '36px',
  },
  aboutInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  aboutTitle: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  aboutVersion: {
    fontSize: '13px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  aboutDescription: {
    fontSize: '14px',
    color: 'var(--mica-text-secondary)',
    lineHeight: 1.6,
    marginTop: '8px',
  },
  aboutLinks: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  aboutLink: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'var(--mica-layer-2)',
    border: '1px solid var(--mica-stroke)',
    color: 'var(--mica-text-secondary)',
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      background: 'var(--mica-layer-3)',
      borderTopColor: 'var(--mica-stroke-strong)',
      borderRightColor: 'var(--mica-stroke-strong)',
      borderBottomColor: 'var(--mica-stroke-strong)',
      borderLeftColor: 'var(--mica-stroke-strong)',
      color: 'var(--mica-text-primary)',
    },
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' as any,
    gap: '12px',
    marginTop: '8px',
  },
  teamCard: {
    padding: '16px',
    background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  teamName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--mica-text-primary)',
  },
  teamRole: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
  resetButton: {
    marginTop: '8px',
  },
  dangerZone: {
    borderTopColor: 'rgba(255, 153, 164, 0.3)',
    borderRightColor: 'rgba(255, 153, 164, 0.3)',
    borderBottomColor: 'rgba(255, 153, 164, 0.3)',
    borderLeftColor: 'rgba(255, 153, 164, 0.3)',
    background: 'rgba(255, 153, 164, 0.05)',
  },
  dangerTitle: {
    color: 'var(--mica-error)',
  },
});

type TabValue = 'general' | 'editor' | 'export' | 'about';

export function SettingsPage() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<TabValue>('general');
  
  // UI Store
  const {
    theme, setTheme,
    fontSize, setFontSize,
    density, setDensity,
    showGrid, setShowGrid,
    snapToGrid, setSnapToGrid,
    gridSize, setGridSize,
    autoSave, setAutoSave,
    autoSaveInterval, setAutoSaveInterval,
    confirmDelete, setConfirmDelete,
    showTooltips, setShowTooltips,
    recentProjectsLimit, setRecentProjectsLimit,
    defaultExportDpi, setDefaultExportDpi,
    defaultBleedMm, setDefaultBleedMm,
    previewBackground, setPreviewBackground,
    language, setLanguage,
    defaultCardSizePreset, setDefaultCardSizePreset,
    resetToDefaults,
  } = useUiStore();

  const renderGeneralSettings = () => (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🎨</span>
          Appearance
        </div>
        
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Theme</span>
            <span className={styles.settingDescription}>Choose your preferred color scheme</span>
          </div>
          <div className={styles.settingControl}>
            <RadioGroup
              value={theme}
              onChange={(_e, data) => setTheme(data.value as any)}
              layout="horizontal"
            >
              <Radio value="light" label="Light" />
              <Radio value="dark" label="Dark" />
              <Radio value="system" label="System" />
            </RadioGroup>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Font Size</span>
            <span className={styles.settingDescription}>Adjust the UI font size</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={fontSize}
              onOptionSelect={(_e, data) => setFontSize(data.optionValue as any)}
              style={{ minWidth: 140 }}
            >
              <Option value="small">Small</Option>
              <Option value="medium">Medium</Option>
              <Option value="large">Large</Option>
            </Dropdown>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Density</span>
            <span className={styles.settingDescription}>Control the spacing between elements</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={density}
              onOptionSelect={(_e, data) => setDensity(data.optionValue as any)}
              style={{ minWidth: 140 }}
            >
              <Option value="compact">Compact</Option>
              <Option value="comfortable">Comfortable</Option>
              <Option value="spacious">Spacious</Option>
            </Dropdown>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Language</span>
            <span className={styles.settingDescription}>Interface language (requires restart)</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={language}
              onOptionSelect={(_e, data) => setLanguage(data.optionValue as any)}
              style={{ minWidth: 140 }}
            >
              <Option value="en">English</Option>
              <Option value="ru">Русский</Option>
            </Dropdown>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Tooltips</span>
            <span className={styles.settingDescription}>Show helpful tooltips on hover</span>
          </div>
          <div className={styles.settingControl}>
            <Switch
              checked={showTooltips}
              onChange={(_e, data) => setShowTooltips(data.checked)}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚙️</span>
          Application
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Auto-save</span>
            <span className={styles.settingDescription}>Automatically save changes</span>
          </div>
          <div className={styles.settingControl}>
            <Switch
              checked={autoSave}
              onChange={(_e, data) => setAutoSave(data.checked)}
            />
          </div>
        </div>

        {autoSave && (
          <>
            <Divider />
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <span className={styles.settingTitle}>Auto-save Interval</span>
                <span className={styles.settingDescription}>Save every {autoSaveInterval} seconds</span>
              </div>
              <div className={styles.settingControl}>
                <Slider
                  min={10}
                  max={120}
                  step={10}
                  value={autoSaveInterval}
                  onChange={(_e, data) => setAutoSaveInterval(data.value)}
                  style={{ minWidth: 150 }}
                />
              </div>
            </div>
          </>
        )}

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Confirm Delete</span>
            <span className={styles.settingDescription}>Show confirmation before deleting items</span>
          </div>
          <div className={styles.settingControl}>
            <Switch
              checked={confirmDelete}
              onChange={(_e, data) => setConfirmDelete(data.checked)}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Recent Projects Limit</span>
            <span className={styles.settingDescription}>Number of recent projects to show</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={String(recentProjectsLimit)}
              onOptionSelect={(_e, data) => setRecentProjectsLimit(Number(data.optionValue))}
              style={{ minWidth: 100 }}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="15">15</Option>
              <Option value="20">20</Option>
            </Dropdown>
          </div>
        </div>
      </div>
    </>
  );

  const renderEditorSettings = () => (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🎯</span>
          Visual Editor
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Show Grid</span>
            <span className={styles.settingDescription}>Display grid lines on canvas</span>
          </div>
          <div className={styles.settingControl}>
            <Switch
              checked={showGrid}
              onChange={(_e, data) => setShowGrid(data.checked)}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Snap to Grid</span>
            <span className={styles.settingDescription}>Elements snap to grid when dragging</span>
          </div>
          <div className={styles.settingControl}>
            <Switch
              checked={snapToGrid}
              onChange={(_e, data) => setSnapToGrid(data.checked)}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Grid Size</span>
            <span className={styles.settingDescription}>Size of grid cells in pixels</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={String(gridSize)}
              onOptionSelect={(_e, data) => setGridSize(Number(data.optionValue))}
              style={{ minWidth: 100 }}
            >
              <Option value="10">10px</Option>
              <Option value="20">20px</Option>
              <Option value="25">25px</Option>
              <Option value="50">50px</Option>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📐</span>
          Default Card Size
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Preset</span>
            <span className={styles.settingDescription}>Default size for new decks</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={defaultCardSizePreset}
              onOptionSelect={(_e, data) => setDefaultCardSizePreset(data.optionValue as string)}
              style={{ minWidth: 280 }}
            >
              {CARD_SIZE_PRESETS.map(p => (
                <Option
                  key={p.id}
                  value={p.id}
                  text={`${p.name} — ${p.widthMm}×${p.heightMm}mm`}
                >
                  {p.name} — {p.widthMm}×{p.heightMm}mm, {p.bleedMm}mm bleed
                  {p.note ? ` (${p.note})` : ''}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>
      </div>
    </>
  );

  const renderExportSettings = () => (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📤</span>
          Export Defaults
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Default DPI</span>
            <span className={styles.settingDescription}>Resolution for exported images</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={String(defaultExportDpi)}
              onOptionSelect={(_e, data) => setDefaultExportDpi(Number(data.optionValue))}
              style={{ minWidth: 140 }}
            >
              <Option value="150">150 (draft)</Option>
              <Option value="300">300 (standard)</Option>
              <Option value="600">600 (print quality)</Option>
            </Dropdown>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Default Bleed</span>
            <span className={styles.settingDescription}>Extra margin for print cutting</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={String(defaultBleedMm)}
              onOptionSelect={(_e, data) => setDefaultBleedMm(Number(data.optionValue))}
              style={{ minWidth: 100 }}
            >
              <Option value="0">0mm (none)</Option>
              <Option value="3">3mm</Option>
              <Option value="5">5mm</Option>
            </Dropdown>
          </div>
        </div>

        <Divider />

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Preview Background</span>
            <span className={styles.settingDescription}>Background for card preview</span>
          </div>
          <div className={styles.settingControl}>
            <Dropdown
              value={previewBackground}
              onOptionSelect={(_e, data) => setPreviewBackground(data.optionValue as any)}
              style={{ minWidth: 140 }}
            >
              <Option value="checkerboard">Checkerboard</Option>
              <Option value="dark">Dark</Option>
              <Option value="light">Light</Option>
            </Dropdown>
          </div>
        </div>
      </div>
    </>
  );

  const renderAbout = () => (
    <>
      <div className={styles.aboutHeader}>
        <div className={styles.aboutLogo}>
          <span className={styles.aboutLogoText}>C</span>
        </div>
        <div className={styles.aboutInfo}>
          <div className={styles.aboutTitle}>CardForge</div>
          <div className={styles.aboutVersion}>Version 0.2.0 — Build 2024.05.08</div>
          <div className={styles.aboutDescription}>
            Desktop IDE for designing game cards. Built with Tauri, React, and love for tabletop games.
          </div>
          <div className={styles.aboutLinks}>
            <a 
              href="https://github.com/yourusername/cardforge" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.aboutLink}
            >
              GitHub
            </a>
            <a 
              href="https://cardforge.dev/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.aboutLink}
            >
              Documentation
            </a>
            <a 
              href="https://cardforge.dev/showcase" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.aboutLink}
            >
              Showcase
            </a>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📋</span>
          Credits
        </div>

        <div className={styles.teamGrid}>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>CardForge Team</div>
            <div className={styles.teamRole}>Design & Development</div>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>Tauri</div>
            <div className={styles.teamRole}>Desktop Framework</div>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>React</div>
            <div className={styles.teamRole}>UI Framework</div>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>Fluent UI</div>
            <div className={styles.teamRole}>Component Library</div>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>Monaco Editor</div>
            <div className={styles.teamRole}>Code Editor</div>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamName}>Handlebars</div>
            <div className={styles.teamRole}>Templating Engine</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📄</span>
          License
        </div>
        <Text size={300} style={{ color: 'var(--mica-text-secondary)', lineHeight: 1.6 }}>
          CardForge is open-source software licensed under the MIT License. 
          You are free to use, modify, and distribute it. 
          See the full license on GitHub.
        </Text>
      </div>

      <div className={`${styles.section} ${styles.dangerZone}`}>
        <div className={`${styles.sectionTitle} ${styles.dangerTitle}`}>
          <span className={styles.sectionIcon} style={{ background: 'rgba(255, 153, 164, 0.15)', color: 'var(--mica-error)' }}>⚠️</span>
          Danger Zone
        </div>
        
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Reset All Settings</span>
            <span className={styles.settingDescription}>Restore default settings. This cannot be undone.</span>
          </div>
          <div className={styles.settingControl}>
            <Button
              appearance="secondary"
              icon={<ArrowResetRegular />}
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                  resetToDefaults();
                }
              }}
              className={styles.resetButton}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={600} weight="semibold" className={styles.headerTitle}>Settings</Text>
      </div>

      <div className={styles.tabs}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_e, data) => setActiveTab(data.value as TabValue)}
        >
          <Tab value="general">General</Tab>
          <Tab value="editor">Editor</Tab>
          <Tab value="export">Export</Tab>
          <Tab value="about">About</Tab>
        </TabList>
      </div>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'editor' && renderEditorSettings()}
          {activeTab === 'export' && renderExportSettings()}
          {activeTab === 'about' && renderAbout()}
        </div>
      </div>
    </div>
  );
}
