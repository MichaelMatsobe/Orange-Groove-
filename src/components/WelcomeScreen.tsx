import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Music, Radio, Users, Loader2, Shield } from 'lucide-react';

interface WelcomeScreenProps {
  onJoin: (role: 'host' | 'guest', code?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin }) => {
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [code, setCode] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStartParty = () => {
    setStarting(true);
    setTimeout(() => onJoin('host'), 280);
  };

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length >= 4) {
      onJoin('guest', trimmed);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Orange Groove</h1>
        <p className="text-white/80 text-lg">Multi-device group play. Host is the DJ.</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {mode === 'menu' ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartParty}
              disabled={starting}
              className="w-full bg-white text-orange-600 p-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
              {starting ? 'Creating secure room…' : 'Start a Party (Host / DJ)'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
              className="w-full bg-black/20 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black/30 transition-colors"
            >
              <Users className="w-5 h-5" />
              Join with Party Code
            </motion.button>
            <div className="flex items-center justify-center gap-2 text-white/50 text-xs pt-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Private room · code only shared by host</span>
            </div>
          </>
        ) : (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmitJoin}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">
                Enter the 6-digit code from the host
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-white/10 border border-white/30 rounded-2xl p-4 text-center text-3xl font-mono tracking-[0.35em] focus:outline-none focus:border-white focus:bg-white/20 placeholder:text-white/25 transition-all"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="flex-1 bg-black/20 hover:bg-black/30 text-white p-4 rounded-2xl font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={code.trim().length < 6}
                className="flex-[2] bg-white text-orange-600 p-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join & Sync
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};
