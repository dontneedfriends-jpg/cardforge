import { describe, it, expect } from 'vitest';
import { CARD_SIZE_PRESETS, DEFAULT_CARD_SIZE, findPreset } from './cardSizes';

describe('CARD_SIZE_PRESETS', () => {
  it('has 22 presets', () => {
    expect(CARD_SIZE_PRESETS.length).toBe(22);
  });

  it('includes poker as the most common size', () => {
    const poker = CARD_SIZE_PRESETS.find(p => p.id === 'poker');
    expect(poker).toBeDefined();
    expect(poker!.widthMm).toBe(63);
    expect(poker!.heightMm).toBe(88);
    expect(poker!.bleedMm).toBe(3);
    expect(poker!.name).toBe('Poker');
  });

  it('includes all size categories', () => {
    const ids = CARD_SIZE_PRESETS.map(p => p.id);
    expect(ids).toContain('chit_12mm');
    expect(ids).toContain('micro');
    expect(ids).toContain('bridge');
    expect(ids).toContain('tarot');
    expect(ids).toContain('a5');
  });

  it('every preset has required fields', () => {
    for (const p of CARD_SIZE_PRESETS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.widthMm).toBeGreaterThan(0);
      expect(p.heightMm).toBeGreaterThan(0);
      expect(p.bleedMm).toBeGreaterThanOrEqual(0);
    }
  });

  it('poker and japanese have identical dimensions', () => {
    const poker = CARD_SIZE_PRESETS.find(p => p.id === 'poker')!;
    const japanese = CARD_SIZE_PRESETS.find(p => p.id === 'japanese')!;
    expect(poker.widthMm).toBe(japanese.widthMm);
    expect(poker.heightMm).toBe(japanese.heightMm);
  });
});

describe('DEFAULT_CARD_SIZE', () => {
  it('matches poker dimensions', () => {
    expect(DEFAULT_CARD_SIZE.widthMm).toBe(63);
    expect(DEFAULT_CARD_SIZE.heightMm).toBe(88);
    expect(DEFAULT_CARD_SIZE.bleedMm).toBe(3);
  });
});

describe('findPreset', () => {
  it('finds poker by exact dimensions', () => {
    const result = findPreset(63, 88);
    expect(result).toBeDefined();
    expect(result!.id).toBe('poker');
  });

  it('finds bridge by exact dimensions', () => {
    const result = findPreset(57, 89);
    expect(result).toBeDefined();
    expect(result!.id).toBe('bridge');
  });

  it('finds within tolerance of 0.5mm', () => {
    const result = findPreset(63.3, 88.4);
    expect(result).toBeDefined();
    expect(result!.id).toBe('poker');
  });

  it('returns undefined for unknown sizes', () => {
    const result = findPreset(100, 150);
    expect(result).toBeUndefined();
  });

  it('returns undefined when width matches but height does not', () => {
    const result = findPreset(63, 50);
    expect(result).toBeUndefined();
  });

  it('finds chit 12mm square', () => {
    const result = findPreset(12.7, 12.7);
    expect(result).toBeDefined();
    expect(result!.id).toBe('chit_12mm');
  });

  it('finds A5', () => {
    const result = findPreset(148, 210);
    expect(result).toBeDefined();
    expect(result!.id).toBe('a5');
  });
});
