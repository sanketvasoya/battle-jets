import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, PlayCircle, Code2, BookOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { apiFetch } from '../api';
import { SelectField } from '../components/Modal';
import type { Script } from '../types';

interface ScriptEditorProps {
  scriptId?: string;
}

const SCRIPT_TYPES = [
  { value: 'weapon_behavior', label: 'Weapon Behavior' },
  { value: 'power_up_effect', label: 'Power-Up Effect' },
  { value: 'game_mode_logic', label: 'Game Mode Logic' },
  { value: 'custom_rule', label: 'Custom Rule' },
];

const API_REFERENCE = [
  { method: 'onShoot(player, weapon, pos, dir)', desc: 'Fired when a player shoots' },
  { method: 'onHit(projectile, target, damage)', desc: 'Fired when a projectile hits' },
  { method: 'onKill(killer, victim, weapon)', desc: 'Fired when a player is killed' },
  { method: 'onDeath(player, cause)', desc: 'Fired when a player dies' },
  { method: 'onPickup(player, powerUp)', desc: 'Fired when a player picks up a power-up' },
  { method: 'onTick(deltaTime)', desc: 'Called every frame' },
  { method: 'api.createProjectile(config)', desc: 'Spawn a projectile' },
  { method: 'api.dealDamage(playerId, amt)', desc: 'Deal damage to a player' },
  { method: 'api.healPlayer(playerId, amt)', desc: 'Heal a player' },
  { method: 'api.getPlayersInRadius(pos, r)', desc: 'Get players within a radius' },
  { method: 'api.spawnEffect(type, pos, dur)', desc: 'Spawn a visual effect' },
  { method: 'api.distance(a, b)', desc: 'Distance between two points' },
  { method: 'api.notifyPlayer(id, msg)', desc: 'Send a notification to a player' },
];

export default function ScriptEditor({ scriptId }: ScriptEditorProps) {
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('weapon_behavior');
  const [language] = useState('javascript');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!scriptId);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptId) return;
    setLoading(true);
    apiFetch(`/scripts/${scriptId}`)
      .then((data: { script: Script }) => {
        const s = data.script;
        setName(s.name);
        setType(s.type);
        setCode(s.code);
        setVersion(s.version);
      })
      .catch(err => console.error('Failed to load script', err))
      .finally(() => setLoading(false));
  }, [scriptId]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
      interface ProjectileConfig {
        ownerId: string;
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        weapon: string;
        damage?: number;
      }
      interface EffectConfig {
        type: string;
        position: { x: number; y: number };
        duration: number;
      }
      declare const api: {
        createProjectile(config: ProjectileConfig): void;
        dealDamage(playerId: string, amount: number): void;
        healPlayer(playerId: string, amount: number): void;
        getPlayersInRadius(position: { x: number; y: number }, radius: number): any[];
        spawnEffect(type: string, position: { x: number; y: number }, duration: number): void;
        distance(a: { x: number; y: number }, b: { x: number; y: number }): number;
        notifyPlayer(playerId: string, message: string): void;
      };
      declare function onShoot(player: any, weapon: string, position: { x: number; y: number }, direction: { x: number; y: number }): void;
      declare function onHit(projectile: any, target: any, damage: number): void;
      declare function onKill(killer: any, victim: any, weapon: string): void;
      declare function onDeath(player: any, cause: string): void;
      declare function onPickup(player: any, powerUp: any): void;
      declare function onTick(deltaTime: number): void;
    `, 'ts:game-api.d.ts');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const body = { name, type, language, code };
      if (scriptId) {
        await apiFetch(`/scripts/${scriptId}`, { method: 'PUT', body: JSON.stringify(body) });
        setVersion(v => v + 1);
      } else {
        await apiFetch('/scripts', { method: 'POST', body: JSON.stringify(body) });
      }
      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save script', err);
      setSaveMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = () => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    const markers = (window as any).monaco?.editor?.getModelMarkers?.({}) || [];
    const errors = markers.filter((m: any) => m.severity === 8);
    if (errors.length > 0) {
      setValidationError(`${errors.length} error(s): ${errors[0].message}`);
    } else {
      setValidationError(null);
      setSaveMessage('Syntax check passed');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-textMuted">Loading script...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface text-textMuted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Code2 className="text-secondary" size={28} />
          <h1 className="text-2xl font-heading font-bold">{scriptId ? 'Edit Script' : 'New Script'}</h1>
          <span className="text-xs text-textMuted bg-surface px-2 py-0.5 rounded">v{version}</span>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('failed') || saveMessage.includes('error') ? 'text-danger' : 'text-success'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleValidate}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-textMuted hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlayCircle size={16} /> Check Syntax
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my_script"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder:text-textMuted/50"
          />
        </div>
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          options={SCRIPT_TYPES}
        />
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Language</label>
          <div className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textMuted">
            JavaScript
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mb-3 px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger flex-shrink-0">
          {validationError}
        </div>
      )}

      {/* Editor + Reference */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 border border-border rounded-xl overflow-hidden bg-[#0B1120]">
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={v => { setCode(v || ''); setValidationError(null); }}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              padding: { top: 12, bottom: 12 },
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <p className="text-textMuted">Loading editor...</p>
              </div>
            }
          />
        </div>

        {/* API Reference sidebar */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-primary" />
              <h3 className="text-sm font-bold">API Reference</h3>
            </div>
            <div className="space-y-3">
              {API_REFERENCE.map(ref => (
                <div key={ref.method} className="group cursor-default">
                  <code className="block text-xs text-secondary font-mono break-all leading-tight">
                    {ref.method}
                  </code>
                  <p className="text-[11px] text-textMuted mt-0.5">{ref.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
