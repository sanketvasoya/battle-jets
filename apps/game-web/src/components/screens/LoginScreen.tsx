import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Rocket, User, ChevronRight, RefreshCw } from 'lucide-react';

const AVATARS = [
  'commander_alpha',
  'scout_delta',
  'heavy_bravo',
  'medic_echo',
  'sniper_foxtrot',
];

const AVATAR_EMOJIS: Record<string, string> = {
  commander_alpha: '🪖',
  scout_delta: '⚡',
  heavy_bravo: '🛡️',
  medic_echo: '💊',
  sniper_foxtrot: '🎯',
};

const AVATAR_LABELS: Record<string, string> = {
  commander_alpha: 'Commander Alpha',
  scout_delta: 'Scout Delta',
  heavy_bravo: 'Heavy Bravo',
  medic_echo: 'Medic Echo',
  sniper_foxtrot: 'Sniper Foxtrot',
};

function generateGuestName() {
  const adjectives = ['Iron', 'Cyber', 'Storm', 'Ghost', 'Nova', 'Blaze', 'Apex', 'Rogue'];
  const nouns = ['Pilot', 'Ace', 'Hawk', 'Wolf', 'Eagle', 'Raven', 'Blade', 'Star'];
  const num = Math.floor(Math.random() * 999);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${num}`;
}

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { guestLogin, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('commander_alpha');
  const [rememberMe, setRememberMe] = useState(true);

  const handleGuestLogin = async () => {
    const name = username.trim() || generateGuestName();
    try {
      await guestLogin(name, selectedAvatar);
      navigate('/menu');
    } catch (e) {
      // error is shown via store
    }
  };

  const handleRandomize = () => {
    setUsername(generateGuestName());
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    setSelectedAvatar(randomAvatar);
  };

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-animation opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="glass-glow rounded-3xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <motion.div
              className="text-5xl mb-3"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Rocket className="w-12 h-12 text-primary mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-heading font-bold text-text">ENTER THE ARENA</h1>
            <p className="text-textMuted text-sm mt-1">Choose your callsign, Pilot</p>
          </div>

          {/* Nickname input */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-textMuted flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Callsign
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 24))}
                  placeholder="Enter your callsign..."
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-textMuted text-sm focus:outline-none focus:border-primary transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                  maxLength={24}
                />
              </div>
              <button
                onClick={handleRandomize}
                title="Randomize"
                className="p-3 bg-surface border border-border rounded-xl text-textMuted hover:text-text hover:border-primary transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {username && username.trim().length < 3 && (
              <p className="text-danger text-xs">Callsign must be at least 3 characters.</p>
            )}
          </div>

          {/* Avatar Selection */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-textMuted">Select Pilot</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((avatar) => (
                <motion.button
                  key={avatar}
                  id={`avatar-${avatar}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-200 ${
                    selectedAvatar === avatar
                      ? 'border-primary bg-primary/15 shadow-glow'
                      : 'border-border bg-surface hover:border-textMuted'
                  }`}
                  title={AVATAR_LABELS[avatar]}
                >
                  <span className="text-2xl">{AVATAR_EMOJIS[avatar]}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-textMuted text-center">{AVATAR_LABELS[selectedAvatar]}</p>
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-textMuted">Remember my session</span>
          </label>

          {/* Error */}
          {error && (
            <div className="bg-danger/15 border border-danger/30 rounded-xl px-4 py-2 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <motion.button
            id="login-guest-btn"
            onClick={handleGuestLogin}
            disabled={isLoading || (username.trim().length > 0 && username.trim().length < 3)}
            className="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-white font-heading font-bold text-lg uppercase tracking-widest rounded-xl shadow-glow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                CONNECTING...
              </>
            ) : (
              <>
                ENTER AS GUEST <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-textMuted">
            Google login coming soon — Battle Jets Phase 2
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default LoginScreen;
