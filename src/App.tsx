/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Orange Groove — Wi-Fi multi-device group-play.
 * Local files: pull-on-demand + encode cache + current-track priority (LAN bandwidth optimized).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom } from 'trystero';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HostApp } from './components/HostApp';
import { GuestApp } from './components/GuestApp';
import { SplashScreen } from './components/SplashScreen';
import { Toast, ToastType } from './components/Toast';
import { DEFAULT_LIBRARY, INITIAL_REQUESTS, generatePartyCode, TRYSTERO_APP_ID } from './constants';
import {
  SongRequest,
  Song,
  RequestStatus,
  ConnectedDevice,
  FileMetaMessage,
  FileChunkMessage,
  FileNeedMessage,
} from './types';
import {
  encodeFileForTransfer,
  splitBase64,
  decodeToObjectUrl,
  clearEncodeCache,
} from './utils/fileTransfer';
import { startPartyHotspot } from './native/hotspot';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<'host' | 'guest' | null>(null);
  const [partyCode, setPartyCode] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [requests, setRequests] = useState<SongRequest[]>(INITIAL_REQUESTS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [library, setLibrary] = useState<Song[]>(DEFAULT_LIBRARY);
  const [transferProgress, setTransferProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = library[currentSongIndex] ?? library[0] ?? DEFAULT_LIBRARY[0];

  const sendSyncRef = useRef<((data: any, peers?: string[]) => void) | null>(null);
  const sendRequestRef = useRef<((data: any) => void) | null>(null);
  const sendRequestsRef = useRef<((data: any) => void) | null>(null);
  const sendFileMetaRef = useRef<((data: FileMetaMessage, peers?: string[]) => void) | null>(null);
  const sendFileChunkRef = useRef<((data: FileChunkMessage, peers?: string[]) => void) | null>(null);
  const sendFileNeedRef = useRef<((data: FileNeedMessage) => void) | null>(null);
  const roomRef = useRef<any>(null);

  const localFilesRef = useRef<Map<string, File>>(new Map());
  /** songId → peerIds that already received the full file */
  const sentToPeersRef = useRef<Map<string, Set<string>>>(new Map());
  /** In-flight transfers to avoid duplicate concurrent sends of the same song→peer */
  const inFlightRef = useRef<Set<string>>(new Set());
  const incomingChunksRef = useRef<
    Map<string, { meta: FileMetaMessage; parts: string[] }>
  >(new Map());
  /** Guests: songIds already requested */
  const requestedFilesRef = useRef<Set<string>>(new Set());

  const currentSongIndexRef = useRef(currentSongIndex);
  const isLiveRef = useRef(isLive);
  const requestsRef = useRef(requests);
  const libraryRef = useRef(library);

  useEffect(() => {
    currentSongIndexRef.current = currentSongIndex;
    isLiveRef.current = isLive;
    requestsRef.current = requests;
    libraryRef.current = library;
  }, [currentSongIndex, isLive, requests, library]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));

  const handleJoinParty = (role: 'host' | 'guest', code?: string) => {
    if (role === 'host') {
      setPartyCode(generatePartyCode());
      setUserRole('host');
      setRequests([]);
      setIsLive(false);
      setIsPlaying(false);
      setCurrentSongIndex(0);
    } else if (code && code.length >= 6) {
      setPartyCode(code);
      setUserRole('guest');
      setRequests([]);
    }
  };

  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast((p) => ({ ...p, isVisible: false })), []);

  const buildLibraryMeta = useCallback(() => {
    return libraryRef.current.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      coverUrl: s.coverUrl,
      audioUrl: s.isLocal ? '' : s.audioUrl,
      duration: s.duration,
      isLocal: !!s.isLocal,
      streaming: !!s.isLocal,
      mimeType: s.mimeType,
    }));
  }, []);

  const broadcastSync = useCallback(() => {
    if (userRole !== 'host' || !sendSyncRef.current || !audioRef.current) return;
    sendSyncRef.current({
      currentSongIndex: currentSongIndexRef.current,
      isPlaying,
      timestamp: audioRef.current.currentTime,
      timestampAt: Date.now(),
      volume: isMuted ? 0 : volume,
      isLive: isLiveRef.current,
      deviceCount: connectedDevices.length + 1,
      libraryMeta: buildLibraryMeta(),
    });
  }, [userRole, isPlaying, volume, isMuted, connectedDevices.length, buildLibraryMeta]);

  /** Stream one local file only to peers that still need it */
  const streamLocalFile = useCallback(
    async (songId: string, peerId?: string) => {
      if (userRole !== 'host') return;
      const file = localFilesRef.current.get(songId);
      const song = libraryRef.current.find((s) => s.id === songId);
      if (!file || !song || !sendFileMetaRef.current || !sendFileChunkRef.current) return;

      const received = sentToPeersRef.current.get(songId) ?? new Set<string>();
      // Target peers: single peer, or all connected devices not yet served
      const targets: string[] = peerId
        ? received.has(peerId)
          ? []
          : [peerId]
        : connectedDevices.map((d) => d.peerId).filter((id) => !received.has(id));

      if (targets.length === 0 && peerId) return;
      // If no specific peer and nobody connected yet, still encode for cache warm-up later
      const peersArg = peerId ? [peerId] : targets.length ? targets : undefined;
      if (peerId && targets.length === 0) return;

      const flightKey = `${songId}:${peerId ?? 'all'}`;
      if (inFlightRef.current.has(flightKey)) return;
      inFlightRef.current.add(flightKey);

      try {
        const encoded = await encodeFileForTransfer(songId, file, file.type);
        const chunks = splitBase64(encoded.base64);
        const meta: FileMetaMessage = {
          songId,
          title: song.title,
          artist: song.artist,
          coverUrl: song.coverUrl,
          duration: song.duration,
          mimeType: encoded.mimeType,
          size: encoded.encodedSize,
          totalChunks: chunks.length,
          encoding: encoded.encoding,
          originalSize: encoded.originalSize,
        };

        // Send per-peer when we have an explicit list so receipt tracking is accurate
        const peerLists: (string[] | undefined)[] =
          peersArg && peersArg.length ? peersArg.map((p) => [p]) : [undefined];

        for (const plist of peerLists) {
          sendFileMetaRef.current(meta, plist);
          for (let i = 0; i < chunks.length; i++) {
            sendFileChunkRef.current({ songId, index: i, data: chunks[i] }, plist);
            // Yield every few chunks so UI stays responsive; larger stride = less delay on LAN
            if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));
          }
          if (plist) {
            const set = sentToPeersRef.current.get(songId) ?? new Set();
            plist.forEach((p) => set.add(p));
            sentToPeersRef.current.set(songId, set);
          } else {
            // Broadcast: mark all currently known peers
            const set = sentToPeersRef.current.get(songId) ?? new Set();
            connectedDevices.forEach((d) => set.add(d.peerId));
            sentToPeersRef.current.set(songId, set);
          }
        }
      } catch (e) {
        console.error('streamLocalFile', e);
        showToast('Failed to stream a local track', 'warning');
      } finally {
        inFlightRef.current.delete(flightKey);
      }
    },
    [userRole, showToast, connectedDevices]
  );

  /** On join: only push the *current* local track (not the whole library) */
  const streamCurrentLocalToPeer = useCallback(
    async (peerId: string) => {
      const song = libraryRef.current[currentSongIndexRef.current];
      if (song?.isLocal) await streamLocalFile(song.id, peerId);
    },
    [streamLocalFile]
  );

  const handleNext = useCallback(() => {
    const len = Math.max(libraryRef.current.length, 1);
    setCurrentSongIndex((i) => (i + 1) % len);
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

  const handlePrevious = useCallback(() => {
    const len = Math.max(libraryRef.current.length, 1);
    setCurrentSongIndex((i) => (i - 1 + len) % len);
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

  const handleSeek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setProgress(time);
      broadcastSync();
    },
    [broadcastSync]
  );

  // When host switches to a local track, push it to peers that lack it
  useEffect(() => {
    if (userRole !== 'host') return;
    const song = library[currentSongIndex];
    if (song?.isLocal) {
      void streamLocalFile(song.id);
    }
  }, [userRole, currentSongIndex, library, streamLocalFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioUrl) return;
    audio.src = currentSong.audioUrl;
    audio.load();
    setProgress(0);
    if (isPlaying) {
      const t = setTimeout(() => {
        audio.play().catch(() => {});
      }, 60);
      return () => clearTimeout(t);
    }
  }, [currentSongIndex, currentSong?.id, currentSong?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };

  const handleAddLocalFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || userRole !== 'host') return;
      const newSongs: Song[] = [];

      Array.from(files).forEach((file, idx) => {
        if (!file.type.startsWith('audio/')) return;
        const id = `local-${Date.now()}-${idx}`;
        const url = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '') || `Local Track ${idx + 1}`;
        localFilesRef.current.set(id, file);
        newSongs.push({
          id,
          title,
          artist: 'Local File',
          coverUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/300/300`,
          audioUrl: url,
          duration: 180,
          isLocal: true,
          mimeType: file.type,
        });
      });

      if (!newSongs.length) return;

      setLibrary((prev) => [...prev, ...newSongs]);
      showToast(`Added ${newSongs.length} local track(s)`, 'success');

      // Announce library only — transfer happens on play / guest request (saves bandwidth)
      setTimeout(() => broadcastSync(), 80);
    },
    [userRole, showToast, broadcastSync]
  );

  const handleStartHotspot = useCallback(async () => {
    const res = await startPartyHotspot();
    showToast(res.message, res.ok ? 'info' : 'warning');
  }, [showToast]);

  // Trystero room
  useEffect(() => {
    if (!userRole || !partyCode) return;

    const room = joinRoom({ appId: TRYSTERO_APP_ID }, partyCode);
    roomRef.current = room;

    const [sendSync, getSync] = room.makeAction('sync');
    const [sendRequest, getRequest] = room.makeAction('request');
    const [sendRequests, getRequests] = room.makeAction('requests');
    const [sendFileMeta, getFileMeta] = room.makeAction('fileMeta');
    const [sendFileChunk, getFileChunk] = room.makeAction('fileChunk');
    const [sendFileNeed, getFileNeed] = room.makeAction('fileNeed');

    sendSyncRef.current = sendSync;
    sendRequestRef.current = sendRequest;
    sendRequestsRef.current = sendRequests;
    sendFileMetaRef.current = sendFileMeta;
    sendFileChunkRef.current = sendFileChunk;
    sendFileNeedRef.current = sendFileNeed;

    const pushRequests = () => {
      if (userRole === 'host' && sendRequestsRef.current) {
        sendRequestsRef.current(requestsRef.current);
      }
    };

    room.onPeerJoin((peerId: string) => {
      setIsConnected(true);
      setConnectedDevices((prev) => {
        if (prev.some((d) => d.peerId === peerId)) return prev;
        return [...prev, { peerId, joinedAt: Date.now() }];
      });
      if (userRole === 'host') {
        setTimeout(() => {
          broadcastSync();
          pushRequests();
          // Only current local track — not the entire library
          void streamCurrentLocalToPeer(peerId);
        }, 120);
        showToast('Device joined — syncing', 'success');
      }
    });

    room.onPeerLeave((peerId: string) => {
      setConnectedDevices((prev) => prev.filter((d) => d.peerId !== peerId));
      // Allow re-send if they rejoin
      sentToPeersRef.current.forEach((set) => set.delete(peerId));
      if (userRole === 'host') showToast('Device left', 'info');
    });

    if (userRole === 'host') {
      getRequest((req: any) => {
        if (!req?.title) return;
        setRequests((prev) => {
          const updated = [req as SongRequest, ...prev];
          setTimeout(() => {
            if (sendRequestsRef.current) sendRequestsRef.current(updated);
          }, 20);
          return updated;
        });
        showToast(`Request: ${(req as SongRequest).title}`, 'info');
      });

      // Pull model: guest asks for a specific file
      getFileNeed((need: FileNeedMessage, peerId: string) => {
        if (!need?.songId) return;
        void streamLocalFile(need.songId, peerId);
      });
    }

    if (userRole === 'guest') {
      getRequests((newList: any) => {
        if (Array.isArray(newList)) setRequests(newList as SongRequest[]);
      });

      getFileMeta((meta: FileMetaMessage) => {
        if (!meta?.songId) return;
        // Ignore if we already have the blob
        const existing = libraryRef.current.find((s) => s.id === meta.songId);
        if (existing?.audioUrl?.startsWith('blob:')) return;

        incomingChunksRef.current.set(meta.songId, {
          meta,
          parts: new Array(meta.totalChunks).fill(''),
        });
        setLibrary((prev) => {
          if (prev.some((s) => s.id === meta.songId)) {
            return prev.map((s) =>
              s.id === meta.songId
                ? { ...s, streaming: true, title: meta.title, artist: meta.artist }
                : s
            );
          }
          return [
            ...prev,
            {
              id: meta.songId,
              title: meta.title,
              artist: meta.artist,
              coverUrl: meta.coverUrl,
              audioUrl: '',
              duration: meta.duration,
              isLocal: true,
              streaming: true,
              mimeType: meta.mimeType,
            },
          ];
        });
        setTransferProgress((p) => ({ ...p, [meta.songId]: 0 }));
      });

      getFileChunk(async (chunk: FileChunkMessage) => {
        const entry = incomingChunksRef.current.get(chunk.songId);
        if (!entry) return;
        entry.parts[chunk.index] = chunk.data;
        const received = entry.parts.filter((p) => p !== '').length;
        const pct = Math.round((received / entry.meta.totalChunks) * 100);
        setTransferProgress((p) => ({ ...p, [chunk.songId]: pct }));

        if (received >= entry.meta.totalChunks) {
          const full = entry.parts.join('');
          const encoding = entry.meta.encoding ?? 'raw-b64';
          const url = await decodeToObjectUrl(full, entry.meta.mimeType, encoding);
          incomingChunksRef.current.delete(chunk.songId);
          setLibrary((prev) =>
            prev.map((s) =>
              s.id === chunk.songId
                ? {
                    ...s,
                    audioUrl: url,
                    streaming: false,
                    isLocal: true,
                    mimeType: entry.meta.mimeType,
                  }
                : s
            )
          );
          setTransferProgress((p) => {
            const next = { ...p };
            delete next[chunk.songId];
            return next;
          });
          showToast(`Received: ${entry.meta.title}`, 'success');
        }
      });

      getSync((state: any) => {
        if (!state) return;
        setIsConnected(true);

        if (Array.isArray(state.libraryMeta) && state.libraryMeta.length > 0) {
          setLibrary((prev) => {
            const byId = new Map(prev.map((s) => [s.id, s]));
            const merged: Song[] = state.libraryMeta.map((m: any) => {
              const existing = byId.get(m.id);
              if (m.isLocal) {
                if (existing?.audioUrl?.startsWith('blob:')) return existing;
                return {
                  id: m.id,
                  title: m.title,
                  artist: m.artist,
                  coverUrl: m.coverUrl,
                  audioUrl: existing?.audioUrl || '',
                  duration: m.duration,
                  isLocal: true,
                  streaming: !existing?.audioUrl,
                  mimeType: m.mimeType,
                };
              }
              return {
                id: m.id,
                title: m.title,
                artist: m.artist,
                coverUrl: m.coverUrl,
                audioUrl: m.audioUrl,
                duration: m.duration,
                isLocal: false,
              };
            });
            prev.forEach((s) => {
              if (s.isLocal && s.audioUrl && !merged.some((m) => m.id === s.id)) merged.push(s);
            });
            return merged;
          });

          // Pull current track if local and missing
          const idx =
            typeof state.currentSongIndex === 'number' ? state.currentSongIndex : 0;
          const cur = state.libraryMeta[idx];
          if (cur?.isLocal && sendFileNeedRef.current) {
            const have = libraryRef.current.find((s) => s.id === cur.id);
            if (!have?.audioUrl?.startsWith('blob:') && !requestedFilesRef.current.has(cur.id)) {
              requestedFilesRef.current.add(cur.id);
              sendFileNeedRef.current({ songId: cur.id });
            }
          }
        }

        if (state.isLive !== isLiveRef.current) setIsLive(!!state.isLive);
        if (!state.isLive) {
          setIsPlaying(false);
          return;
        }

        const nextIndex = typeof state.currentSongIndex === 'number' ? state.currentSongIndex : 0;
        if (nextIndex !== currentSongIndexRef.current) {
          setCurrentSongIndex(nextIndex);
          setProgress(0);
        }

        setIsPlaying(!!state.isPlaying);
        if (state.volume === 0) setIsMuted(true);

        const audio = audioRef.current;
        if (audio && nextIndex === currentSongIndexRef.current && typeof state.timestamp === 'number') {
          const delay = (Date.now() - (state.timestampAt || Date.now())) / 1000;
          const expected = state.timestamp + delay;
          if (Math.abs(audio.currentTime - expected) > 0.4 && audio.readyState >= 2) {
            audio.currentTime = Math.max(0, expected);
          }
        }
      });
    }

    return () => {
      try {
        room.leave();
      } catch {
        /* ignore */
      }
      roomRef.current = null;
      sendSyncRef.current = null;
      sendRequestRef.current = null;
      sendRequestsRef.current = null;
      sendFileMetaRef.current = null;
      sendFileChunkRef.current = null;
      sendFileNeedRef.current = null;
      setIsConnected(false);
      setConnectedDevices([]);
    };
  }, [userRole, partyCode, broadcastSync, showToast, streamCurrentLocalToPeer, streamLocalFile]);

  // Guest: if current song is local and still missing, request it
  useEffect(() => {
    if (userRole !== 'guest' || !currentSong?.isLocal) return;
    if (currentSong.audioUrl?.startsWith('blob:')) return;
    if (requestedFilesRef.current.has(currentSong.id)) return;
    if (!sendFileNeedRef.current) return;
    requestedFilesRef.current.add(currentSong.id);
    sendFileNeedRef.current({ songId: currentSong.id });
  }, [userRole, currentSong?.id, currentSong?.isLocal, currentSong?.audioUrl]);

  useEffect(() => {
    if (userRole !== 'host') return;
    const id = setInterval(broadcastSync, 700);
    return () => clearInterval(id);
  }, [broadcastSync, userRole]);

  useEffect(() => {
    if (userRole === 'host' && sendRequestsRef.current) {
      sendRequestsRef.current(requests);
    }
  }, [requests, userRole]);

  const handleAddRequest = (song: Song) => {
    if (song.streaming) {
      showToast('Track still downloading from host…', 'warning');
      return;
    }
    const isHost = userRole === 'host';
    const newReq: SongRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: song.title,
      artist: song.artist,
      requester: isHost ? 'Host (DJ)' : 'Guest',
      coverUrl: song.coverUrl,
      status: isHost ? 'approved' : 'pending',
      timestamp: Date.now(),
      songId: song.id,
    };
    setRequests((prev) => [newReq, ...prev]);
    if (!isHost && sendRequestRef.current) sendRequestRef.current(newReq);
    showToast(isHost ? 'Added to queue' : 'Request sent to host', 'success');
  };

  const handleApprove = (id: string) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
  const handleReject = (id: string) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
  const handleClearRequests = (status: RequestStatus) => {
    if (!confirm(`Clear all ${status} requests?`)) return;
    setRequests((prev) =>
      prev.map((r) => (r.status === status ? { ...r, status: 'rejected' as RequestStatus } : r))
    );
  };

  const handlePlayRequest = (req: SongRequest) => {
    const idx = library.findIndex(
      (s) => s.id === req.songId || (s.title === req.title && s.artist === req.artist)
    );
    if (idx >= 0) {
      setCurrentSongIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      setIsLive(true);
      setTimeout(broadcastSync, 40);
      showToast(`Now playing: ${req.title}`, 'success');
    } else showToast('Track not in library', 'warning');
  };

  const handleGoLive = () => {
    setIsLive(true);
    setIsPlaying(true);
    showToast('Party LIVE — devices syncing over Wi‑Fi', 'success');
    setTimeout(broadcastSync, 60);
  };

  const handleEndParty = () => {
    setIsLive(false);
    setIsPlaying(false);
    showToast('Party ended', 'info');
    broadcastSync();
  };

  const handleExit = () => {
    setUserRole(null);
    setIsLive(false);
    setIsPlaying(false);
    setConnectedDevices([]);
    setPartyCode('');
    setRequests([]);
    setTransferProgress({});
    library.forEach((s) => {
      if (s.audioUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(s.audioUrl);
        } catch {
          /* ignore */
        }
      }
    });
    localFilesRef.current.clear();
    sentToPeersRef.current.clear();
    inFlightRef.current.clear();
    incomingChunksRef.current.clear();
    requestedFilesRef.current.clear();
    clearEncodeCache();
    setLibrary(DEFAULT_LIBRARY);
    setCurrentSongIndex(0);
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-md mx-auto w-full bg-slate-50 dark:bg-slate-950 shadow-2xl min-h-screen relative overflow-hidden transition-colors duration-300">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleNext} crossOrigin="anonymous" preload="auto" />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50">
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && !userRole && (
        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <WelcomeScreen onJoin={handleJoinParty} />
        </motion.div>
      )}

      {!showSplash && userRole === 'host' && currentSong && (
        <motion.div key="host" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
          <HostApp
            requests={requests}
            onApprove={handleApprove}
            onReject={handleReject}
            onClearAll={handleClearRequests}
            onAddRequest={handleAddRequest}
            onPlayRequest={handlePlayRequest}
            onGoLive={handleGoLive}
            onEndParty={handleEndParty}
            isLive={isLive}
            onBack={handleExit}
            theme={theme}
            toggleTheme={toggleTheme}
            partyCode={partyCode}
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSeek={handleSeek}
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={() => setIsMuted((p) => !p)}
            connectedDevices={connectedDevices}
            isConnected={isConnected}
            library={library}
            onAddLocalFiles={handleAddLocalFiles}
            onCopyCode={() => showToast('Party code copied', 'success')}
            onStartHotspot={handleStartHotspot}
          />
        </motion.div>
      )}

      {!showSplash && userRole === 'guest' && currentSong && (
        <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
          <GuestApp
            requests={requests}
            onAddRequest={handleAddRequest}
            onBack={handleExit}
            theme={theme}
            toggleTheme={toggleTheme}
            partyCode={partyCode}
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={() => setIsMuted((p) => !p)}
            isLive={isLive}
            isConnected={isConnected}
            library={library}
            transferProgress={transferProgress}
          />
        </motion.div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
}
