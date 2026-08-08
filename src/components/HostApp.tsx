import React from 'react';
import { Song, SongRequest } from '../types';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Moon, Sun, LogOut, Radio, ListMusic, Plus, Check, X, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_LIBRARY } from '../constants';
import { clsx } from 'clsx';

interface HostAppProps {
  requests: SongRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClearAll: (status: any) => void;
  onAddRequest: (song: Song) => void;
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
}

export const HostApp: React.FC<HostAppProps> = (props) => {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'requests' | 'library'>('dashboard');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
            {props.partyCode.slice(0, 2)}
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">Party #{props.partyCode}</h2>
            <div className="flex items-center gap-1.5">
              <span className={clsx("w-2 h-2 rounded-full animate-pulse", props.isLive ? "bg-green-500" : "bg-slate-400")} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {props.isLive ? 'LIVE' : 'OFFLINE'}
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Now Playing Card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 shadow-lg relative group">
                  <img 
                    src={props.currentSong.coverUrl} 
                    alt={props.currentSong.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-1 truncate">{props.currentSong.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">{props.currentSong.artist}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 group">
                  <input
                    type="range"
                    min={0}
                    max={props.currentSong.duration}
                    value={props.progress}
                    onChange={(e) => props.onSeek(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                    <span>{formatTime(props.progress)}</span>
                    <span>{formatTime(props.currentSong.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={props.onPrevious} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={props.onPlayPause}
                    className="w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                  >
                    {props.isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                  <button onClick={props.onNext} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl">
                  <button onClick={props.onToggleMute} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    {props.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={props.isMuted ? 0 : props.volume * 100}
                    onChange={e => props.onVolumeChange(parseInt(e.target.value)/100)}
                    className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-500"
                  />
                </div>
              </div>

              {/* Live Toggle */}
              <button
                onClick={props.isLive ? props.onEndParty : props.onGoLive}
                className={clsx(
                  "w-full p-4 rounded-2xl font-bold text-lg shadow-lg transition-all",
                  props.isLive 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                    : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/30"
                )}
              >
                {props.isLive ? 'End Party' : 'Go Live'}
              </button>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Queue ({props.requests.filter(r => r.status === 'pending').length})</h3>
                <button 
                  onClick={() => props.onClearAll('pending')}
                  className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear All
                </button>
              </div>
              
              {props.requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {props.requests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-3">
                      <img src={req.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt={req.title} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{req.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{req.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={clsx(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                            req.status === 'approved' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            req.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>
                            {req.status}
                          </span>
                          <span className="text-[10px] text-slate-400">by {req.requester}</span>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex flex-col gap-1 justify-center">
                          <button onClick={() => props.onApprove(req.id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => props.onReject(req.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
               <h3 className="font-bold text-lg mb-2">Library</h3>
               <div className="grid gap-3">
                 {MOCK_LIBRARY.map(song => (
                   <button
                     key={song.id}
                     onClick={() => props.onAddRequest(song)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 transition-colors text-left group"
                   >
                     <img src={song.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt={song.title} />
                     <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-sm truncate group-hover:text-orange-500 transition-colors">{song.title}</h4>
                       <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                       <Plus className="w-4 h-4" />
                     </div>
                   </button>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center safe-area-bottom">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<Radio className="w-6 h-6" />} 
          label="Live" 
        />
        <NavButton 
          active={activeTab === 'requests'} 
          onClick={() => setActiveTab('requests')} 
          icon={<ListMusic className="w-6 h-6" />} 
          label="Requests" 
          badge={props.requests.filter(r => r.status === 'pending').length}
        />
        <NavButton 
          active={activeTab === 'library'} 
          onClick={() => setActiveTab('library')} 
          icon={<Music className="w-6 h-6" />} 
          label="Library" 
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all",
      active ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
    )}
  >
    <div className="relative">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
