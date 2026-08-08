import React from 'react';
import { Song, SongRequest } from '../types';
import { Volume2, VolumeX, Moon, Sun, LogOut, Radio, Music, Plus, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface GuestAppProps {
  requests: SongRequest[];
  onAddRequest: (song: Song) => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  partyCode: string;
  currentSong: Song;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isLive?: boolean;
  isConnected?: boolean;
  library: Song[];
}

export const GuestApp: React.FC<GuestAppProps> = (props) => {
  const [activeTab, setActiveTab] = React.useState<'now-playing' | 'library'>('now-playing');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold shadow-md text-sm">
            {props.partyCode.slice(0, 2)}
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">Party #{props.partyCode}</h2>
            <div className="flex items-center gap-1.5">
              {props.isConnected ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {props.isLive && props.isPlaying ? 'SYNCED TO HOST' : props.isLive ? 'WAITING' : 'PARTY OFFLINE'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={props.toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            {props.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={props.onBack} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'now-playing' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700">
              <div className="aspect-square rounded-2xl overflow-hidden mb-6 shadow-lg relative">
                <img src={props.currentSong.coverUrl} alt={props.currentSong.title} className="w-full h-full object-cover" />
                {props.isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center gap-1 pb-4 px-4">
                    {[...Array(12)].map((_, i) => (
                      <motion.div key={i} animate={{ height: [10, Math.random() * 40 + 10, 10] }} transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }} className="w-1.5 bg-white/80 rounded-full" />
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold mb-1 truncate">{props.currentSong.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{props.currentSong.artist}</p>
                <p className="text-xs text-rose-500 mt-2 font-medium">Controlled by Host DJ</p>
              </div>

              <div className="mb-6">
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (props.progress / (props.currentSong.duration || 1)) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                  <span>{formatTime(props.progress)}</span>
                  <span>{formatTime(props.currentSong.duration || 0)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl">
                <button onClick={props.onToggleMute}>{props.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                <input type="range" min="0" max="100" value={props.isMuted ? 0 : props.volume * 100} onChange={e => props.onVolumeChange(parseInt(e.target.value) / 100)}
                  className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-500" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg px-1">Recent Requests</h3>
              {props.requests.slice(0, 4).map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
                  <img src={req.coverUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{req.title}</h4>
                    <span className={clsx("text-[10px] px-1.5 rounded-full font-medium uppercase",
                      req.status === 'approved' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      req.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")}>{req.status}</span>
                  </div>
                </div>
              ))}
              {props.requests.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No requests yet</p>}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Request a Song</h3>
            <p className="text-sm text-slate-500">The host DJ decides what plays next.</p>
            <div className="grid gap-3">
              {props.library.filter(s => !s.isLocal).map(song => (
                <button key={song.id} onClick={() => props.onAddRequest(song)}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-rose-500 text-left group">
                  <img src={song.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate group-hover:text-rose-500">{song.title}</h4>
                    <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center">
        <NavButton active={activeTab === 'now-playing'} onClick={() => setActiveTab('now-playing')} icon={<Radio className="w-6 h-6" />} label="Now Playing" />
        <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Music className="w-6 h-6" />} label="Request" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={clsx("flex flex-col items-center gap-1 p-2 rounded-xl w-24 transition-all",
    active ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>
    {icon}<span className="text-[10px] font-medium">{label}</span>
  </button>
);

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
