import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, ProgressBar, Button, Text } from '@fluentui/react-components';

export interface ProgressDialogProps {
  open: boolean;
  title: string;
  status: string;
  current?: number;
  total?: number;
  onCancel?: () => void;
}

export function ProgressDialog({ open, title, status, current, total, onCancel }: ProgressDialogProps) {
  const indeterminate = current === undefined || total === undefined;
  const percent = indeterminate ? undefined : Math.round((current / total) * 100);

  return (
    <Dialog open={open}>
      <DialogSurface>
        <DialogTitle>{title}</DialogTitle>
        <DialogBody>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 300 }}>
              <ProgressBar
                value={indeterminate ? undefined : current}
                max={indeterminate ? undefined : total}
                thickness="large"
              />
              {!indeterminate && (
                <Text size={200} style={{ textAlign: 'center' }}>
                  {current} / {total} ({percent}%)
                </Text>
              )}
              <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                {status}
              </Text>
            </div>
          </DialogContent>
        </DialogBody>
        {onCancel && (
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </DialogActions>
        )}
      </DialogSurface>
    </Dialog>
  );
}
