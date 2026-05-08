export interface FieldBadgeProps {
  fieldName: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily?: string;
  textAlign: 'left' | 'center' | 'right';
}

export function FieldBadge(props: Partial<FieldBadgeProps>) {
  const { fieldName, fontSize, fontWeight, color, fontFamily, textAlign } = props;

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
      <span
        style={{
          background: 'rgba(0,120,212,0.3)',
          borderRadius: 3,
          padding: '0 4px',
        }}
      >
        {`{{${fieldName || 'field'}}}`}
      </span>
    </div>
  );
}
