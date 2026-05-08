/**
 * Конвертирует полный путь к ассету в относительный путь assets/filename.ext
 * Работает с Windows путями (C:\Users\...\assets\file.jpg) и Unix (/home/.../assets/file.jpg)
 */
export function assetPathToRelative(fullPath: string): string {
  if (!fullPath) return '';
  
  // Нормализуем слэши: \ → /
  const normalized = fullPath.replace(/\\/g, '/');
  
  // Ищем /assets/ в пути
  const idx = normalized.lastIndexOf('/assets/');
  if (idx !== -1) {
    return normalized.substring(idx + 1); // assets/filename.ext
  }
  
  // Если маркер не найден — берём только имя файла
  const parts = normalized.split('/');
  const filename = parts[parts.length - 1];
  return filename ? `assets/${filename}` : '';
}

/**
 * Проверяет, является ли путь локальным ассетом (не URL)
 */
export function isLocalAsset(path: string): boolean {
  if (!path) return false;
  return !path.startsWith('http://') && 
         !path.startsWith('https://') && 
         !path.startsWith('data:');
}
