import { describe, it, expect } from 'vitest';
import { selectTransferTargets } from './fileTransfer';

const PEERS = ['peer-a', 'peer-b', 'peer-c'];

describe('selectTransferTargets', () => {
  it('targets a single peer when sending explicitly and it has not received the song', () => {
    const received = new Set<string>(['peer-b']);
    expect(selectTransferTargets('peer-a', received, PEERS)).toEqual(['peer-a']);
  });

  it('returns [] when the explicit peer already received the song', () => {
    const received = new Set<string>(['peer-a']);
    expect(selectTransferTargets('peer-a', received, PEERS)).toEqual([]);
  });

  it('broadcast targets only peers that have not received the song', () => {
    const received = new Set<string>(['peer-b']);
    expect(selectTransferTargets(undefined, received, PEERS)).toEqual(['peer-a', 'peer-c']);
  });

  it('broadcast returns [] when every peer already has the song (no re-broadcast)', () => {
    const received = new Set<string>(PEERS);
    expect(selectTransferTargets(undefined, received, PEERS)).toEqual([]);
  });

  it('broadcast returns [] when no peers are connected', () => {
    expect(selectTransferTargets(undefined, new Set<string>(), [])).toEqual([]);
  });

  it('explicit send still works when nothing else is connected', () => {
    expect(selectTransferTargets('peer-a', new Set<string>(), [])).toEqual(['peer-a']);
  });
});
