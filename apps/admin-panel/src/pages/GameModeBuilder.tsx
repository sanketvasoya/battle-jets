import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Swords,
  Clock,
  Users,
  Target,
  Zap,
  Skull,
  Shield,
  Gamepad,
} from "lucide-react";
import { apiFetch } from "../api";

interface GameModeBuilderProps {
  gameModeId?: string;
}

interface Form {
  name: string;
  description: string;
  timer: number;
  maxPlayers: number;
  minPlayers: number;
  scoringType: string;
}

interface RuleTemplate {
  label: string;
  icon: React.ReactNode;
  rules: Record<string, unknown>;
}

const defaultForm: Form = {
  name: "",
  description: "",
  timer: 300,
  maxPlayers: 12,
  minPlayers: 2,
  scoringType: "kills",
};

const templates: RuleTemplate[] = [
  {
    label: "Standard Deathmatch",
    icon: <Swords className="w-4 h-4" />,
    rules: {
      friendlyFire: false,
      respawnEnabled: true,
      respawnDelay: 5,
      killScore: 1,
      deathPenalty: 0,
      timeBonus: 0,
      powerUps: true,
      maxKills: 50,
    },
  },
  {
    label: "No Respawn",
    icon: <Skull className="w-4 h-4" />,
    rules: {
      friendlyFire: false,
      respawnEnabled: false,
      respawnDelay: 0,
      killScore: 5,
      deathPenalty: -2,
      timeBonus: 0,
      powerUps: false,
      maxKills: 0,
    },
  },
  {
    label: "Team Battle",
    icon: <Shield className="w-4 h-4" />,
    rules: {
      friendlyFire: false,
      respawnEnabled: true,
      respawnDelay: 10,
      killScore: 1,
      deathPenalty: 0,
      timeBonus: 5,
      powerUps: true,
      teamBased: true,
      maxKills: 100,
    },
  },
];

export default function GameModeBuilder({ gameModeId }: GameModeBuilderProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(defaultForm);
  const [rulesStr, setRulesStr] = useState("{}");
  const [rulesError, setRulesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!gameModeId);

  useEffect(() => {
    if (!gameModeId) return;
    apiFetch(`/gamemodes/${gameModeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.gameMode) {
          const { rules, ...rest } = data.gameMode;
          setForm(rest);
          setRulesStr(JSON.stringify(rules ?? {}, null, 2));
        }
      })
      .finally(() => setLoading(false));
  }, [gameModeId]);

  const handleRulesChange = (val: string) => {
    setRulesStr(val);
    try {
      JSON.parse(val);
      setRulesError("");
    } catch (e: unknown) {
      setRulesError((e as Error).message);
    }
  };

  const applyTemplate = (rules: Record<string, unknown>) => {
    const str = JSON.stringify(rules, null, 2);
    setRulesStr(str);
    setRulesError("");
  };

  const handleSave = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rulesStr);
    } catch {
      return;
    }
    setSaving(true);
    try {
      if (gameModeId) {
        await apiFetch(`/gamemodes/${gameModeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, rules: parsed }),
        });
      } else {
        await apiFetch("/gamemodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, rules: parsed }),
        });
      }
      navigate('/gamemodes');
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const scoringLabels: Record<string, string> = {
    kills: "Kills",
    team_kills: "Team Kills",
    survival: "Survival",
    objective: "Objective",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#94A3B8]">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/gamemodes')} className="p-2 hover:bg-[#334155] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#94A3B8]" />
          </button>
          <Gamepad className="w-6 h-6 text-[#2F80ED]" />
          <h1 className="text-2xl font-bold text-white">
            {gameModeId ? "Edit Game Mode" : "New Game Mode"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/gamemodes')}
            className="px-4 py-2 text-[#94A3B8] hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!rulesError}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2568c4] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Form Fields */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Timer (seconds)</label>
              <input
                type="number"
                value={form.timer}
                onChange={(e) => setForm({ ...form, timer: Number(e.target.value) })}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Min Players</label>
                <input
                  type="number"
                  value={form.minPlayers}
                  onChange={(e) => setForm({ ...form, minPlayers: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Max Players</label>
                <input
                  type="number"
                  value={form.maxPlayers}
                  onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Scoring Type</label>
              <select
                value={form.scoringType}
                onChange={(e) => setForm({ ...form, scoringType: e.target.value })}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED]"
              >
                <option value="kills">Kills</option>
                <option value="team_kills">Team Kills</option>
                <option value="survival">Survival</option>
                <option value="objective">Objective</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center: Rules JSON Editor */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Rules JSON</h2>
          <textarea
            value={rulesStr}
            onChange={(e) => handleRulesChange(e.target.value)}
            className="flex-1 min-h-[300px] w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-green-400 font-mono text-sm focus:outline-none focus:border-[#2F80ED] resize-none"
            spellCheck={false}
          />
          {rulesError && (
            <p className="text-[#EF4444] text-xs mt-2">JSON Error: {rulesError}</p>
          )}

          <div className="mt-4">
            <h3 className="text-sm font-medium text-[#94A3B8] mb-2">Quick Rule Templates</h3>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t.rules)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] border border-[#334155] hover:border-[#2F80ED] rounded-lg text-sm text-[#94A3B8] hover:text-white transition-colors"
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview Card */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Lobby Preview</h2>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#2F80ED] to-[#1a5cb8] px-5 py-4">
              <h3 className="text-xl font-bold text-white">
                {form.name || "Untitled Mode"}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[#94A3B8] text-sm">
                {form.description || "No description"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-[#2F80ED]" />
                  <span className="text-white">{form.minPlayers}-{form.maxPlayers}</span>
                  <span className="text-[#94A3B8]">players</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[#2F80ED]" />
                  <span className="text-white font-mono">{formatTimer(form.timer)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-[#2F80ED]" />
                  <span className="text-white">{scoringLabels[form.scoringType] ?? form.scoringType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-[#2F80ED]" />
                  <span className="text-[#94A3B8]">
                    {(() => {
                      try {
                        const rules = JSON.parse(rulesStr);
                        const count = Object.keys(rules).length;
                        return `${count} rule${count !== 1 ? "s" : ""}`;
                      } catch {
                        return "invalid JSON";
                      }
                    })()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Rules Preview</span>
                  <span className="text-xs text-[#94A3B8]">Top 3 keys:</span>
                </div>
                <div className="mt-2 space-y-1">
                  {(() => {
                    try {
                      const rules = JSON.parse(rulesStr);
                      return Object.entries(rules)
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-[#94A3B8]">{key}</span>
                            <span className="text-white font-mono">{String(val)}</span>
                          </div>
                        ));
                    } catch {
                      return <span className="text-[#EF4444] text-xs">Invalid JSON</span>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
