export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  isLocal?: boolean;
  /** Guest is still receiving bytes from host */
  streaming?: boolean;
  mimeType?: string;
}

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  requester: string;
  coverUrl: string;
  status: RequestStatus;
  timestamp: number;
  songId?: string;
}

export interface ConnectedDevice {
  peerId: string;
  joinedAt: number;
  label?: string;
}

/** Host → guest local file transfer (chunked over Trystero) */
export interface FileMetaMessage {
  songId: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  mimeType: string;
  size: number;
  totalChunks: number;
  /** raw-b64 (default) or gzip-b64 when compression helped */
  encoding?: 'raw-b64' | 'gzip-b64';
  originalSize?: number;
}

export interface FileChunkMessage {
  songId: string;
  index: number;
  data: string; // base64 of (optionally gzipped) bytes
}

/** Guest asks host for a missing local track */
export interface FileNeedMessage {
  songId: string;
}
