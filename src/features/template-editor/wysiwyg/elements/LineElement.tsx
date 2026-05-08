export interface LineElementProps {
  color: string;
  lineWidth: number;
}

export function LineElement(props: Partial<LineElementProps>) {
  const { color, lineWidth } = props;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${lineWidth || 2}px`,
          background: color || '#fff',
        }}
      />
    </div>
  );
}
