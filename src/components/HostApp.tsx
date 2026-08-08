import React, { useRef, useState } from 'react';
import { Song, SongRequest, ConnectedDevice } from '../types';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Moon, Sun, LogOut, Radio, ListMusic, Plus, Check, X, Music,
  Users, Smartphone, Upload, Copy, Share2, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface HostAppProps {
  requests: SongRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClearAll: (status: any) => void;
  onAddRequest: (song: Song) => void;
  onPlayRequest?: (req: SongRequest) => void;
  onGoLive: () => void;
  onEndParty: () => void;
  isLive: boolean;
  onBack: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  partyCode: string;
  currentSong: Song;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  connectedDevices?: ConnectedDevice[];
  isConnected?: boolean;
  library: Song[];
  onAddLocalFiles?: (files: FileList | null) => void;
  onCopyCode?: () => void;
}

export const HostApp: React.FC<HostAppProps> = (props) => {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'requests' | 'library' | 'devices'>('dashboard');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deviceCount = (props.connectedDevices?.length ?? 0) + 1;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(props.partyCode);
      setCopied(true);
      props.onCopyCode?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = props.partyCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      props.onCopyCode?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    const text = `Join my Orange Groove party!\nCode: ${props.partyCode}\nOpen the app → Join with Party Code`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Orange Groove Party',
          text,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await handleCopyCode();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-md text-sm">
            DJ
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">Host / Virtual DJ</h2>
            <div className="flex items-center gap-2">
              <span className={clsx("w-2 h-2 rounded-full animate-pulse", props.isLive ? "bg-green-500" : "bg-slate-400")} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {props.isLive ? 'LIVE' : 'OFFLINE'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> {deviceCount}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={props.toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            {props.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={props.onBack} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">

              {/* ===== SECURE PARTY CODE CARD (host shares this with guests) ===== */}
              <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-5 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Private party code</span>
                </div>
                <p className="text-sm text-white/80 mb-3">Share only with people you trust. Guests need this code to sync.</p>
                <div className="bg-black/20 rounded-2xl py-4 px-3 text-center mb-4">
                  <p className="text-4xl font-mono font-bold tracking-[0.4em]">{props.partyCode}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy code'}
                  </button>
                  <button
                    onClick={handleShareCode}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-orange-600 py-3 rounded-xl font-semibold text-sm shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Now Playing */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="aspect-square rounded-2xl overflow-hidden mb-5 shadow-lg relative group">
                  <img src={props.currentSong.coverUrl} alt={props.currentSong.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {props.isLive && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE · {deviceCount} DEVICES
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <h3 className="text-xl font-bold mb-0.5 truncate">{props.currentSong.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{props.currentSong.artist}</p>
                </div>

                <div className="mb-5">
                  <input
                    type="range"
                    min={0}
                    max={props.currentSong.duration || 300}
                    value={props.progress}
                    onChange={(e) => props.onSeek(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-mono">
                    <span>{formatTime(props.progress)}</span>
                    <span>{formatTime(props.currentSong.duration || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <button onClick={props.onPrevious} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><SkipBack className="w-6 h-6" /></button>
                  <button onClick={props.onPlayPause} className="w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95">
                    {props.isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                  <button onClick={props.onNext} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><SkipForward className="w-6 h-6" /></button>
                </div>

                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-700/50 p-3.5 rounded-2xl">
                  <button onClick={props.onToggleMute}>{props.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                  <input type="range" min="0" max="100" value={props.isMuted ? 0 : props.volume * 100} onChange={e => props.onVolumeChange(parseInt(e.target.value) / 100)}
                    className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-500" />
                </div>
              </div>

              <button
                onClick={props.isLive ? props.onEndParty : props.onGoLive}
                className={clsx(
                  "w-full p-4 rounded-2xl font-bold text-lg shadow-lg transition-all",
                  props.isLive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/30"
                )}
              >
                {props.isLive ? 'End Party (Silence Devices)' : 'Go Live — Sync All Devices'}
              </button>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Queue ({props.requests.filter(r => r.status === 'pending').length} pending)</h3>
                <button onClick={() => props.onClearAll('pending')} className="text-xs text-red-500 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">Clear</button>
              </div>
              {props.requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><ListMusic className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No requests yet</p></div>
              ) : (
                <div className="space-y-3">
                  {props.requests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
                      <img src={req.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{req.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{req.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                            req.status === 'approved' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            req.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")}>{req.status}</span>
                          <span className="text-[10px] text-slate-400">by {req.requester}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 justify-center">
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => props.onApprove(req.id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Check className="w-4 h-4" /></button>
                            <button onClick={() => props.onReject(req.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><X className="w-4 h-4" /></button>
                          </>
                        )}
                        {req.status === 'approved' && props.onPlayRequest && (
                          <button onClick={() => props.onPlayRequest!(req)} className="p-1.5 bg-orange-50 text-orange-600 rounded-lg" title="Play now"><Play className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Library ({props.library.length})</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full"
                >
                  <Upload className="w-4 h-4" /> Add files
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={e => props.onAddLocalFiles?.(e.target.files)} />
              </div>
              <p className="text-xs text-slate-400">Local files play on this device only. Sample tracks sync to all guests.</p>
              <div className="grid gap-3">
                {props.library.map(song => (
                  <button key={song.id} onClick={() => props.onAddRequest(song)}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-orange-500 text-left group">
                    <img src={song.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate group-hover:text-orange-500">{song.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{song.artist}{song.isLocal ? ' · Local' : ''}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div key="devices" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
              <h3 className="font-bold text-lg">Connected Devices ({deviceCount})</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white"><Radio className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">This Device (Host / DJ)</p>
                    <p className="text-xs text-slate-500">Master player</p>
                  </div>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">HOST</span>
                </div>
                {(props.connectedDevices ?? []).map((d, i) => (
                  <div key={d.peerId} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><Smartphone className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Device {i + 1}</p>
                      <p className="text-xs text-slate-500">Joined {new Date(d.joinedAt).toLocaleTimeString()}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                ))}
                {(props.connectedDevices?.length ?? 0) === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Copy or share code <strong className="font-mono text-orange-500">{props.partyCode}</strong> so others can join and sync.
                  </p>
                )}
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Rooms are private. Only devices with the exact 6-digit code from this host can connect. The code is not published publicly.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Radio className="w-6 h-6" />} label="Live" />
        <NavButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={<ListMusic className="w-6 h-6" />} label="Queue" badge={props.requests.filter(r => r.status === 'pending').length} />
        <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Music className="w-6 h-6" />} label="Library" />
        <NavButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Users className="w-6 h-6" />} label="Devices" badge={props.connectedDevices?.length} />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={clsx("flex flex-col items-center gap-1 p-2 rounded-xl w-16 transition-all",
    active ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>
    <div className="relative">{icon}{badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{badge}</span>}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
