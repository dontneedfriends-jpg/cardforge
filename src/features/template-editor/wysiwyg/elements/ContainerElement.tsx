export interface ContainerElementProps {
  background: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
}

export function ContainerElement(props: Partial<ContainerElementProps>) {
  const { background, borderRadius, borderWidth, borderColor, padding } = props;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: background || 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius ?? 8,
        border: borderWidth ? `${borderWidth}px solid ${borderColor || '#000'}` : undefined,
        padding: `${padding ?? 8}px`,
        boxSizing: 'border-box',
      }}
    />
  );
}
