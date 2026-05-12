import React from 'react';

export interface TextElementProps {
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily?: string;
  textAlign: 'left' | 'center' | 'right';
  textStroke: number;
  textStrokeColor: string;
  textShadow: string;
}

export const TextElement = React.memo(function TextElement(props: Partial<TextElementProps>) {
  const { text, fontSize, fontWeight, color, fontFamily, textAlign, textStroke, textStrokeColor, textShadow } = props;

  const textStyle: React.CSSProperties = {};
  if (textStroke) {
    textStyle.WebkitTextStroke = `${textStroke}px ${textStrokeColor || '#000'}`;
  }
  if (textShadow) {
    textStyle.textShadow = textShadow;
  }

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
        ...textStyle,
      }}
    >
      {text || 'Text'}
    </div>
  );
});
