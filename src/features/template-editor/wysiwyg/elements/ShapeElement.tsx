export interface ShapeElementProps {
  background: string;
  fill: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

export function ShapeElement(props: Partial<ShapeElementProps>) {
  const { background, fill, borderRadius, borderWidth, borderColor } = props;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: background || fill || '#444',
        borderRadius: borderRadius ?? 0,
        border: borderWidth ? `${borderWidth}px solid ${borderColor || '#000'}` : undefined,
        boxSizing: 'border-box',
      }}
    />
  );
}
