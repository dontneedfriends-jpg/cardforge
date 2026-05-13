import React from 'react';
import { useDeckStore, useEditorStore } from '../../../../store';
import { replaceVariables, cssVariableValue } from '../../../../shared/utils/renderTemplate';

export interface ContainerElementProps {
  background: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  rawHtml: string;
  rawCss: string;
  layout: 'free' | 'grid' | 'stack';
  columns: number;
  rows: number;
  gap: number;
  direction: 'column' | 'row';
  alignItems: string;
  justifyContent: string;
  meta?: {
    sourceHtml?: string;
  };
}

export const ContainerElement = React.memo(function ContainerElement(props: Partial<ContainerElementProps>) {
  const { background, borderRadius, borderWidth, borderColor, padding, rawHtml, rawCss, meta,
    layout, columns, rows, gap, direction, alignItems, justifyContent } = props;

  const deckData = useDeckStore((s) => s.deckData);
  const previewCardIndex = useEditorStore((s) => s.previewCardIndex);
  const previewRow = deckData?.rows?.[previewCardIndex] ?? deckData?.rows?.[0] ?? {};

  const resolvedHtml = rawHtml ? replaceVariables(rawHtml, previewRow) : '';
  const resolvedCss = rawCss ? cssVariableValue(rawCss, previewRow) : '';

  const htmlContent = resolvedHtml || meta?.sourceHtml;

  if (htmlContent) {
    const styleContent = resolvedCss || '';
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

  const layoutStyle: React.CSSProperties = {};
  if (layout === 'grid') {
    layoutStyle.display = 'grid';
    layoutStyle.gridTemplateColumns = columns ? `repeat(${columns}, 1fr)` : undefined;
    layoutStyle.gridTemplateRows = rows ? `repeat(${rows}, 1fr)` : undefined;
    layoutStyle.gap = gap != null ? `${gap}px` : undefined;
  } else if (layout === 'stack') {
    layoutStyle.display = 'flex';
    layoutStyle.flexDirection = direction ?? 'column';
    layoutStyle.gap = gap != null ? `${gap}px` : undefined;
    layoutStyle.alignItems = alignItems ?? undefined;
    layoutStyle.justifyContent = justifyContent ?? undefined;
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
        ...layoutStyle,
      }}
    />
  );
});
