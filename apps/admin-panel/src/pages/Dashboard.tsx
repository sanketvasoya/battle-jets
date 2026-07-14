import React, { useState, useEffect } from 'react';
import { Swords, Map, Users, Activity, Zap, Rocket, Shield } from 'lucide-react';
import { apiFetch } from '../api';

interface Stats {
  weapons: number;
  maps: number;
  characters: number;
  players: number;
  liveMatches: number;
  crosshairs: number;
  jetpacks: number;
  powerups: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ weapons: 0, maps: 0, characters: 0, players: 0, liveMatches: 0, crosshairs: 0, jetpacks: 0, powerups: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [w, m, c, p, r, ch, j, pu] = await Promise.all([
          apiFetch('/weapons'),
          apiFetch('/maps'),
          apiFetch('/characters'),
          apiFetch('/players'),
          apiFetch('/rooms'),
          apiFetch('/crosshairs'),
          apiFetch('/jetpacks'),
          apiFetch('/powerups'),
        ]);
        setStats({
          weapons: w.weapons?.length || 0,
          maps: m.maps?.length || 0,
          characters: c.characters?.length || 0,
          players: p.players?.length || 0,
          liveMatches: r.rooms?.length || 0,
          crosshairs: ch.crosshairs?.length || 0,
          jetpacks: j.jetpacks?.length || 0,
          powerups: pu.powerups?.length || 0,
        });
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      }
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: 'Weapons', value: stats.weapons, icon: <Swords className="w-5 h-5" />, color: 'text-danger' },
    { label: 'Maps', value: stats.maps, icon: <Map className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Characters', value: stats.characters, icon: <Shield className="w-5 h-5" />, color: 'text-secondary' },
    { label: 'Crosshairs', value: stats.crosshairs, icon: <Zap className="w-5 h-5" />, color: 'text-success' },
    { label: 'Jetpacks', value: stats.jetpacks, icon: <Rocket className="w-5 h-5" />, color: 'text-secondary' },
    { label: 'Power-Ups', value: stats.powerups, icon: <Zap className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Players', value: stats.players, icon: <Users className="w-5 h-5" />, color: 'text-textMuted' },
    { label: 'Live Matches', value: stats.liveMatches, icon: <Activity className="w-5 h-5" />, color: 'text-success' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-textMuted text-sm">{card.label}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <div className="text-3xl font-heading font-bold">
              {loading ? '—' : card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
