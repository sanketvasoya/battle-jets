import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { soundManager } from '../../utils/SoundManager';
import { Trophy, Skull, Swords, Target } from 'lucide-react';

const AVATAR_EMOJIS: Record<string, string> = {
  commander_alpha: '🪖',
  scout_delta: '⚡',
  heavy_bravo: '🛡️',
  medic_echo: '💊',
  sniper_foxtrot: '🎯',
};

export const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuthStore();
  const { matchResults, resetGameStore } = useGameStore();
  const { leaveRoom } = useRoomStore();
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (matchResults) {
      soundManager.playMatchEnd();
      const t = setTimeout(() => setShowCelebration(true), 500);
      return () => clearTimeout(t);
    }
  }, [matchResults]);

  const handleBackToLobby = () => {
    leaveRoom();
    resetGameStore();
    navigate('/lobby');
  };

  if (!matchResults) {
    navigate('/menu');
    return null;
  }

  const isWinner = matchResults.winnerId === player?.id;
  const sortedResults = [...matchResults.results].sort((a, b) => b.kills - a.kills);

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-animation opacity-15" />
      {isWinner && (
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
      )}

      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-glow rounded-3xl p-6 space-y-5">
          {/* Header */}
          <div className="text-center">
            <motion.div
              className="text-6xl mb-3"
              animate={showCelebration ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6 }}
            >
              {isWinner ? '🏆' : '💀'}
            </motion.div>
            <h1 className="text-4xl font-heading font-black uppercase">
              {isWinner ? (
                <span className="bg-gradient-to-r from-secondary to-orange-300 bg-clip-text text-transparent">VICTORY!</span>
              ) : (
                <span className="text-textMuted">DEFEATED</span>
              )}
            </h1>
            <p className="text-textMuted text-sm mt-1">
              Winner: <span className="text-text font-bold">{matchResults.winnerName}</span>
            </p>
          </div>

          {/* Results Table */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-textMuted mb-3">MISSION DEBRIEF</h3>
            {sortedResults.map((result, idx) => {
              const isMe = result.playerId === player?.id;
              const avatar = AVATAR_EMOJIS['commander_alpha']; // fallback
              const isWinnerRow = result.playerId === matchResults.winnerId;

              return (
                <motion.div
                  key={result.playerId}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isWinnerRow
                      ? 'border-secondary/50 bg-secondary/10'
                      : isMe
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-surface/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <span className="text-xl font-heading font-black text-textMuted w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-2xl">{avatar}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-text'}`}>
                      {result.username} {isMe && '(You)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <Swords className="w-3 h-3" /> {result.kills}
                    </span>
                    <span className="flex items-center gap-1 text-danger">
                      <Skull className="w-3 h-3" /> {result.deaths}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <motion.button
              id="results-lobby-btn"
              onClick={handleBackToLobby}
              className="flex-1 py-3 border border-primary rounded-xl text-primary font-heading font-bold text-sm uppercase hover:bg-primary/15 transition-all"
              whileTap={{ scale: 0.98 }}
            >
              ← LOBBY
            </motion.button>
            <motion.button
              id="results-rematch-btn"
              onClick={handleBackToLobby}
              className="flex-1 py-3 bg-gradient-to-r from-secondary to-orange-500 text-white font-heading font-bold text-sm uppercase rounded-xl shadow-glowOrange"
              whileTap={{ scale: 0.98 }}
            >
              REMATCH ↺
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default ResultsScreen;
