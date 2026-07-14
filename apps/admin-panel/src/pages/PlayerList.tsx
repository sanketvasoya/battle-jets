import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Users } from 'lucide-react';
import { apiFetch } from '../api';
import { Player } from '../types';
import DataTable from '../components/DataTable';

type SortField = 'level' | 'xp' | 'wins' | 'losses' | 'joined';

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'level', label: 'Level' },
  { value: 'xp', label: 'XP' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
  { value: 'joined', label: 'Joined' },
];

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('level');
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPlayers = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await apiFetch(`/players?take=50&skip=${offset}`);
      const fetched: Player[] = res.players || [];
      setPlayers(prev => append ? [...prev, ...fetched] : fetched);
      setHasMore(fetched.length === 50);
      setSkip(offset + fetched.length);
    } catch {
      if (!append) setPlayers([]);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchPlayers(0, false);
  }, [fetchPlayers]);

  const sortPlayers = (list: Player[]): Player[] => {
    return [...list].sort((a, b) => {
      if (sortBy === 'joined') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
  };

  const filtered = sortPlayers(
    players.filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
  );

  const loadMore = () => {
    fetchPlayers(skip, true);
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Players</h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-textMuted focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortField)}
            className="appearance-none bg-surface border border-border rounded-xl px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
        </div>
      </div>

      <DataTable<Player>
        columns={[
          { key: 'username', label: 'Username' },
          { key: 'avatar', label: 'Avatar', render: (item: Player) => (
            item.avatar ? (
              <img src={item.avatar} alt={item.username} className="w-8 h-8 rounded-full border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted text-xs">
                {item.username[0]?.toUpperCase()}
              </div>
            )
          )},
          { key: 'level', label: 'Level', align: 'center' },
          { key: 'xp', label: 'XP', align: 'right', render: (item: Player) => item.xp.toLocaleString() },
          { key: 'wins', label: 'Wins', align: 'center', render: (item: Player) => (
            <span className="text-success">{item.wins}</span>
          )},
          { key: 'losses', label: 'Losses', align: 'center', render: (item: Player) => (
            <span className="text-danger">{item.losses}</span>
          )},
          { key: 'id', label: 'W/L', align: 'center', render: (item: Player) => {
            const ratio = item.losses > 0 ? (item.wins / item.losses).toFixed(2) : item.wins > 0 ? '∞' : '0.00';
            return <span className="font-mono">{ratio}</span>;
          }},
          { key: 'createdAt', label: 'Joined', render: (item: Player) => new Date(item.createdAt).toLocaleDateString() },
        ]}
        data={filtered}
        loading={loading}
        onRefresh={() => fetchPlayers(0, false)}
        keyField="id"
        emptyMessage={search ? 'No players match your search' : 'No players found'}
      />

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all disabled:opacity-50"
          >
            <Users className="w-4 h-4" /> {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
