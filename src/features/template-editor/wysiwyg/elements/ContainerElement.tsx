export interface ContainerElementProps {
  background: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  rawHtml: string;
  rawCss: string;
  meta?: {
    sourceHtml?: string;
  };
}

export function ContainerElement(props: Partial<ContainerElementProps>) {
  const { background, borderRadius, borderWidth, borderColor, padding, rawHtml, rawCss, meta } = props;

  const htmlContent = rawHtml || meta?.sourceHtml;

  if (htmlContent) {
    const styleContent = rawCss || '';
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {styleContent && <style>{styleContent}</style>}
        <div
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  }

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
