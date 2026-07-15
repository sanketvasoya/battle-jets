import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { SettingsModal } from './SettingsModal';
import { Rocket, Users, Swords, Settings, Trophy, Gamepad2, Star } from 'lucide-react';
import { getAvatarUrl, isUIAssetsLoaded } from '../../utils/UIAssets';
import { preloadAssets } from '../../utils/AssetLoader';

const AVATAR_EMOJIS: Record<string, string> = {
  commander_alpha: '🪖',
  scout_delta: '⚡',
  heavy_bravo: '🛡️',
  medic_echo: '💊',
  sniper_foxtrot: '🎯',
};

interface MenuButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  variant?: 'primary' | 'default';
}

const MenuButton: React.FC<MenuButtonProps> = ({ id, icon, label, sub, onClick, variant = 'default' }) => (
  <motion.button
    id={id}
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 group ${
      variant === 'primary'
        ? 'border-primary bg-primary/20 hover:bg-primary/30 shadow-glow'
        : 'border-border bg-surface/60 hover:border-primary hover:bg-surface'
    }`}
    whileHover={{ x: 4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
  >
    <span className={`text-2xl ${variant === 'primary' ? 'text-primary' : 'text-textMuted group-hover:text-primary'} transition-colors`}>
      {icon}
    </span>
    <div className="text-left flex-1">
      <p className={`font-heading font-bold text-base uppercase tracking-wide ${variant === 'primary' ? 'text-white' : 'text-text'}`}>
        {label}
      </p>
      {sub && <p className="text-xs text-textMuted">{sub}</p>}
    </div>
    <span className="text-textMuted group-hover:text-primary transition-colors text-sm">›</span>
  </motion.button>
);

export const MainMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { player, logout } = useAuthStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uiReady, setUiReady] = useState(isUIAssetsLoaded());

  useEffect(() => {
    if (!isUIAssetsLoaded()) {
      preloadAssets().then(() => setUiReady(true));
    }
  }, []);

  if (!player) {
    navigate('/login');
    return null;
  }

  const xpToNextLevel = player.level * 100;
  const xpProgress = ((player.xp % 100) / 100) * 100;

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-animation opacity-15" />
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg px-4 py-8">
        {/* Player Profile Card */}
        <motion.div
          className="glass-glow rounded-2xl p-5 mb-6 flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 flex items-center justify-center">
            {uiReady && getAvatarUrl(player.avatar, 56) ? (
              <img src={getAvatarUrl(player.avatar, 56)} alt={player.avatar} className="w-14 h-14 object-contain" />
            ) : (
              <span className="text-5xl">{AVATAR_EMOJIS[player.avatar] || '🪖'}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-lg text-text">{player.username}</p>
            <div className="flex items-center gap-3 text-xs text-textMuted mt-1">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-secondary" /> Lv.{player.level}</span>
              <span className="flex items-center gap-1">🏆 {player.wins}W / {player.losses}L</span>
              <span>💰 {player.coins}</span>
            </div>
            {/* XP Bar */}
            <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-textMuted mt-1">{player.xp % 100} / {100} XP</p>
          </div>
        </motion.div>

        {/* Menu Buttons */}
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } }
          }}
        >
          {[
            {
              id: 'menu-play-btn',
              icon: <Rocket className="w-6 h-6" />,
              label: 'PLAY',
              sub: 'Find or create a match',
              onClick: () => navigate('/lobby'),
              variant: 'primary' as const,
            },
            {
              id: 'menu-practice-btn',
              icon: <Gamepad2 className="w-6 h-6" />,
              label: 'PRACTICE',
              sub: 'Solo training room',
              onClick: () => navigate('/lobby?mode=practice'),
              variant: 'default' as const,
            },
            {
              id: 'menu-leaderboard-btn',
              icon: <Trophy className="w-6 h-6" />,
              label: 'LEADERBOARD',
              sub: 'Top pilots worldwide',
              onClick: () => navigate('/leaderboard'),
              variant: 'default' as const,
            },
            {
              id: 'menu-settings-btn',
              icon: <Settings className="w-6 h-6" />,
              label: 'SETTINGS',
              sub: 'Audio, graphics, controls',
              onClick: () => setSettingsOpen(true),
              variant: 'default' as const,
            },
          ].map((item) => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
            >
              <MenuButton {...item} />
            </motion.div>
          ))}
        </motion.div>

        {/* Online stats */}
        <motion.div
          className="mt-6 glass rounded-xl p-3 flex items-center justify-around text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <p className="text-lg font-bold text-success">● ONLINE</p>
            <p className="text-xs text-textMuted">Server Status</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-bold text-text">Deathmatch</p>
            <p className="text-xs text-textMuted">Active Mode</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-bold text-text">Sky Base</p>
            <p className="text-xs text-textMuted">Active Map</p>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          onClick={() => { logout(); navigate('/'); }}
          className="mt-4 w-full text-xs text-textMuted hover:text-danger transition-colors py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Disconnect & Exit Arena
        </motion.button>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
export default MainMenuScreen;
