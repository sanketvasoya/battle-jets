import React, { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { apiFetch } from '../api';
import DataTable from '../components/DataTable';

interface PublishChange {
  entityType: string;
  entityId: string;
  name: string;
  status: 'new' | 'modified' | 'published';
  lastPublished: string | null;
}

interface PublishEvent {
  date: string;
  count: number;
  types: string[];
}

const statusStyles: Record<string, string> = {
  new: 'bg-primary/20 text-primary',
  modified: 'bg-secondary/20 text-secondary',
  published: 'bg-success/20 text-success',
};

const typeBadgeStyles: Record<string, string> = {
  weapon: 'bg-danger/20 text-danger',
  map: 'bg-primary/20 text-primary',
  character: 'bg-secondary/20 text-secondary',
  crosshair: 'bg-success/20 text-success',
  jetpack: 'bg-secondary/20 text-secondary',
  powerup: 'bg-primary/20 text-primary',
  gamemode: 'bg-textMuted/20 text-textMuted',
  theme: 'bg-secondary/20 text-secondary',
};

export default function Publishing() {
  const [changes, setChanges] = useState<PublishChange[]>([]);
  const [history, setHistory] = useState<PublishEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [changesRes, historyRes] = await Promise.all([
        apiFetch('/publishing/changes').catch(() => null),
        apiFetch('/publishing/history').catch(() => null),
      ]);

      if (changesRes) setChanges(changesRes.changes || []);
      if (historyRes) setHistory((historyRes.history || []).slice(0, 10));
      setApiAvailable(!!(changesRes || historyRes));
    } catch {
      setApiAvailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checkForChanges = async () => {
    setChecking(true);
    try {
      const res = await apiFetch('/publishing/changes');
      setChanges(res.changes || []);
      setApiAvailable(true);
    } catch {
      setApiAvailable(false);
    }
    setChecking(false);
  };

  const publishItem = async (entityType: string, entityId: string) => {
    setPublishing(entityId);
    try {
      await apiFetch('/publishing/publish', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId }),
      });
      fetchData();
    } catch {
      // ignore
    }
    setPublishing(null);
  };

  const publishAll = async () => {
    setPublishing('all');
    try {
      await apiFetch('/publishing/publish-all', { method: 'POST' });
      fetchData();
    } catch {
      // ignore
    }
    setPublishing(null);
  };

  if (!apiAvailable) {
    return (
      <div>
        <h1 className="text-2xl font-heading font-bold mb-6">Publishing</h1>
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-secondary" />
          <p className="text-textMuted">Publishing API not available</p>
          <button onClick={fetchData} className="px-4 py-2 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const unpublished = changes.filter(c => c.status !== 'published');

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Publishing</h1>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Unpublished Changes
          </h2>
          <div className="flex gap-2">
            <button
              onClick={checkForChanges}
              disabled={checking}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> Check for Changes
            </button>
            {unpublished.length > 0 && (
              <button
                onClick={publishAll}
                disabled={publishing === 'all'}
                className="flex items-center gap-2 px-4 py-2 bg-success/20 border border-success text-success rounded-xl text-sm font-bold hover:bg-success/30 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Publish All ({unpublished.length})
              </button>
            )}
          </div>
        </div>
        <DataTable<PublishChange>
          columns={[
            { key: 'entityType', label: 'Type', render: (item: PublishChange) => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${typeBadgeStyles[item.entityType] || 'bg-surface text-textMuted'}`}>
                {item.entityType}
              </span>
            )},
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status', render: (item: PublishChange) => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${statusStyles[item.status] || 'bg-surface text-textMuted'}`}>
                {item.status}
              </span>
            )},
            { key: 'lastPublished', label: 'Last Published', render: (item: PublishChange) => (
              item.lastPublished ? new Date(item.lastPublished).toLocaleDateString() : '—'
            )},
          ]}
          data={unpublished}
          loading={loading}
          onRefresh={fetchData}
          keyField="entityId"
          emptyMessage="All content is published!"
          actions={(item: unknown) => {
            const c = item as PublishChange;
            return (
              <button
                onClick={() => publishItem(c.entityType, c.entityId)}
                disabled={publishing === c.entityId}
                className="flex items-center gap-1 px-3 py-1.5 bg-success/20 border border-success text-success rounded-lg text-xs font-bold hover:bg-success/30 transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> {publishing === c.entityId ? 'Publishing...' : 'Publish'}
              </button>
            );
          }}
        />
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-textMuted" /> Publish History
        </h2>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-textMuted text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Items Published</th>
                <th className="px-4 py-3 text-left">Types</th>
              </tr>
            </thead>
            <tbody>
              {history.map((event, idx) => (
                <tr key={idx} className="border-b border-border/40 hover:bg-surface/30 transition-colors">
                  <td className="px-4 py-3">{new Date(event.date).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold">{event.count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {event.types.map(t => (
                        <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${typeBadgeStyles[t] || 'bg-surface text-textMuted'}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-textMuted">No publish history yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
