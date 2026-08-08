/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Orange Groove — multi-device group-play music party.
 * Host = virtual DJ / master player.
 * Guests + extra devices join the same room and stay tightly synced
 * to the host's current track & position (Xiaomi-style group play model).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom } from 'trystero';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HostApp } from './components/HostApp';
import { GuestApp } from './components/GuestApp';
import { SplashScreen } from './components/SplashScreen';
import { Toast, ToastType } from './components/Toast';
import { INITIAL_REQUESTS, MOCK_LIBRARY } from './constants';
import { SongRequest, Song, RequestStatus, ConnectedDevice } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<'host' | 'guest' | null>(null);
  const [partyCode, setPartyCode] = useState<string>('8080');
  const [isLive, setIsLive] = useState(false);
  const [requests, setRequests] = useState<SongRequest[]>(INITIAL_REQUESTS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Master player state (authoritative on host)
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = MOCK_LIBRARY[currentSongIndex];

  // Network refs
  const sendSyncRef = useRef<any>(null);
  const sendRequestRef = useRef<any>(null);
  const sendRequestsRef = useRef<any>(null);
  const roomRef = useRef<any>(null);

  // Refs to avoid stale closures inside Trystero callbacks
  const currentSongIndexRef = useRef(currentSongIndex);
  const isLiveRef = useRef(isLive);

  useEffect(() => {
    currentSongIndexRef.current = currentSongIndex;
    isLiveRef.current = isLive;
  }, [currentSongIndex, isLive]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(p => (p === 'dark' ? 'light' : 'dark'));

  const handleJoinParty = (role: 'host' | 'guest', code?: string) => {
    setUserRole(role);
    if (code) setPartyCode(code);
    else if (role === 'host') setPartyCode('8080');
  };

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast(p => ({ ...p, isVisible: false })), []);

  // ==================== MASTER PLAYER (HOST AUTHORITATIVE) ====================
  const broadcastSync = useCallback(() => {
    if (userRole !== 'host' || !sendSyncRef.current || !audioRef.current) return;

    sendSyncRef.current({
      currentSongIndex,
      isPlaying,
      timestamp: audioRef.current.currentTime,
      timestampAt: Date.now(),
      volume: isMuted ? 0 : volume,
      isLive,
      // Also send a lightweight device count so guests know the party size
      deviceCount: connectedDevices.length + 1, // +1 for host itself
    });
  }, [userRole, currentSongIndex, isPlaying, volume, isMuted, isLive, connectedDevices.length]);

  const handleNext = useCallback(() => {
    setCurrentSongIndex(i => (i + 1) % MOCK_LIBRARY.length);
    setProgress(0);
    setIsPlaying(true);
    setTimeout(() => broadcastSync(), 0);
  }, [broadcastSync]);

  const handlePrevious = useCallback(() => {
    setCurrentSongIndex(i => (i - 1 + MOCK_LIBRARY.length) % MOCK_LIBRARY.length);
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

  // Load new song when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.audioUrl;
    audio.load();
    setProgress(0);

    if (isPlaying) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 60);
    }
  }, [currentSongIndex, currentSong]);

  // Keep local audio element in sync with state
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

  // ==================== TRYSTERO ROOM (MULTI-DEVICE GROUP) ====================
  useEffect(() => {
    if (!userRole || !partyCode) return;

    const room = joinRoom({ appId: 'orange-groove-v3-group' }, partyCode);
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

    // Track devices that join / leave
    room.onPeerJoin((peerId: string) => {
      setIsConnected(true);
      setConnectedDevices(prev => {
        if (prev.some(d => d.peerId === peerId)) return prev;
        return [...prev, { peerId, joinedAt: Date.now() }];
      });

      if (userRole === 'host') {
        // Immediately push current state so the new device locks onto the host
        setTimeout(() => {
          broadcastSync();
          broadcastRequests();
        }, 50);
        showToast('New device joined the party', 'success');
      }
    });

    room.onPeerLeave((peerId: string) => {
      setConnectedDevices(prev => prev.filter(d => d.peerId !== peerId));
      if (userRole === 'host') {
        showToast('A device left', 'info');
      }
    });

    // Guest receives the full request list from host
    if (userRole === 'guest') {
      getRequests((newList: any) => {
        setRequests(newList as SongRequest[]);
      });
    }

    // Host receives song requests from guests
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

    // Guest: lock onto host's playback (group-play style)
    if (userRole === 'guest') {
      getSync((state: any) => {
        setIsConnected(true);

        if (state.isLive !== isLiveRef.current) {
          setIsLive(!!state.isLive);
        }

        // If host is not live, guests stay silent
        if (!state.isLive) {
          setIsPlaying(false);
          return;
        }

        // Track change
        if (state.currentSongIndex !== currentSongIndexRef.current) {
          setCurrentSongIndex(state.currentSongIndex);
          setProgress(0);
        }

        setIsPlaying(!!state.isPlaying);
        // Guests keep their own local volume preference;
        // they only inherit mute/zero from host if host is muted.
        if (state.volume === 0) {
          setIsMuted(true);
        }

        // Drift correction — keep every device within ~300 ms of the host
        const audio = audioRef.current;
        if (audio && state.currentSongIndex === currentSongIndexRef.current) {
          const delay = (Date.now() - state.timestampAt) / 1000;
          const expected = state.timestamp + delay;
          if (Math.abs(audio.currentTime - expected) > 0.3 && audio.readyState >= 2) {
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
  }, [userRole, partyCode]); // intentionally lean deps — room is created once per role/code

  // Host continuously heartbeats the master state so late joiners lock on
  useEffect(() => {
    if (userRole !== 'host') return;
    const id = setInterval(broadcastSync, 700);
    return () => clearInterval(id);
  }, [broadcastSync, userRole]);

  // When host changes the request list, push it to everyone
  useEffect(() => {
    if (userRole === 'host' && sendRequestsRef.current) {
      sendRequestsRef.current(requests);
    }
  }, [requests, userRole]);

  // ==================== REQUEST HANDLERS ====================
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

  // Promote an approved request to now-playing (DJ power)
  const handlePlayRequest = (req: SongRequest) => {
    const idx = MOCK_LIBRARY.findIndex(s => s.title === req.title && s.artist === req.artist);
    if (idx >= 0) {
      setCurrentSongIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      setIsLive(true);
      setTimeout(broadcastSync, 50);
      showToast(`Now playing: ${req.title}`, 'success');
    }
  };

  const handleGoLive = () => {
    setIsLive(true);
    setIsPlaying(true);
    showToast('Party is LIVE — all devices syncing', 'success');
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
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-md mx-auto w-full bg-background-light dark:bg-background-dark shadow-2xl min-h-screen relative overflow-hidden transition-colors duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        crossOrigin="anonymous"
        preload="auto"
      />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-50">
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && !userRole && (
        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
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
          />
        </motion.div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
}
