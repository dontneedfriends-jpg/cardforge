import { iconSvgMap } from '../../../../shared/utils/iconPaths';

export interface IconElementProps {
  iconName: string;
  iconSize: number;
  color: string;
}

export function IconElement(props: Partial<IconElementProps>) {
  const { iconName, iconSize, color } = props;
  const svg = iconSvgMap[iconName ?? ''];
  const iconHtml = svg
    ? `<svg viewBox="${svg.viewBox}" width="100%" height="100%" style="display:block">${svg.content}</svg>`
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
        fontSize: iconSize ?? 24,
      }}
      dangerouslySetInnerHTML={{ __html: iconHtml }}
    />
  );
}
