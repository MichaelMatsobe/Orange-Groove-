import React from 'react';
import { motion } from 'motion/react';
import { Music, Radio, Zap, Headphones, Disc, Mic2 } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-orange-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-rose-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, duration: 1.5 }}
          className="relative mb-12 group"
        >
          <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-tr from-orange-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/10">
            <Music className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
          </div>
          
          {/* Orbiting Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] border border-white/10 rounded-full border-dashed"
          />
        </motion.div>

        {/* Text Reveal */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="text-6xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[0.9]"
          >
            ORANGE
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-8">
          <motion.h1
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-purple-500 leading-[0.9]"
          >
            GROOVE
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-xl md:text-2xl text-white/70 mb-12 font-medium tracking-wide max-w-lg"
        >
          The real-time collaborative music player. <br/>
          <span className="text-orange-400">Sync.</span> <span className="text-rose-400">Vibe.</span> <span className="text-purple-400">Together.</span>
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249, 115, 22, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 400, damping: 17 }}
          onClick={onEnter}
          className="group relative px-10 py-5 bg-white text-slate-950 rounded-full font-bold text-xl shadow-2xl overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            ENTER EXPERIENCE <Zap className="w-6 h-6 fill-slate-950 group-hover:rotate-12 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-200 via-rose-200 to-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </div>

      {/* Floating Background Icons */}
      <FloatingIcon icon={<Radio />} delay={0} x="-35vw" y="-30vh" size={64} />
      <FloatingIcon icon={<Headphones />} delay={2} x="40vw" y="20vh" size={80} />
      <FloatingIcon icon={<Disc />} delay={4} x="-30vw" y="35vh" size={56} />
      <FloatingIcon icon={<Mic2 />} delay={1} x="30vw" y="-25vh" size={48} />
      
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 text-white/30 text-sm font-mono"
      >
        v2.0 • LIVE SYNC ENABLED
      </motion.div>
    </div>
  );
};

const FloatingIcon = ({ icon, delay, x, y, size }: any) => (
  <motion.div
    initial={{ opacity: 0, x, y }}
    animate={{ 
      opacity: [0.1, 0.3, 0.1], 
      y: [`calc(${y} - 30px)`, `calc(${y} + 30px)`, `calc(${y} - 30px)`],
      rotate: [0, 10, -10, 0]
    }}
    transition={{ 
      opacity: { duration: 5, repeat: Infinity, delay, ease: "easeInOut" },
      y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay },
      rotate: { duration: 10, repeat: Infinity, ease: "easeInOut", delay }
    }}
    className="absolute text-white pointer-events-none"
  >
    {React.cloneElement(icon, { size })}
  </motion.div>
);
