import { describe, it, expect } from 'vitest';
import { buildRtcConfig } from './rtcConfig';

function urlsOf(server: { urls: string | string[] }): string[] {
  return Array.isArray(server.urls) ? server.urls : [server.urls];
}

function findTurn(config: RTCConfiguration, host: string) {
  return config.iceServers.find((s) => urlsOf(s).some((u) => u.includes(host)));
}

describe('buildRtcConfig', () => {
  it('always includes the free Google STUN servers', () => {
    const config = buildRtcConfig({});
    const urls = config.iceServers.flatMap(urlsOf);
    expect(urls).toContain('stun:stun.l.google.com:19302');
    expect(urls).toContain('stun:stun1.l.google.com:19302');
  });

  it('adds no TURN relay when VITE_TURN_URL is unset', () => {
    const config = buildRtcConfig({});
    expect(config.iceServers).toHaveLength(1); // STUN only
  });

  it('adds a TURN server with url only when credentials are absent', () => {
    const config = buildRtcConfig({ VITE_TURN_URL: 'turn:global.metered.ca:3478' });
    const turn = findTurn(config, 'metered');
    expect(turn).toBeDefined();
    expect(turn!.username).toBeUndefined();
    expect(turn!.credential).toBeUndefined();
  });

  it('adds username and credential only when both are provided', () => {
    const config = buildRtcConfig({
      VITE_TURN_URL: 'turn:global.metered.ca:3478',
      VITE_TURN_USERNAME: 'alice',
      VITE_TURN_CREDENTIAL: 's3cret',
    });
    const turn = findTurn(config, 'metered');
    expect(turn).toBeDefined();
    expect(turn!.username).toBe('alice');
    expect(turn!.credential).toBe('s3cret');
  });

  it('omits credentials when only the username is set', () => {
    const config = buildRtcConfig({
      VITE_TURN_URL: 'turn:example.com:3478',
      VITE_TURN_USERNAME: 'user-only',
    });
    const turn = findTurn(config, 'example.com');
    expect(turn).toBeDefined();
    // Credentials are attached only when BOTH username and credential exist.
    expect(turn!.username).toBeUndefined();
    expect(turn!.credential).toBeUndefined();
  });

  it('omits credentials when only the credential is set', () => {
    const config = buildRtcConfig({
      VITE_TURN_URL: 'turn:example.com:3478',
      VITE_TURN_CREDENTIAL: 'pass-only',
    });
    const turn = findTurn(config, 'example.com');
    expect(turn).toBeDefined();
    expect(turn!.username).toBeUndefined();
    expect(turn!.credential).toBeUndefined();
  });
});
