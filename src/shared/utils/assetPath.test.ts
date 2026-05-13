import { describe, it, expect } from 'vitest';
import { assetPathToRelative, isLocalAsset } from './assetPath';

describe('assetPathToRelative', () => {
  it('extracts from Unix path', () => {
    expect(assetPathToRelative('/home/user/project/assets/card.png')).toBe('assets/card.png');
  });

  it('extracts from Windows path', () => {
    expect(assetPathToRelative('C:\\Users\\me\\project\\assets\\bg.svg')).toBe('assets/bg.svg');
  });

  it('handles nested folder paths', () => {
    expect(assetPathToRelative('/project/assets/icons/sword.svg')).toBe('assets/icons/sword.svg');
  });

  it('handles nested folder on Windows', () => {
    expect(assetPathToRelative('C:\\project\\assets\\icons\\shield.png')).toBe('assets/icons/shield.png');
  });

  it('returns assets/filename when no /assets/ marker found', () => {
    expect(assetPathToRelative('/some/other/path/file.png')).toBe('assets/file.png');
  });

  it('returns empty string for empty input', () => {
    expect(assetPathToRelative('')).toBe('');
  });

  it('uses the last /assets/ occurrence', () => {
    expect(assetPathToRelative('/fake/assets/folder/assets/real.png')).toBe('assets/real.png');
  });

  it('handles filename without path', () => {
    expect(assetPathToRelative('image.jpg')).toBe('assets/image.jpg');
  });
});

describe('isLocalAsset', () => {
  it('returns true for relative asset paths', () => {
    expect(isLocalAsset('assets/card.png')).toBe(true);
  });

  it('returns true for absolute filesystem paths', () => {
    expect(isLocalAsset('/home/user/assets/card.png')).toBe(true);
    expect(isLocalAsset('C:\\Users\\me\\card.png')).toBe(true);
  });

  it('returns false for http URLs', () => {
    expect(isLocalAsset('http://example.com/card.png')).toBe(false);
  });

  it('returns false for https URLs', () => {
    expect(isLocalAsset('https://example.com/card.png')).toBe(false);
  });

  it('returns false for data URIs', () => {
    expect(isLocalAsset('data:image/png;base64,iVBOR')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLocalAsset('')).toBe(false);
  });
});
