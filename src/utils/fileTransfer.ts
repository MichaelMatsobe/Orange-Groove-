/**
 * Efficient chunked transfer of local audio over Trystero (JSON data channels).
 *
 * Bandwidth strategy:
 * 1. Prefer pull-on-demand (guest requests) over push-all
 * 2. Gzip payload when it shrinks (WAV/AIFF); skip when MP3/AAC already compressed
 * 3. Cache encoded payload per song so multi-peer sends don't re-read the File
 * 4. Larger chunks → fewer messages / less framing overhead
 * 5. Host tracks which peers already received each songId
 */

/** ~64KB binary per chunk → ~86KB base64; good balance for WebRTC data channels */
export const CHUNK_CHARS = 86_000;

export type TransferEncoding = 'raw-b64' | 'gzip-b64';

export interface EncodedPayload {
  encoding: TransferEncoding;
  base64: string;
  originalSize: number;
  encodedSize: number;
  mimeType: string;
}

const encodeCache = new Map<string, EncodedPayload>();

export function clearEncodeCache(songId?: string) {
  if (songId) encodeCache.delete(songId);
  else encodeCache.clear();
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunk to avoid call-stack / argument limits on large files
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function maybeGzip(bytes: Uint8Array): Promise<{ bytes: Uint8Array; encoding: TransferEncoding }> {
  // Already-compressed audio rarely benefits from gzip — skip the CPU cost
  // when input looks like MP3/AAC/OGG/Opus (magic or typical mime handled by caller)
  if (typeof CompressionStream === 'undefined') {
    return { bytes, encoding: 'raw-b64' };
  }
  try {
    const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    // Only use gzip if it actually saves ≥8%
    if (compressed.length < bytes.length * 0.92) {
      return { bytes: compressed, encoding: 'gzip-b64' };
    }
  } catch {
    /* fall through */
  }
  return { bytes, encoding: 'raw-b64' };
}

function isLikelyCompressedAudio(mimeType: string, fileName?: string): boolean {
  const m = (mimeType || '').toLowerCase();
  const n = (fileName || '').toLowerCase();
  return (
    m.includes('mpeg') ||
    m.includes('mp3') ||
    m.includes('mp4') ||
    m.includes('aac') ||
    m.includes('ogg') ||
    m.includes('opus') ||
    m.includes('webm') ||
    /\.(mp3|m4a|aac|ogg|opus|webm)$/.test(n)
  );
}

/** Encode once per songId; reuse for every peer */
export async function encodeFileForTransfer(
  songId: string,
  file: Blob,
  mimeType?: string
): Promise<EncodedPayload> {
  const cached = encodeCache.get(songId);
  if (cached) return cached;

  const raw = new Uint8Array(await blobToArrayBuffer(file));
  const mime = mimeType || file.type || 'audio/mpeg';
  const name = file instanceof File ? file.name : undefined;

  let payloadBytes = raw;
  let encoding: TransferEncoding = 'raw-b64';

  if (!isLikelyCompressedAudio(mime, name)) {
    const gz = await maybeGzip(raw);
    payloadBytes = gz.bytes;
    encoding = gz.encoding;
  }

  const base64 = bytesToBase64(payloadBytes);
  const encoded: EncodedPayload = {
    encoding,
    base64,
    originalSize: raw.length,
    encodedSize: payloadBytes.length,
    mimeType: mime,
  };
  encodeCache.set(songId, encoded);
  return encoded;
}

export function splitBase64(base64: string, size = CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += size) {
    chunks.push(base64.slice(i, i + size));
  }
  return chunks.length ? chunks : [''];
}

export async function decodeToObjectUrl(
  base64: string,
  mimeType: string,
  encoding: TransferEncoding = 'raw-b64'
): Promise<string> {
  let bytes = base64ToBytes(base64);

  if (encoding === 'gzip-b64' && typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new Blob([bytes.buffer as ArrayBuffer])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      /* use raw bytes */
    }
  }

  const blob = new Blob([bytes], { type: mimeType || 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

/**
 * Decide which peers still need a song's bytes before a transfer.
 *
 * - Explicit peer: only that peer, unless it already received the song.
 * - Broadcast (no peer): only peers that haven't received it yet.
 *
 * Returns an empty array when there is nobody left to send to — the caller
 * should skip the transfer entirely (broadcasting to everyone again would
 * re-download a multi-MB track on guests that already have it).
 */
export function selectTransferTargets(
  peerId: string | undefined,
  received: Set<string>,
  connectedPeerIds: string[]
): string[] {
  if (peerId) return received.has(peerId) ? [] : [peerId];
  return connectedPeerIds.filter((id) => !received.has(id));
}

/** Back-compat helpers */
export async function fileToBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await blobToArrayBuffer(file));
  return bytesToBase64(bytes);
}

export function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = base64ToBytes(base64);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType || 'audio/mpeg' }));
}
