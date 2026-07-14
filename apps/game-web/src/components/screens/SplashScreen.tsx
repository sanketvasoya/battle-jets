import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from './SettingsModal';

const LOADING_STEPS = [
  'Initializing Combat Systems...',
  'Loading Map Data...',
  'Calibrating Physics Engine...',
  'Establishing Secure Channel...',
  'Deploying Jetpacks...',
];

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress((step / LOADING_STEPS.length) * 100);
      setLoadingText(LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)]);
      if (step >= LOADING_STEPS.length) {
        clearInterval(interval);
        setIsLoaded(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-center">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-animation opacity-30" />

      {/* Starfield backdrop */}
      <div className="absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() < 0.6 ? 1 : 2,
              height: Math.random() < 0.6 ? 1 : 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      {/* Logo section */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Jet icon */}
        <motion.div
          className="text-8xl mb-4"
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🚀
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-7xl md:text-8xl font-heading font-bold uppercase tracking-tighter"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="bg-gradient-to-r from-primary via-blue-300 to-primary bg-clip-text text-transparent">
            Battle
          </span>
          <span className="text-white"> </span>
          <span className="bg-gradient-to-r from-secondary via-orange-300 to-secondary bg-clip-text text-transparent">
            Jets
          </span>
        </motion.h1>

        <motion.p
          className="text-textMuted text-lg tracking-widest uppercase mt-2 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Phase 1 — MVP Foundation
        </motion.p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        className="relative z-10 mt-16 w-80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-textMuted text-center mt-3 tracking-wider">{loadingText}</p>
      </motion.div>

      {/* Buttons */}
      <AnimatePresence>
        {isLoaded && (
          <motion.div
            className="relative z-10 mt-12 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.button
              id="splash-play-btn"
              onClick={() => navigate('/login')}
              className="px-14 py-4 bg-gradient-to-r from-primary to-blue-500 text-white font-heading font-bold text-xl uppercase tracking-widest rounded-2xl shadow-glow hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              ▶ PLAY NOW
            </motion.button>
            <motion.button
              id="splash-settings-btn"
              onClick={() => setSettingsOpen(true)}
              className="px-10 py-3 text-textMuted border border-border rounded-xl hover:border-primary hover:text-text transition-all duration-200 font-body text-sm uppercase tracking-widest"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              ⚙ Settings
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
export default SplashScreen;
