import type { CellValue } from '../types/project';

const VARIABLE_RE = /\{\{(\w+)\}\}/g;

export function replaceVariables(html: string, row: Record<string, CellValue>): string {
  return html.replace(VARIABLE_RE, (_match, key: string) => {
    const val = row[key];
    if (val === null || val === undefined) return '';
    return String(val);
  });
}

export function cssVariableValue(rawCss: string, row: Record<string, CellValue>): string {
  return rawCss.replace(VARIABLE_RE, (_match, key: string) => {
    const val = row[key];
    if (val === null || val === undefined) return '';
    return String(val);
  });
}

export function applyTemplateData(
  html: string,
  css: string,
  row: Record<string, CellValue> | null | undefined,
): { html: string; css: string } {
  if (!row) return { html, css };
  return {
    html: replaceVariables(html, row),
    css: cssVariableValue(css, row),
  };
}
