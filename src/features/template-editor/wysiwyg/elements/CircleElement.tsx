export interface CircleElementProps {
  background: string;
  borderWidth: number;
  borderColor: string;
}

export function CircleElement(props: Partial<CircleElementProps>) {
  const { background, borderWidth, borderColor } = props;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: background || '#444',
        borderRadius: '50%',
        border: borderWidth ? `${borderWidth}px solid ${borderColor || '#000'}` : undefined,
        boxSizing: 'border-box',
      }}
    />
  );
}
