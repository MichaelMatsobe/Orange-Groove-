import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Music, Radio, Users, Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  onJoin: (role: 'host' | 'guest', code?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin }) => {
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [code, setCode] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStartParty = () => {
    setStarting(true);
    // Small delay for UX feedback; actual code is generated in App
    setTimeout(() => onJoin('host'), 300);
  };

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin('guest', code.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
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
              {starting ? 'Starting…' : 'Start a Party (Host / DJ)'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
              className="w-full bg-black/20 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black/30 transition-colors"
            >
              <Users className="w-5 h-5" />
              Join a Party
            </motion.button>
            <p className="text-center text-white/60 text-sm pt-4">
              Works in any modern browser. Install as app from your browser menu for the best experience.
            </p>
          </>
        ) : (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmitJoin}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Enter Party Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                className="w-full bg-white/10 border border-white/30 rounded-2xl p-4 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-white focus:bg-white/20 placeholder:text-white/30 transition-all"
                autoFocus
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
                disabled={code.trim().length < 4}
                className="flex-[2] bg-white text-orange-600 p-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};
