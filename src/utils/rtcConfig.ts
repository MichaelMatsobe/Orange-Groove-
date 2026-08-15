/**
 * WebRTC ICE configuration for Trystero rooms.
 *
 * Free Google STUN servers are always included so peers behind typical NAT can
 * connect directly. A TURN relay can be added via VITE_TURN_URL /
 * VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL to punch through strict/symmetric
 * NAT (e.g. guests on cellular data while the host is on Wi‑Fi, or two
 * different networks entirely). Without TURN, same-LAN/hotspot parties work;
 * with it, "party from anywhere" works.
 */
export function buildRtcConfig(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    const server: RTCIceServer = { urls: turnUrl };
    const username = import.meta.env.VITE_TURN_USERNAME;
    const credential = import.meta.env.VITE_TURN_CREDENTIAL;
    if (username && credential) {
      server.username = username;
      server.credential = credential;
    }
    iceServers.push(server);
  }

  return { iceServers };
}
