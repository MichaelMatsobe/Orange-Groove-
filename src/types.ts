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
}

export interface FileChunkMessage {
  songId: string;
  index: number;
  data: string; // base64
}
