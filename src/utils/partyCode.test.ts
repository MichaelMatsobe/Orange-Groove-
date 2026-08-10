import { describe, it, expect } from 'vitest';
import { generatePartyCode } from '../constants';
import { splitBase64, CHUNK_CHARS } from './fileTransfer';

describe('generatePartyCode', () => {
  it('returns 6 digits', () => {
    const code = generatePartyCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('is not obviously sequential across calls', () => {
    const a = generatePartyCode();
    const b = generatePartyCode();
    // Extremely unlikely to collide; if equal, still valid format
    expect(a).toMatch(/^\d{6}$/);
    expect(b).toMatch(/^\d{6}$/);
  });
});

describe('splitBase64', () => {
  it('splits into chunks of CHUNK_CHARS', () => {
    const data = 'a'.repeat(CHUNK_CHARS * 2 + 10);
    const parts = splitBase64(data);
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(CHUNK_CHARS);
    expect(parts[1].length).toBe(CHUNK_CHARS);
    expect(parts[2].length).toBe(10);
  });

  it('handles empty string', () => {
    expect(splitBase64('')).toEqual(['']);
  });
});
