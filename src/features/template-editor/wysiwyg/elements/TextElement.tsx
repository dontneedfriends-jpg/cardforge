export interface TextElementProps {
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily?: string;
  textAlign: 'left' | 'center' | 'right';
}

export function TextElement(props: Partial<TextElementProps>) {
  const { text, fontSize, fontWeight, color, fontFamily, textAlign } = props;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize: fontSize ?? 14,
        fontWeight: fontWeight ?? 'normal',
        color: color ?? '#ffffff',
        fontFamily: fontFamily ?? undefined,
        textAlign: textAlign ?? 'left',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        padding: '2px 4px',
        boxSizing: 'border-box',
      }}
    >
      {text || 'Text'}
    </div>
  );
}
