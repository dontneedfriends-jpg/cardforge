import { Text, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    padding: '32px',
    background: 'var(--colorNeutralBackground1)',
  },
});

export function EmptyState({ title, description }: { title: string; description?: string }) {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <Text size={500} weight="semibold">{title}</Text>
      {description && <Text size={300}>{description}</Text>}
    </div>
  );
}
