import React, { useEffect, useState } from 'react';
import * as qrcode from 'qrcode';

export interface QrElementProps {
  data: string;
  qrSize: number;
  color: string;
  bgColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}

export const QrElement = React.memo(function QrElement(props: Partial<QrElementProps>) {
  const { data, qrSize, color, bgColor, errorCorrection } = props;
  const [svg, setSvg] = useState('');

  useEffect(() => {
    if (!data) { setSvg(''); return; }
    let cancelled = false;
    qrcode.toString(data, {
      type: 'svg',
      width: qrSize ?? 100,
      margin: 1,
      color: { dark: color ?? '#000000', light: bgColor ?? '#ffffff' },
      errorCorrectionLevel: errorCorrection ?? 'M',
    }).then((result) => {
      if (!cancelled) setSvg(result);
    }).catch(() => {
      if (!cancelled) setSvg('');
    });
    return () => { cancelled = true; };
  }, [data, qrSize, color, bgColor, errorCorrection]);

  if (!svg) {
    return (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          color: '#888', fontSize: 11,
        }}
      >
        QR: {data || 'empty'}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
