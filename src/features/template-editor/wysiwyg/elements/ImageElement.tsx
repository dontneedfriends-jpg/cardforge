export interface ImageElementProps {
  src: string;
  fieldName: string;
  isField: boolean;
}

export function ImageElement(props: Partial<ImageElementProps>) {
  const { src, fieldName, isField } = props;
  const imgSrc = isField ? `{{${fieldName}}}` : (src || '');
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {imgSrc ? (
        <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)',
          color: '#888', fontSize: 12
        }}>
          Image
        </div>
      )}
    </div>
  );
}
