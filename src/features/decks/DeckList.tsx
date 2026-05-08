import { Text, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '8px',
  },
});

export function DeckList() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Text size={400} weight="semibold">Decks</Text>
    </div>
  );
}
