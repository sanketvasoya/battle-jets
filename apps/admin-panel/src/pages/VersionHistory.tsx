import { useState, useEffect, useCallback } from 'react';
import { History, Eye, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { apiFetch } from '../api';
import type { ContentVersion } from '../types';

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'character', label: 'Character' },
  { value: 'map', label: 'Map' },
  { value: 'gamemode', label: 'Game Mode' },
  { value: 'theme', label: 'Theme' },
  { value: 'crosshair', label: 'Crosshair' },
  { value: 'jetpack', label: 'Jetpack' },
  { value: 'powerup', label: 'Power-Up' },
];

const TAKE = 20;

const BADGE_COLORS: Record<string, string> = {
  weapon: 'bg-[#EF4444]/20 text-[#EF4444]',
  character: 'bg-[#22C55E]/20 text-[#22C55E]',
  map: 'bg-[#2F80ED]/20 text-[#2F80ED]',
  gamemode: 'bg-[#A855F7]/20 text-[#A855F7]',
  theme: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  crosshair: 'bg-[#EC4899]/20 text-[#EC4899]',
  jetpack: 'bg-[#06B6D4]/20 text-[#06B6D4]',
  powerup: 'bg-[#FF6B00]/20 text-[#FF6B00]',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function VersionHistory() {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [skip, setSkip] = useState(0);
  const [viewingVersion, setViewingVersion] = useState<ContentVersion | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), take: String(TAKE) });
      if (entityType) params.set('entityType', entityType);
      const data = await apiFetch(`/versions?${params}`);
      setVersions(data.versions ?? []);
    } catch (err) {
      console.error('Failed to load versions', err);
    } finally {
      setLoading(false);
    }
  }, [skip, entityType]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleTypeChange = (type: string) => {
    setEntityType(type);
    setSkip(0);
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Restore this version? This will overwrite the current entity data.')) return;
    setRestoringId(id);
    try {
      await apiFetch(`/versions/${id}/restore`, { method: 'POST' });
      await fetchVersions();
    } catch (err) {
      console.error('Failed to restore version', err);
    } finally {
      setRestoringId(null);
    }
  };

  const hasPrev = skip > 0;
  const hasNext = versions.length === TAKE;

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">Version History</h1>
          </div>
          <select
            value={entityType}
            onChange={e => handleTypeChange(e.target.value)}
            className="bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2F80ED]"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#94A3B8]">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-16 text-[#94A3B8]">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No version history found.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155] text-[#94A3B8] text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Changelog</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map(v => {
                  const badgeColor = BADGE_COLORS[v.entityType] ?? 'bg-[#334155] text-[#94A3B8]';
                  return (
                    <tr key={v.id} className="border-b border-[#334155]/40 hover:bg-[#1E293B]/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${badgeColor}`}>
                            {v.entityType}
                          </span>
                          <span className="text-white font-medium">{v.entityName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] font-mono">v{v.version}</td>
                      <td className="px-4 py-3 text-[#94A3B8] max-w-xs truncate">{v.changelog || '—'}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingVersion(v)}
                            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
                            title="View Data"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleRestore(v.id)}
                            disabled={restoringId === v.id}
                            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#FF6B00] transition-colors disabled:opacity-50"
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setSkip(s => Math.max(0, s - TAKE))}
            disabled={!hasPrev}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-[#94A3B8] hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-xs text-[#94A3B8]">
            Showing {skip + 1}–{skip + versions.length}
          </span>
          <button
            onClick={() => setSkip(s => s + TAKE)}
            disabled={!hasNext}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-[#94A3B8] hover:text-white transition-colors disabled:opacity-30"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        <Modal
          open={!!viewingVersion}
          onClose={() => setViewingVersion(null)}
          title={viewingVersion ? `${viewingVersion.entityName} — v${viewingVersion.version}` : ''}
          wide
        >
          {viewingVersion && (
            <pre className="bg-[#0B1120] border border-[#334155] rounded-xl p-4 overflow-auto text-xs text-[#94A3B8] font-mono max-h-[60vh]">
              {JSON.stringify(viewingVersion.data, null, 2)}
            </pre>
          )}
        </Modal>
      </div>
    </div>
  );
}
