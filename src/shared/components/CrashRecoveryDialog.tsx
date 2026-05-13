import { Text, makeStyles, Button, Dialog, DialogSurface, DialogTitle, DialogBody } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialogSurface: { maxWidth: '480px' },
  body: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 0 16px' },
  iconRow: { display: 'flex', justifyContent: 'center', fontSize: '48px', margin: '8px 0' },
  description: { fontSize: '14px', lineHeight: 1.5, color: 'var(--mica-text-secondary)' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
});

interface CrashRecoveryDialogProps {
  open: boolean;
  projectPath: string;
  lastActive: string;
  deckName: string;
  onRecover: () => void;
  onDismiss: () => void;
}

export function CrashRecoveryDialog({ open, projectPath, lastActive, deckName, onRecover, onDismiss }: CrashRecoveryDialogProps) {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(_e, data) => { if (!data.open) onDismiss(); }}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle
          action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onDismiss} />}
          style={{ fontSize: '18px', fontWeight: 700 }}
        >
          Crash Recovery
        </DialogTitle>
        <DialogBody className={styles.body}>
          <div className={styles.iconRow}>⚠️</div>
          <Text size={400} weight="semibold" style={{ textAlign: 'center' }}>
            It looks like CardForge didn't shut down properly
          </Text>
          <div className={styles.description}>
            <p>We found an unfinished session for this project:</p>
            <p style={{ marginTop: '8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', wordBreak: 'break-all' }}>
              {projectPath}
            </p>
            {deckName && <p style={{ marginTop: '4px' }}>Last active deck: <strong>{deckName}</strong></p>}
            {lastActive && <p style={{ marginTop: '4px', color: 'var(--mica-text-tertiary)' }}>Last active: {new Date(lastActive).toLocaleString()}</p>}
          </div>
          <div className={styles.actions}>
            <Button appearance="secondary" onClick={onDismiss}>
              Start Fresh
            </Button>
            <Button appearance="primary" onClick={onRecover}>
              Recover Session
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
