import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Users, Activity, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiFetch } from '../api';
import { Room } from '../types';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  waiting: { bg: 'bg-textMuted/20', text: 'text-textMuted', label: 'Waiting' },
  countdown: { bg: 'bg-secondary/20', text: 'text-secondary', label: 'Countdown' },
  playing: { bg: 'bg-success/20', text: 'text-success', label: 'Playing' },
  finished: { bg: 'bg-danger/20', text: 'text-danger', label: 'Finished' },
};

export default function LiveMatches() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await apiFetch('/rooms');
      setRooms(res.rooms || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchRooms, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchRooms]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Live Matches</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all"
          >
            {autoRefresh ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => { setLoading(true); fetchRooms(); }}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {rooms.length === 0 && !loading ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <Activity className="w-16 h-16 text-textMuted/40" />
          <p className="text-textMuted text-lg">No active matches.</p>
          <p className="text-textMuted/60 text-sm">Start a game to see it here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => {
            const status = statusConfig[room.status] || statusConfig.waiting;
            return (
              <div key={room.code} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-bold text-lg">{room.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-textMuted">
                  <span>{room.mode}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {room.players.length}
                  </span>
                </div>
                <div className="border-t border-border/40 pt-3">
                  <p className="text-xs text-textMuted mb-1">Players</p>
                  <div className="flex flex-wrap gap-1.5">
                    {room.players.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-surface rounded-lg text-xs text-white/80">
                        {p.username}
                      </span>
                    ))}
                    {room.players.length === 0 && (
                      <span className="text-xs text-textMuted/60">Waiting for players...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
