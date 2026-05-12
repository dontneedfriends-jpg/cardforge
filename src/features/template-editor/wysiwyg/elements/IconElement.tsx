import React from 'react';
import { iconSvgMap } from '../../../../shared/utils/iconPaths';

export interface IconElementProps {
  iconName: string;
  iconSize: number;
  color: string;
}

export const IconElement = React.memo(function IconElement(props: Partial<IconElementProps>) {
  const { iconName, iconSize, color } = props;
  const svg = iconSvgMap[iconName ?? ''];
  const size = iconSize ?? 24;
  const iconHtml = svg
    ? `<svg viewBox="${svg.viewBox}" width="${size}px" height="${size}px" style="display:block">${svg.content}</svg>`
    : (iconName ?? '?');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color ?? '#ffffff',
        lineHeight: 1,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: iconHtml }}
    />
  );
});
