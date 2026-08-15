import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  claimParty,
  getParty,
  heartbeat,
  endParty,
  apiBase,
  __setApiBase,
} from './partyApi';

const PARTY = {
  code: '123456',
  isLive: true,
  currentSongIndex: 2,
  deviceCount: 3,
  hostOnline: true,
  createdAt: 1234,
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  __setApiBase('https://api.example.com');
});

afterEach(() => {
  __setApiBase(null);
  vi.unstubAllGlobals();
});

describe('partyApi', () => {
  it('apiBase strips a trailing slash', () => {
    expect(apiBase()).toBe('https://api.example.com');
  });

  it('claimParty POSTs to the claim endpoint and returns the party', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, PARTY));
    vi.stubGlobal('fetch', fetchMock);

    const res = await claimParty('123456');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/parties/123456/claim',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res).toEqual({ ok: true, data: PARTY });
  });

  it('getParty maps a 404 to ok:false with status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { error: 'Party not found' })));

    const res = await getParty('000000');
    expect(res).toEqual({ ok: false, status: 404 });
  });

  it('heartbeat POSTs the playback state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, PARTY));
    vi.stubGlobal('fetch', fetchMock);

    await heartbeat('123456', { isLive: true, currentSongIndex: 2, deviceCount: 3 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      isLive: true,
      currentSongIndex: 2,
      deviceCount: 3,
    });
  });

  it('endParty DELETEs the party', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await endParty('123456');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/parties/123456',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(res).toEqual({ ok: true, data: { ok: true } });
  });

  it('network failure degrades to ok:false with status null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const res = await getParty('123456');
    expect(res).toEqual({ ok: false, status: null });
  });

  it('returns unreachable when no base URL is configured (offline mode)', async () => {
    __setApiBase(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await getParty('123456');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res).toEqual({ ok: false, status: null });
  });
});
