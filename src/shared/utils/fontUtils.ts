import { invoke } from '@tauri-apps/api/core';

let cachedFontCss: string | null = null;
let cachedProjectPath: string | null = null;

export async function getFontFaceCss(projectPath: string): Promise<string> {
  if (cachedFontCss !== null && cachedProjectPath === projectPath) {
    return cachedFontCss;
  }
  try {
    const css = await invoke<string>('get_font_face_css', { projectPath });
    cachedFontCss = css;
    cachedProjectPath = projectPath;
    return css;
  } catch {
    return '';
  }
}

export function clearFontCache(): void {
  cachedFontCss = null;
  cachedProjectPath = null;
}

export async function injectFontCss(css: string, projectPath: string): Promise<string> {
  if (!projectPath) return css;
  const fontCss = await getFontFaceCss(projectPath);
  if (!fontCss) return css;
  return fontCss + '\n' + css;
}

export async function loadFontsIntoDocument(projectPath: string): Promise<void> {
  const fontCss = await getFontFaceCss(projectPath);
  if (!fontCss) return;

  const existing = document.getElementById('cardforge-font-face');
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = 'cardforge-font-face';
  style.textContent = fontCss;
  document.head.appendChild(style);
}

export async function listCustomFonts(projectPath: string): Promise<string[]> {
  if (!projectPath) return [];
  try {
    return await invoke<string[]>('list_fonts', { projectPath });
  } catch {
    return [];
  }
}
