import type { CellValue } from '../../shared/types/project';
import Handlebars from 'handlebars';
import { convertFileSrc } from '@tauri-apps/api/core';

export function renderCardBody(
  html: string,
  css: string,
  row: Record<string, CellValue>,
  projectPath?: string
): { body: string; css: string } {
  try {
    let processedRow = { ...row };
    if (projectPath) {
      for (const [key, value] of Object.entries(processedRow)) {
        if (typeof value === 'string' && value.startsWith('assets/')) {
          const fullPath = projectPath.replace(/\\/g, '/') + '/' + value;
          processedRow[key] = convertFileSrc(fullPath);
        }
      }
    }

    const template = Handlebars.compile(html);
    const body = template(processedRow);
    return { body, css };
  } catch {
    return { body: '<div style="color:red;padding:16px">Template error</div>', css };
  }
}

export function renderCardRow(
  html: string,
  css: string,
  row: Record<string, CellValue>,
  projectPath?: string
): string {
  const { body } = renderCardBody(html, css, row, projectPath);
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
