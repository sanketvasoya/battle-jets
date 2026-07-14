import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { Room, SOCKET_EVENTS } from '@battle-jets/shared';
import { socket } from '../../utils/socket';
import { soundManager } from '../../utils/SoundManager';
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  Lock,
  Globe,
  CheckCircle,
  Clock,
  RefreshCw,
  Swords,
} from 'lucide-react';

const AVATAR_EMOJIS: Record<string, string> = {
  commander_alpha: '🪖',
  scout_delta: '⚡',
  heavy_bravo: '🛡️',
  medic_echo: '💊',
  sniper_foxtrot: '🎯',
};

export const LobbyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuthStore();
  const {
    roomsList,
    activeRoom,
    isLoading,
    error,
    countdown,
    isReady,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    initRoomListeners,
    removeRoomListeners,
  } = useRoomStore();

  const [tab, setTab] = useState<'public' | 'private' | 'create'>('public');
  const [joinCode, setJoinCode] = useState('');
  const [createPublic, setCreatePublic] = useState(true);

  useEffect(() => {
    initRoomListeners();
    fetchRooms();
    return () => removeRoomListeners();
  }, []);

  // Navigate to game when match starts
  useEffect(() => {
    socket.on(SOCKET_EVENTS.MATCH_START, () => {
      soundManager.playMatchStart();
      navigate('/game');
    });
    return () => { socket.off(SOCKET_EVENTS.MATCH_START); };
  }, [navigate]);

  if (!player) {
    navigate('/login');
    return null;
  }

  const handleCreateRoom = async () => {
    try {
      await createRoom(createPublic, 'sky_base');
    } catch {}
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinRoom(joinCode.trim());
    } catch {}
  };

  const handleJoinPublic = async (room: Room) => {
    try {
      await joinRoom(room.code);
    } catch {}
  };

  if (activeRoom) {
    // Show lobby waiting room
    return (
      <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-animation opacity-15" />

        <motion.div
          className="relative z-10 w-full max-w-lg px-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="glass-glow rounded-3xl p-6">
            {/* Room info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-text">BRIEFING ROOM</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono text-primary bg-primary/15 px-3 py-1 rounded-lg border border-primary/30">
                    {activeRoom.code}
                  </span>
                  {activeRoom.isPublic ? (
                    <span className="text-xs text-textMuted flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                  ) : (
                    <span className="text-xs text-textMuted flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-textMuted">
                <p className="flex items-center gap-1 justify-end"><Users className="w-4 h-4" /> {activeRoom.players.length} / {activeRoom.maxPlayers}</p>
                <p className="text-xs mt-0.5">Deathmatch · Sky Base</p>
              </div>
            </div>

            {/* Countdown overlay */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.p
                    className="text-8xl font-heading font-black text-primary"
                    key={countdown}
                    initial={{ scale: 1.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {countdown}
                  </motion.p>
                  <p className="text-textMuted mt-4 text-lg tracking-widest font-body">MATCH STARTING...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Player list */}
            <div className="space-y-2 mb-6">
              {activeRoom.players.map((p) => (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface/60 border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-2xl">{AVATAR_EMOJIS[p.avatar] || '🪖'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-text">{p.username}</p>
                    {p.id === activeRoom.hostId && (
                      <span className="text-xs text-secondary">Host</span>
                    )}
                  </div>
                  {p.ready ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Clock className="w-5 h-5 text-textMuted" />
                  )}
                </motion.div>
              ))}
              {Array.from({ length: activeRoom.maxPlayers - activeRoom.players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/40">
                  <div className="w-8 h-8 rounded-full bg-surface/30" />
                  <p className="text-textMuted text-sm">Waiting for pilot...</p>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger/15 border border-danger/30 rounded-xl px-4 py-2 text-danger text-sm mb-4">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={leaveRoom}
                className="flex-1 py-3 border border-border rounded-xl text-textMuted hover:border-danger hover:text-danger transition-all text-sm font-bold"
              >
                ← LEAVE
              </button>
              <motion.button
                id="lobby-ready-btn"
                onClick={toggleReady}
                className={`flex-1 py-3 rounded-xl font-heading font-bold text-sm uppercase tracking-wide transition-all ${
                  isReady
                    ? 'bg-success text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : 'bg-primary/20 border border-primary text-text hover:bg-primary/30 shadow-glow'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                {isReady ? '✓ READY!' : 'READY UP'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Matchmaking selection
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-animation opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-lg px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-textMuted hover:text-text transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Main Menu
        </button>

        <div className="glass-glow rounded-3xl p-6">
          <h1 className="text-2xl font-heading font-bold text-text mb-1 flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary" /> MATCHMAKING
          </h1>
          <p className="text-textMuted text-sm mb-5">Find or create a combat room</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface/50 rounded-xl p-1 mb-5">
            {[
              { key: 'public', label: 'Public', icon: Globe },
              { key: 'private', label: 'Join Code', icon: Lock },
              { key: 'create', label: 'Create', icon: Plus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={`lobby-tab-${key}`}
                onClick={() => setTab(key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                  tab === key
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Public Rooms */}
          {tab === 'public' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-textMuted uppercase tracking-widest">Open Rooms</p>
                <button onClick={fetchRooms} className="text-textMuted hover:text-primary transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {isLoading && (
                <div className="text-center py-8 text-textMuted text-sm">Scanning for pilots...</div>
              )}
              {!isLoading && roomsList.length === 0 && (
                <div className="text-center py-8 text-textMuted text-sm">
                  <p className="text-3xl mb-2">🛸</p>
                  No open rooms found. Create one!
                </div>
              )}
              {roomsList.map((room) => (
                <motion.div
                  key={room.code}
                  className="flex items-center gap-3 p-3 bg-surface/60 border border-border rounded-xl hover:border-primary transition-all cursor-pointer"
                  whileHover={{ x: 3 }}
                  onClick={() => handleJoinPublic(room)}
                >
                  <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-text">{room.code}</p>
                    <p className="text-xs text-textMuted">Deathmatch · {room.players.length}/{room.maxPlayers} pilots</p>
                  </div>
                  <button className="text-xs text-primary font-bold hover:text-white transition-colors">JOIN →</button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Join by Code */}
          {tab === 'private' && (
            <div className="space-y-4">
              <p className="text-xs text-textMuted uppercase tracking-widest">Room Code</p>
              <input
                id="lobby-join-code-input"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER 6-CHAR CODE"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-textMuted text-center font-mono text-xl uppercase tracking-[0.5em] focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                maxLength={6}
              />
              {error && <p className="text-danger text-sm text-center">{error}</p>}
              <motion.button
                id="lobby-join-code-btn"
                onClick={handleJoinByCode}
                disabled={joinCode.length < 6 || isLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white font-heading font-bold uppercase tracking-widest rounded-xl shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'CONNECTING...' : 'JOIN ROOM'}
              </motion.button>
            </div>
          )}

          {/* Create Room */}
          {tab === 'create' && (
            <div className="space-y-4">
              <p className="text-xs text-textMuted uppercase tracking-widest">New Room Settings</p>
              <div className="p-4 bg-surface/50 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Mode</span>
                  <span className="text-sm font-bold text-primary">Deathmatch</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Map</span>
                  <span className="text-sm font-bold text-primary">Sky Base</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Visibility</span>
                  <button
                    onClick={() => setCreatePublic(!createPublic)}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${createPublic ? 'text-success' : 'text-secondary'}`}
                  >
                    {createPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {createPublic ? 'Public' : 'Private'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Max Players</span>
                  <span className="text-sm font-bold text-primary">8</span>
                </div>
              </div>
              {error && <p className="text-danger text-sm text-center">{error}</p>}
              <motion.button
                id="lobby-create-btn"
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-secondary to-orange-500 text-white font-heading font-bold uppercase tracking-widest rounded-xl shadow-glowOrange disabled:opacity-40"
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'DEPLOYING...' : '+ CREATE ROOM'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default LobbyScreen;
