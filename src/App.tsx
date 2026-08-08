/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Orange Groove — fully working multi-device group-play music party (web app).
 * Host = virtual DJ / master player (can also add local audio files).
 * Guests + extra devices join via party code and stay tightly synced.
 * Uses free/open-source: Trystero (WebRTC), browser File API, free sample tracks.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom } from 'trystero';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HostApp } from './components/HostApp';
import { GuestApp } from './components/GuestApp';
import { SplashScreen } from './components/SplashScreen';
import { Toast, ToastType } from './components/Toast';
import { DEFAULT_LIBRARY, INITIAL_REQUESTS, generatePartyCode } from './constants';
import { SongRequest, Song, RequestStatus, ConnectedDevice } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<'host' | 'guest' | null>(null);
  const [partyCode, setPartyCode] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [requests, setRequests] = useState<SongRequest[]>(INITIAL_REQUESTS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);

  // Dynamic library — starts with free samples, host can add local files
  const [library, setLibrary] = useState<Song[]>(DEFAULT_LIBRARY);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // Master player state (authoritative on host)
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = library[currentSongIndex] ?? library[0];

  // Network refs
  const sendSyncRef = useRef<any>(null);
  const sendRequestRef = useRef<any>(null);
  const sendRequestsRef = useRef<any>(null);
  const sendLibraryRef = useRef<any>(null);
  const roomRef = useRef<any>(null);

  const currentSongIndexRef = useRef(currentSongIndex);
  const isLiveRef = useRef(isLive);
  const libraryRef = useRef(library);

  useEffect(() => {
    currentSongIndexRef.current = currentSongIndex;
    isLiveRef.current = isLive;
    libraryRef.current = library;
  }, [currentSongIndex, isLive, library]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(p => (p === 'dark' ? 'light' : 'dark'));

  const handleJoinParty = (role: 'host' | 'guest', code?: string) => {
    if (role === 'host') {
      const newCode = generatePartyCode();
      setPartyCode(newCode);
      setUserRole('host');
    } else if (code) {
      setPartyCode(code);
      setUserRole('guest');
    }
  };

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast(p => ({ ...p, isVisible: false })), []);

  // ==================== MASTER PLAYER ====================
  const broadcastSync = useCallback(() => {
    if (userRole !== 'host' || !sendSyncRef.current || !audioRef.current) return;

    sendSyncRef.current({
      currentSongIndex,
      isPlaying,
      timestamp: audioRef.current.currentTime,
      timestampAt: Date.now(),
      volume: isMuted ? 0 : volume,
      isLive,
      deviceCount: connectedDevices.length + 1,
      // Send serializable library metadata (URLs) so guests can load the same tracks
      libraryMeta: library.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        coverUrl: s.coverUrl,
        audioUrl: s.audioUrl,
        duration: s.duration,
        isLocal: !!s.isLocal,
      })),
    });
  }, [userRole, currentSongIndex, isPlaying, volume, isMuted, isLive, connectedDevices.length, library]);

  const handleNext = useCallback(() => {
    setCurrentSongIndex(i => (i + 1) % Math.max(library.length, 1));
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync, library.length]);

  const handlePrevious = useCallback(() => {
    setCurrentSongIndex(i => (i - 1 + library.length) % Math.max(library.length, 1));
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync, library.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(p => !p);
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

  // Load song when index or library changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.audioUrl;
    audio.load();
    setProgress(0);

    if (isPlaying) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 80);
    }
  }, [currentSongIndex, currentSong?.id]);

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

  // Host can add local audio files (File API — free, no server needed)
  const handleAddLocalFiles = useCallback(
    (files: FileList | null) => {
      if (!files || userRole !== 'host') return;
      const newSongs: Song[] = [];

      Array.from(files).forEach((file, idx) => {
        if (!file.type.startsWith('audio/')) return;
        const url = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '') || `Local Track ${idx + 1}`;
        newSongs.push({
          id: `local-${Date.now()}-${idx}`,
          title,
          artist: 'Local File',
          coverUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/300/300`,
          audioUrl: url,
          duration: 180, // will be corrected when metadata loads
          isLocal: true,
        });
      });

      if (newSongs.length) {
        setLibrary(prev => [...prev, ...newSongs]);
        showToast(`Added ${newSongs.length} local track(s)`, 'success');
        // Guests cannot play local blob URLs from the host, so we keep them host-only for now.
        // For true multi-device local files we would need to stream or upload them.
      }
    },
    [userRole, showToast]
  );

  // ==================== TRYSTERO (WebRTC P2P — free & open source) ====================
  useEffect(() => {
    if (!userRole || !partyCode) return;

    const room = joinRoom({ appId: 'orange-groove-v4' }, partyCode);
    roomRef.current = room;

    const [sendSync, getSync] = room.makeAction('sync');
    const [sendRequest, getRequest] = room.makeAction('request');
    const [sendRequests, getRequests] = room.makeAction('requests');

    sendSyncRef.current = sendSync;
    sendRequestRef.current = sendRequest;
    sendRequestsRef.current = sendRequests;

    const broadcastRequests = () => {
      if (userRole === 'host' && sendRequestsRef.current) {
        sendRequestsRef.current(requests);
      }
    };

    room.onPeerJoin((peerId: string) => {
      setIsConnected(true);
      setConnectedDevices(prev => {
        if (prev.some(d => d.peerId === peerId)) return prev;
        return [...prev, { peerId, joinedAt: Date.now() }];
      });

      if (userRole === 'host') {
        setTimeout(() => {
          broadcastSync();
          broadcastRequests();
        }, 80);
        showToast('New device joined', 'success');
      }
    });

    room.onPeerLeave((peerId: string) => {
      setConnectedDevices(prev => prev.filter(d => d.peerId !== peerId));
      if (userRole === 'host') showToast('A device left', 'info');
    });

    if (userRole === 'guest') {
      getRequests((newList: any) => setRequests(newList as SongRequest[]));
    }

    if (userRole === 'host') {
      getRequest((req: any) => {
        setRequests(prev => {
          const updated = [req as SongRequest, ...prev];
          setTimeout(broadcastRequests, 10);
          return updated;
        });
        showToast(`Request: ${(req as SongRequest).title}`, 'info');
      });
    }

    if (userRole === 'guest') {
      getSync((state: any) => {
        setIsConnected(true);

        // Sync library metadata from host (remote tracks only)
        if (state.libraryMeta && Array.isArray(state.libraryMeta)) {
          const remoteOnly = state.libraryMeta.filter((s: any) => !s.isLocal);
          if (remoteOnly.length > 0) {
            setLibrary(prev => {
              // Prefer host library for remote tracks
              const localOnes = prev.filter(s => s.isLocal);
              return [...remoteOnly, ...localOnes];
            });
          }
        }

        if (state.isLive !== isLiveRef.current) {
          setIsLive(!!state.isLive);
        }

        if (!state.isLive) {
          setIsPlaying(false);
          return;
        }

        if (state.currentSongIndex !== currentSongIndexRef.current) {
          setCurrentSongIndex(state.currentSongIndex);
          setProgress(0);
        }

        setIsPlaying(!!state.isPlaying);
        if (state.volume === 0) setIsMuted(true);

        const audio = audioRef.current;
        if (audio && state.currentSongIndex === currentSongIndexRef.current) {
          const delay = (Date.now() - state.timestampAt) / 1000;
          const expected = state.timestamp + delay;
          if (Math.abs(audio.currentTime - expected) > 0.35 && audio.readyState >= 2) {
            audio.currentTime = Math.max(0, expected);
          }
        }
      });
    }

    return () => {
      room.leave();
      roomRef.current = null;
      setIsConnected(false);
      setConnectedDevices([]);
    };
  }, [userRole, partyCode]);

  // Host heartbeat
  useEffect(() => {
    if (userRole !== 'host') return;
    const id = setInterval(broadcastSync, 650);
    return () => clearInterval(id);
  }, [broadcastSync, userRole]);

  useEffect(() => {
    if (userRole === 'host' && sendRequestsRef.current) {
      sendRequestsRef.current(requests);
    }
  }, [requests, userRole]);

  // ==================== HANDLERS ====================
  const handleAddRequest = (song: Song) => {
    const isHost = userRole === 'host';
    const newReq: SongRequest = {
      id: Date.now().toString(),
      title: song.title,
      artist: song.artist,
      requester: isHost ? 'Host (DJ)' : 'Guest',
      coverUrl: song.coverUrl,
      status: isHost ? 'approved' : 'pending',
      timestamp: Date.now(),
      songId: song.id,
    };

    setRequests(prev => [newReq, ...prev]);

    if (!isHost && sendRequestRef.current) {
      sendRequestRef.current(newReq);
    }
    showToast(isHost ? 'Added to queue' : 'Request sent to DJ', 'success');
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'approved' } : r)));
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'rejected' } : r)));
  };

  const handleClearRequests = (status: RequestStatus) => {
    if (!confirm(`Clear all ${status} requests?`)) return;
    setRequests(prev => prev.map(r => (r.status === status ? { ...r, status: 'rejected' as RequestStatus } : r)));
  };

  const handlePlayRequest = (req: SongRequest) => {
    const idx = library.findIndex(
      s => s.id === req.songId || (s.title === req.title && s.artist === req.artist)
    );
    if (idx >= 0) {
      setCurrentSongIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      setIsLive(true);
      setTimeout(broadcastSync, 50);
      showToast(`Now playing: ${req.title}`, 'success');
    } else {
      showToast('Track not found in library', 'warning');
    }
  };

  const handleGoLive = () => {
    setIsLive(true);
    setIsPlaying(true);
    showToast('Party LIVE — all devices syncing', 'success');
    setTimeout(broadcastSync, 80);
  };

  const handleEndParty = () => {
    setIsLive(false);
    setIsPlaying(false);
    showToast('Party ended — devices silenced', 'info');
    broadcastSync();
  };

  const handleExit = () => {
    setUserRole(null);
    setIsLive(false);
    setIsPlaying(false);
    setConnectedDevices([]);
    setPartyCode('');
    // Revoke local object URLs to free memory
    library.forEach(s => {
      if (s.isLocal && s.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(s.audioUrl);
      }
    });
    setLibrary(DEFAULT_LIBRARY);
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-md mx-auto w-full bg-slate-50 dark:bg-slate-950 shadow-2xl min-h-screen relative overflow-hidden transition-colors duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        crossOrigin="anonymous"
        preload="auto"
      />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="fixed inset-0 z-50">
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && !userRole && (
        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <WelcomeScreen onJoin={handleJoinParty} />
        </motion.div>
      )}

      {!showSplash && userRole === 'host' && (
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
            onToggleMute={() => setIsMuted(p => !p)}
            connectedDevices={connectedDevices}
            isConnected={isConnected}
            library={library}
            onAddLocalFiles={handleAddLocalFiles}
          />
        </motion.div>
      )}

      {!showSplash && userRole === 'guest' && (
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
            onToggleMute={() => setIsMuted(p => !p)}
            isLive={isLive}
            isConnected={isConnected}
            library={library}
          />
        </motion.div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
}
