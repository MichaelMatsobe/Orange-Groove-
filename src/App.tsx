/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Orange Groove — multi-device group-play music party.
 * Host shares a private 6-digit code; guests join and stay synced.
 * Transport: Trystero WebRTC (encrypted peer channels, isolated by appId + code).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom } from 'trystero';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HostApp } from './components/HostApp';
import { GuestApp } from './components/GuestApp';
import { SplashScreen } from './components/SplashScreen';
import { Toast, ToastType } from './components/Toast';
import { DEFAULT_LIBRARY, INITIAL_REQUESTS, generatePartyCode, TRYSTERO_APP_ID } from './constants';
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
  const [library, setLibrary] = useState<Song[]>(DEFAULT_LIBRARY);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = library[currentSongIndex] ?? library[0] ?? DEFAULT_LIBRARY[0];

  const sendSyncRef = useRef<((data: any) => void) | null>(null);
  const sendRequestRef = useRef<((data: any) => void) | null>(null);
  const sendRequestsRef = useRef<((data: any) => void) | null>(null);
  const roomRef = useRef<any>(null);

  // Keep latest values for Trystero callbacks (avoid stale closures)
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

  const toggleTheme = () => setTheme(p => (p === 'dark' ? 'light' : 'dark'));

  const handleJoinParty = (role: 'host' | 'guest', code?: string) => {
    if (role === 'host') {
      setPartyCode(generatePartyCode());
      setUserRole('host');
      setRequests([]);
      setIsLive(false);
      setIsPlaying(false);
      setCurrentSongIndex(0);
    } else if (code && code.length >= 4) {
      setPartyCode(code);
      setUserRole('guest');
      setRequests([]);
    }
  };

  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast(p => ({ ...p, isVisible: false })), []);

  const broadcastSync = useCallback(() => {
    if (userRole !== 'host' || !sendSyncRef.current || !audioRef.current) return;

    const lib = libraryRef.current;
    sendSyncRef.current({
      currentSongIndex: currentSongIndexRef.current,
      isPlaying,
      timestamp: audioRef.current.currentTime,
      timestampAt: Date.now(),
      volume: isMuted ? 0 : volume,
      isLive: isLiveRef.current,
      deviceCount: connectedDevices.length + 1,
      libraryMeta: lib
        .filter(s => !s.isLocal)
        .map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          coverUrl: s.coverUrl,
          audioUrl: s.audioUrl,
          duration: s.duration,
          isLocal: false,
        })),
    });
  }, [userRole, isPlaying, volume, isMuted, connectedDevices.length]);

  const handleNext = useCallback(() => {
    const len = Math.max(libraryRef.current.length, 1);
    setCurrentSongIndex(i => (i + 1) % len);
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

  const handlePrevious = useCallback(() => {
    const len = Math.max(libraryRef.current.length, 1);
    setCurrentSongIndex(i => (i - 1 + len) % len);
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

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

  // Load track when index changes
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
          duration: 180,
          isLocal: true,
        });
      });

      if (newSongs.length) {
        setLibrary(prev => [...prev, ...newSongs]);
        showToast(`Added ${newSongs.length} local track(s)`, 'success');
      }
    },
    [userRole, showToast]
  );

  // ==================== SECURE TRYSTERO ROOM ====================
  useEffect(() => {
    if (!userRole || !partyCode) return;

    // Isolated namespace + party code = private room (only people with the code can join)
    const room = joinRoom({ appId: TRYSTERO_APP_ID }, partyCode);
    roomRef.current = room;

    const [sendSync, getSync] = room.makeAction('sync');
    const [sendRequest, getRequest] = room.makeAction('request');
    const [sendRequests, getRequests] = room.makeAction('requests');

    sendSyncRef.current = sendSync;
    sendRequestRef.current = sendRequest;
    sendRequestsRef.current = sendRequests;

    const pushRequests = () => {
      if (userRole === 'host' && sendRequestsRef.current) {
        sendRequestsRef.current(requestsRef.current);
      }
    };

    room.onPeerJoin((peerId: string) => {
      setIsConnected(true);
      setConnectedDevices(prev => {
        if (prev.some(d => d.peerId === peerId)) return prev;
        return [...prev, { peerId, joinedAt: Date.now() }];
      });

      if (userRole === 'host') {
        // Immediately lock new device onto host state
        setTimeout(() => {
          broadcastSync();
          pushRequests();
        }, 100);
        showToast('Device joined — syncing', 'success');
      }
    });

    room.onPeerLeave((peerId: string) => {
      setConnectedDevices(prev => prev.filter(d => d.peerId !== peerId));
      if (userRole === 'host') showToast('Device left', 'info');
    });

    if (userRole === 'guest') {
      getRequests((newList: any) => {
        if (Array.isArray(newList)) setRequests(newList as SongRequest[]);
      });
    }

    if (userRole === 'host') {
      getRequest((req: any) => {
        if (!req?.title) return;
        setRequests(prev => {
          const updated = [req as SongRequest, ...prev];
          // push after state settles
          setTimeout(() => {
            if (sendRequestsRef.current) sendRequestsRef.current(updated);
          }, 20);
          return updated;
        });
        showToast(`Request: ${(req as SongRequest).title}`, 'info');
      });
    }

    if (userRole === 'guest') {
      getSync((state: any) => {
        if (!state) return;
        setIsConnected(true);

        // Sync remote library from host
        if (Array.isArray(state.libraryMeta) && state.libraryMeta.length > 0) {
          setLibrary(prev => {
            const locals = prev.filter(s => s.isLocal);
            return [...state.libraryMeta, ...locals];
          });
        }

        if (state.isLive !== isLiveRef.current) {
          setIsLive(!!state.isLive);
        }

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

        // Drift correction
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
      setIsConnected(false);
      setConnectedDevices([]);
    };
  }, [userRole, partyCode, broadcastSync, showToast]);

  // Host heartbeat keeps guests locked in
  useEffect(() => {
    if (userRole !== 'host') return;
    const id = setInterval(broadcastSync, 700);
    return () => clearInterval(id);
  }, [broadcastSync, userRole]);

  // Push request list when host changes it
  useEffect(() => {
    if (userRole === 'host' && sendRequestsRef.current) {
      sendRequestsRef.current(requests);
    }
  }, [requests, userRole]);

  const handleAddRequest = (song: Song) => {
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

    setRequests(prev => [newReq, ...prev]);

    if (!isHost && sendRequestRef.current) {
      sendRequestRef.current(newReq);
    }
    showToast(isHost ? 'Added to queue' : 'Request sent to host', 'success');
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
      setTimeout(broadcastSync, 40);
      showToast(`Now playing: ${req.title}`, 'success');
    } else {
      showToast('Track not in library', 'warning');
    }
  };

  const handleGoLive = () => {
    setIsLive(true);
    setIsPlaying(true);
    showToast('Party LIVE — devices syncing', 'success');
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
    library.forEach(s => {
      if (s.isLocal && s.audioUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(s.audioUrl);
        } catch {
          /* ignore */
        }
      }
    });
    setLibrary(DEFAULT_LIBRARY);
    setCurrentSongIndex(0);
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
            onToggleMute={() => setIsMuted(p => !p)}
            connectedDevices={connectedDevices}
            isConnected={isConnected}
            library={library}
            onAddLocalFiles={handleAddLocalFiles}
            onCopyCode={() => showToast('Party code copied', 'success')}
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
