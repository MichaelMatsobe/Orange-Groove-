import React from 'react';
import { motion } from 'motion/react';
import { Music } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-orange-500 to-rose-600 text-white fixed inset-0 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/10"
        >
          <Music className="w-14 h-14 text-white drop-shadow-md" />
        </motion.div>
        <h1 className="text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">Orange Groove</h1>
        <p className="text-white/90 text-xl font-medium tracking-wide">Sync your vibe.</p>
      </motion.div>
    </div>
  );
};
