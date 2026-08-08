/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom } from 'trystero';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HostApp } from './components/HostApp';
import { GuestApp } from './components/GuestApp';
import { SplashScreen } from './components/SplashScreen';
import { Toast, ToastType } from './components/Toast';
import { INITIAL_REQUESTS, MOCK_LIBRARY } from './constants';
import { SongRequest, Song, RequestStatus } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<'host' | 'guest' | null>(null);
  const [partyCode, setPartyCode] = useState<string>('8080');
  const [isLive, setIsLive] = useState(false);
  const [requests, setRequests] = useState<SongRequest[]>(INITIAL_REQUESTS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Player
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = MOCK_LIBRARY[currentSongIndex];

  // Network
  const sendSyncRef = useRef<any>(null);
  const sendRequestRef = useRef<any>(null);
  const sendRequestsRef = useRef<any>(null);

  // Refs for Trystero callbacks to avoid stale closures
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

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  // Join
  const handleJoinParty = (role: 'host' | 'guest', code?: string) => {
    setUserRole(role);
    if (code) setPartyCode(code);
    else if (role === 'host') setPartyCode('8080');
  };

  // Toast (defined early so it can be used in effects safely)
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);
  const hideToast = useCallback(() => setToast(p => ({ ...p, isVisible: false })), []);

  // ==================== PLAYER LOGIC ====================
  const broadcastSync = useCallback(() => {
    if (userRole !== 'host' || !sendSyncRef.current || !audioRef.current) return;
    
    sendSyncRef.current({
      currentSongIndex,
      isPlaying,
      timestamp: audioRef.current.currentTime,
      timestampAt: Date.now(),
      volume: isMuted ? 0 : volume,
      isLive
    });
  }, [userRole, currentSongIndex, isPlaying, volume, isMuted, isLive]);

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

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setProgress(time);
    broadcastSync();
  }, [broadcastSync]);

  // Load new song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.audioUrl;
    audio.load();
    setProgress(0);

    if (isPlaying) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 50);
    }
  }, [currentSongIndex, currentSong, isPlaying]);

  // Play/pause + volume
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

  // ==================== Trystero ====================
  useEffect(() => {
    if (!userRole || !partyCode) return;

    const room = joinRoom({ appId: 'orange-groove-v2-live' }, partyCode);

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

    room.onPeerJoin(() => {
      setIsConnected(true);
      if (userRole === 'host') {
        broadcastSync();
        broadcastRequests();
        showToast('New guest joined!', 'success');
      }
    });

    if (userRole === 'guest') {
      getRequests((newList: any) => {
        setRequests(newList as SongRequest[]);
      });
    }

    if (userRole === 'host') {
      getRequest((req: any) => {
        setRequests(prev => {
          const updated = [req as SongRequest, ...prev];
          setTimeout(broadcastRequests, 10);
          return updated;
        });
        showToast(`New request: ${(req as SongRequest).title}`, 'info');
      });
    }

    if (userRole === 'guest') {
      getSync((state: any) => {
        setIsConnected(true);
        
        if (state.isLive !== isLiveRef.current) {
            setIsLive(state.isLive);
        }

        if (!state.isLive) {
            setIsPlaying(false);
            return;
        }

        if (state.currentSongIndex !== currentSongIndexRef.current) {
          setCurrentSongIndex(state.currentSongIndex);
          setProgress(0);
        }

        setIsPlaying(state.isPlaying);
        setVolume(state.volume ?? 1);
        setIsMuted(state.volume === 0);

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
      setIsConnected(false);
    };
  }, [userRole, partyCode, broadcastSync, showToast, requests]);

  // Host heartbeat
  useEffect(() => {
    if (userRole !== 'host') return;
    const id = setInterval(broadcastSync, 800);
    return () => clearInterval(id);
  }, [broadcastSync, userRole]);

  // Broadcast requests whenever host changes them
  useEffect(() => {
    if (userRole === 'host' && sendRequestsRef.current) {
      sendRequestsRef.current(requests);
    }
  }, [requests, userRole]);

  // Request handlers
  const handleAddRequest = (song: Song) => {
    const isHost = userRole === 'host';
    const newReq: SongRequest = {
      id: Date.now().toString(),
      title: song.title,
      artist: song.artist,
      requester: isHost ? 'Host' : 'Guest',
      coverUrl: song.coverUrl,
      status: isHost ? 'approved' : 'pending',
      timestamp: Date.now()
    };

    setRequests(prev => [newReq, ...prev]);

    if (!isHost && sendRequestRef.current) {
      sendRequestRef.current(newReq);
    }
    showToast(isHost ? 'Added to queue' : 'Request sent!', 'success');
  };

  const handleApprove = async (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = async (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const handleClearRequests = (status: RequestStatus) => {
    if (!confirm(`Clear all ${status}?`)) return;
    setRequests(prev => prev.map(r => r.status === status ? { ...r, status: 'rejected' } : r));
  };

  const handleGoLive = () => {
    setIsLive(true);
    setIsPlaying(true);
    showToast('Party LIVE!', 'success');
    setTimeout(broadcastSync, 100);
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
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50"
          >
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && !userRole && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
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
          onPlayPause={handlePlayPause}
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={() => setIsMuted(p => !p)}
        />
        </motion.div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
}
