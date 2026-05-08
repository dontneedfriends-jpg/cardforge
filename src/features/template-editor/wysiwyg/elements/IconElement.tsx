export interface IconElementProps {
  iconName: string;
  iconSize: number;
  color: string;
}

const iconMap: Record<string, string> = {
  heart: '♥',
  star: '★',
  shield: '◆',
  sword: '†',
  bolt: '⚡',
  fire: '♠',
  water: '♦',
  leaf: '♣',
  moon: '☽',
  sun: '☀',
  skull: '💀',
  crown: '♛',
  gear: '⚙',
  info: 'ℹ',
  warning: '⚠',
  check: '✓',
  cross: '✗',
  arrow_up: '↑',
  arrow_down: '↓',
  arrow_left: '←',
  arrow_right: '→',
  plus: '+',
  minus: '−',
};

export function IconElement(props: Partial<IconElementProps>) {
  const { iconName, iconSize, color } = props;
  const symbol = iconMap[iconName ?? ''] || (iconName ?? '?');
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: iconSize ?? 24,
        color: color ?? '#ffffff',
        lineHeight: 1,
        boxSizing: 'border-box',
      }}
    >
      {symbol}
    </div>
  );
}
