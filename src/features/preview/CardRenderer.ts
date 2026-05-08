import type { CellValue } from '../../shared/types/project';
import Handlebars from 'handlebars';

export function renderCardBody(
  html: string,
  css: string,
  row: Record<string, CellValue>
): { body: string; css: string } {
  try {
    const template = Handlebars.compile(html);
    const body = template(row);
    return { body, css };
  } catch {
    return { body: '<div style="color:red;padding:16px">Template error</div>', css: '' };
  }
}

export function renderCardRow(
  html: string,
  css: string,
  row: Record<string, CellValue>
): string {
  const { body } = renderCardBody(html, css, row);
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  ${css}
</style>
</head>
<body>${body}</body>
</html>`;
}
