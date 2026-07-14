import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Eye, FlaskConical, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';
import DataTable from '../components/DataTable';
import Modal, { InputField, SelectField, ToggleField } from '../components/Modal';

interface TestSession {
  id: string;
  map: string;
  mode: string;
  status: string;
  players: number;
  maxPlayers: number;
}

interface TestResult {
  id: string;
  sessionId: string;
  map: string;
  mode: string;
  duration: number;
  players: number;
  result: 'pass' | 'fail';
}

interface TestConfig {
  mapId: string;
  modeId: string;
  maxPlayers: number;
  autoStart: boolean;
}

export default function LiveTesting() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [maps, setMaps] = useState<{ id: string; name: string }[]>([]);
  const [gameModes, setGameModes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [config, setConfig] = useState<TestConfig>({
    mapId: '',
    modeId: '',
    maxPlayers: 2,
    autoStart: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, resultsRes, mapsRes, modesRes] = await Promise.all([
        apiFetch('/testing/sessions').catch(() => null),
        apiFetch('/testing/results').catch(() => null),
        apiFetch('/maps').catch(() => null),
        apiFetch('/gamemodes').catch(() => null),
      ]);

      if (sessionsRes) setSessions(sessionsRes.sessions || []);
      if (resultsRes) setResults(resultsRes.results || []);
      if (mapsRes) {
        setMaps((mapsRes.maps || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      }
      if (modesRes) {
        setGameModes((modesRes.gameModes || []).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })));
      }

      setApiAvailable(!!(sessionsRes || resultsRes));
    } catch {
      setApiAvailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startTest = async () => {
    if (!config.mapId || !config.modeId) return;
    setStarting(true);
    try {
      await apiFetch('/testing/start', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      setModalOpen(false);
      fetchData();
    } catch {
      // ignore
    }
    setStarting(false);
  };

  const stopSession = async (id: string) => {
    try {
      await apiFetch(`/testing/${id}/stop`, { method: 'POST' });
      fetchData();
    } catch {
      // ignore
    }
  };

  const spectateSession = (id: string) => {
    window.open(`/?spectate=${id}`, '_blank');
  };

  if (!apiAvailable) {
    return (
      <div>
        <h1 className="text-2xl font-heading font-bold mb-6">Live Testing</h1>
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-secondary" />
          <p className="text-textMuted">Testing API not available</p>
          <button onClick={fetchData} className="px-4 py-2 border border-border rounded-xl text-sm text-textMuted hover:text-white hover:border-primary transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Live Testing</h1>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-secondary" /> Active Test Sessions
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/20 border border-secondary text-secondary rounded-xl text-sm font-bold hover:bg-secondary/30 transition-all"
          >
            <Play className="w-4 h-4" /> Start Test Match
          </button>
        </div>
        <DataTable<TestSession>
          columns={[
            { key: 'id', label: 'Session', render: (item: TestSession) => <span className="font-mono text-xs">{item.id.slice(0, 8)}</span> },
            { key: 'map', label: 'Map' },
            { key: 'mode', label: 'Mode' },
            { key: 'status', label: 'Status', render: (item: TestSession) => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'running' ? 'bg-success/20 text-success' : 'bg-surface text-textMuted'}`}>
                {item.status}
              </span>
            )},
            { key: 'players', label: 'Players', render: (item: TestSession) => `${item.players}/${item.maxPlayers}` },
          ]}
          data={sessions}
          loading={loading}
          onRefresh={fetchData}
          keyField="id"
          emptyMessage="No active test sessions"
          actions={(item: unknown) => {
            const s = item as TestSession;
            return (
              <>
                <button onClick={() => spectateSession(s.id)} className="p-1.5 rounded-lg border border-border text-textMuted hover:text-primary hover:border-primary transition-all" title="Spectate">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => stopSession(s.id)} className="p-1.5 rounded-lg border border-border text-textMuted hover:text-danger hover:border-danger transition-all" title="Stop">
                  <Square className="w-4 h-4" />
                </button>
              </>
            );
          }}
        />
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold mb-4">Recent Test Results</h2>
        <DataTable<TestResult>
          columns={[
            { key: 'sessionId', label: 'Session', render: (item: TestResult) => <span className="font-mono text-xs">{item.sessionId.slice(0, 8)}</span> },
            { key: 'map', label: 'Map' },
            { key: 'mode', label: 'Mode' },
            { key: 'duration', label: 'Duration', render: (item: TestResult) => `${item.duration}s` },
            { key: 'players', label: 'Players' },
            { key: 'result', label: 'Result', render: (item: TestResult) => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.result === 'pass' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {item.result}
              </span>
            )},
          ]}
          data={results}
          loading={loading}
          keyField="id"
          emptyMessage="No test results yet"
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Start Test Match" onSave={startTest} saveLabel="Start" saving={starting}>
        <div className="space-y-4">
          <SelectField
            label="Map"
            value={config.mapId}
            onChange={(v) => setConfig({ ...config, mapId: v })}
            options={[{ value: '', label: 'Select a map...' }, ...maps.map(m => ({ value: m.id, label: m.name }))]}
          />
          <SelectField
            label="Game Mode"
            value={config.modeId}
            onChange={(v) => setConfig({ ...config, modeId: v })}
            options={[{ value: '', label: 'Select a mode...' }, ...gameModes.map(g => ({ value: g.id, label: g.name }))]}
          />
          <InputField
            label="Max Players"
            value={config.maxPlayers}
            onChange={(v) => setConfig({ ...config, maxPlayers: parseInt(v) || 2 })}
            type="number"
          />
          <ToggleField
            label="Auto-Start"
            value={config.autoStart}
            onChange={(v) => setConfig({ ...config, autoStart: v })}
          />
        </div>
      </Modal>
    </div>
  );
}
