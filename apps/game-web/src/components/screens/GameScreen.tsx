import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { GameCanvas } from '../game/GameCanvas';
import { GAME_CONSTANTS, WeaponType, formatTime } from '@battle-jets/shared';
import { Heart, Clock, Skull, Swords, Pause } from 'lucide-react';

const WEAPON_ICONS: Record<WeaponType, string> = {
  assault_rifle: '🔫',
  shotgun: '💥',
  sniper: '🎯',
  rocket_launcher: '🚀',
  smg: '⚡',
  pistol: '🔹',
  energy_rifle: '💎',
  melee: '⚔️',
  grenade_launcher: '💣',
  laser: '✨',
};

const WEAPON_LABELS: Record<WeaponType, string> = {
  assault_rifle: 'AR',
  shotgun: 'SG',
  sniper: 'SNP',
  rocket_launcher: 'RL',
  smg: 'SMG',
  pistol: 'PST',
  energy_rifle: 'ER',
  melee: 'BLD',
  grenade_launcher: 'GL',
  laser: 'LAS',
};

const WEAPONS: WeaponType[] = ['assault_rifle', 'shotgun', 'sniper', 'rocket_launcher', 'smg', 'pistol', 'energy_rifle', 'grenade_launcher', 'laser', 'melee'];

export const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const { gameState, killFeed, sendWeaponSwitch, matchResults } = useGameStore();
  const { player } = useAuthStore();
  const { activeRoom } = useRoomStore();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('assault_rifle');
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

  const localPlayer = player && gameState ? gameState.players.get(player.id) : null;

  const handleMatchEnd = useCallback(() => {
    navigate('/results');
  }, [navigate]);

  useEffect(() => {
    if (matchResults) {
      navigate('/results');
    }
  }, [matchResults, navigate]);

  const handleWeaponSwitch = (weapon: WeaponType) => {
    setSelectedWeapon(weapon);
    sendWeaponSwitch(weapon);
  };

  const leaderboard = gameState
    ? Array.from(gameState.players.values())
        .filter((p) => p.isAlive || true)
        .sort((a, b) => b.kills - a.kills)
        .slice(0, 5)
    : [];

  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none">
      {/* PixiJS Canvas fills the whole screen */}
      <GameCanvas onMatchEnd={handleMatchEnd} />

      {/* ---- HUD Overlay ---- */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top-Left: Health & Status */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="glass rounded-xl p-2.5 w-48">
            {localPlayer ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-danger flex-shrink-0" />
                  <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${(localPlayer.health / localPlayer.maxHealth) * 100}%`,
                        background: localPlayer.health > 50 ? '#22C55E' : localPlayer.health > 25 ? '#FF6B00' : '#EF4444',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-text w-6 text-right">{localPlayer.health}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-textMuted">
                  <Swords className="w-3 h-3 text-success" />
                  <span>{localPlayer.kills} K</span>
                  <Skull className="w-3 h-3 text-danger ml-1" />
                  <span>{localPlayer.deaths} D</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-textMuted">Respawning...</p>
            )}
          </div>
        </div>

        {/* Top-Center: Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="glass-glow rounded-xl px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-heading font-bold text-lg text-text">
              {gameState ? formatTime(gameState.timeRemaining) : '10:00'}
            </span>
          </div>
        </div>

        {/* Top-Right: Mini Leaderboard */}
        <div className="absolute top-4 right-4 w-36">
          <div className="glass rounded-xl p-2 space-y-1">
            {leaderboard.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-textMuted">{idx + 1}.</span>
                <span className={`flex-1 truncate ${p.id === player?.id ? 'text-primary font-bold' : 'text-text'}`}>
                  {p.username}
                </span>
                <span className="text-success font-bold">{p.kills}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Left: Weapons */}
        {!isMobile && (
          <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
            {WEAPONS.map((w, idx) => (
              <button
                key={w}
                id={`weapon-btn-${w}`}
                onClick={() => handleWeaponSwitch(w)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-all ${
                  selectedWeapon === w
                    ? 'border-primary bg-primary/20 shadow-glow'
                    : 'border-border bg-surface/70 hover:border-textMuted'
                }`}
              >
                <span className="text-xl">{WEAPON_ICONS[w]}</span>
                <span className="text-xs text-textMuted">[{idx + 1}]</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom-Center: Mobile weapons */}
        {isMobile && (
          <div className="absolute bottom-28 right-4 flex flex-col gap-2 pointer-events-auto">
            {WEAPONS.map((w) => (
              <button
                key={w}
                id={`mobile-weapon-btn-${w}`}
                onClick={() => handleWeaponSwitch(w)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  selectedWeapon === w
                    ? 'border-primary bg-primary/30'
                    : 'border-border bg-surface/50'
                }`}
              >
                <span className="text-lg">{WEAPON_ICONS[w]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Kill Feed */}
        <div className="absolute top-20 right-4 w-52 space-y-1.5">
          <AnimatePresence>
            {killFeed.map((k, idx) => (
              <motion.div
                key={`${k.timestamp}-${idx}`}
                className="glass rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <span className={`font-bold truncate ${k.killerId === player?.id ? 'text-primary' : 'text-text'}`}>
                  {k.killerName}
                </span>
                <span className="text-textMuted">{WEAPON_ICONS[k.weapon]}</span>
                <span className={`font-bold truncate ${k.victimId === player?.id ? 'text-danger' : 'text-textMuted'}`}>
                  {k.victimName}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pause button */}
        <button
          id="game-pause-btn"
          onClick={() => setIsPaused(!isPaused)}
          className="absolute top-4 left-1/2 translate-x-20 pointer-events-auto glass rounded-lg p-2 hover:border-primary transition-all border border-border"
        >
          <Pause className="w-4 h-4 text-textMuted" />
        </button>
      </div>

      {/* Pause modal */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass-glow rounded-2xl p-8 text-center space-y-4 w-72">
              <h2 className="text-2xl font-heading font-bold">PAUSED</h2>
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 bg-primary/20 border border-primary rounded-xl text-primary font-bold hover:bg-primary/30 transition-all"
              >
                RESUME
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="w-full py-3 border border-border rounded-xl text-textMuted hover:text-danger hover:border-danger transition-all"
              >
                QUIT MATCH
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default GameScreen;
