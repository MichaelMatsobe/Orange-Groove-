import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Music, Radio, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onJoin: (role: 'host' | 'guest', code?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin }) => {
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [code, setCode] = useState('');

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin('guest', code.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Orange Groove</h1>
        <p className="text-white/80 text-lg">Sync your vibe, share the beat.</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {mode === 'menu' ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoin('host')}
              className="w-full bg-white text-orange-600 p-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3"
            >
              <Radio className="w-5 h-5" />
              Start a Party
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
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="8080"
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
                disabled={!code.trim()}
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
