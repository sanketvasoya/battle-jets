import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, FolderOpen, Music, FileText, Grid } from 'lucide-react';
import FileUpload, { AssetIcon } from '../components/FileUpload';
import { uploadFile, apiFetch } from '../api';
import type { Asset } from '../types';

type FilterTab = 'all' | 'images' | 'audio' | 'other';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'images', label: 'Images' },
  { key: 'audio', label: 'Audio' },
  { key: 'other', label: 'Other' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFilterGroup(asset: Asset): FilterTab {
  if (asset.mimeType.startsWith('image/')) return 'images';
  if (asset.mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/assets');
      setAssets(data.assets ?? []);
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleUpload = async (file: File) => {
    await uploadFile(file);
    await fetchAssets();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter(a => a.id !== id));
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected asset(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selected).map(id => apiFetch(`/assets/${id}`, { method: 'DELETE' }))
      );
      setAssets(prev => prev.filter(a => !selected.has(a.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to delete assets', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const filtered = assets.filter(a => {
    if (activeTab !== 'all' && getFilterGroup(a) !== activeTab) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FolderOpen className="text-[#FF6B00]" size={28} />
          <h1 className="text-2xl font-bold text-white">Asset Manager</h1>
        </div>

        <FileUpload onUpload={handleUpload} label="Drop files here or click to upload" />

        <div className="flex items-center justify-between mt-6 mb-4 gap-4 flex-wrap">
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#2F80ED] text-white'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm font-medium hover:bg-[#EF4444]/30 transition-colors"
              >
                <Trash2 size={14} />
                Delete Selected ({selected.size})
              </button>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-white focus:outline-none focus:border-[#2F80ED] w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#94A3B8]">Loading assets...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#94A3B8]">
            <Grid className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No assets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(asset => {
              const isImage = asset.mimeType.startsWith('image/');
              const isSelected = selected.has(asset.id);
              return (
                <div
                  key={asset.id}
                  className={`relative bg-[#1E293B] border rounded-xl overflow-hidden group transition-colors ${
                    isSelected ? 'border-[#2F80ED] ring-1 ring-[#2F80ED]/50' : 'border-[#334155] hover:border-[#2F80ED]/50'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleSelect(asset.id)}
                  >
                    <div className="aspect-square bg-[#0F172A] flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img
                          src={`http://localhost:3001/uploads/${asset.path}`}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AssetIcon mimeType={asset.mimeType} className="w-10 h-10" />
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-sm text-white truncate" title={asset.name}>{asset.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2F80ED]/20 text-[#2F80ED] font-medium uppercase">
                        {asset.mimeType.split('/')[1]}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{formatSize(asset.size)}</span>
                    </div>
                    {isImage && asset.width && asset.height && (
                      <p className="text-[11px] text-[#94A3B8] mt-1">{asset.width} x {asset.height}</p>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-[#0F172A]/80 rounded-lg text-[#94A3B8] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
