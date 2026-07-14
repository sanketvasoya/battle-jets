import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Gamepad2,
} from "lucide-react";
import { apiFetch } from "../api";
import DataTable from "../components/DataTable";
import Modal, {
  InputField,
  SelectField,
  ToggleField,
} from "../components/Modal";

interface GameMode {
  _id: string;
  name: string;
  description: string;
  timer: number;
  maxPlayers: number;
  minPlayers: number;
  scoringType: string;
  rules: Record<string, unknown>;
  isActive: boolean;
  isPublished: boolean;
}

const emptyForm: Partial<GameMode> = {
  name: "",
  description: "",
  timer: 300,
  maxPlayers: 12,
  minPlayers: 2,
  scoringType: "kills",
  rules: {},
  isActive: false,
  isPublished: false,
};

export default function GameModeList() {
  const [modes, setModes] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GameMode | null>(null);
  const [form, setForm] = useState<Partial<GameMode>>(emptyForm);
  const [rulesStr, setRulesStr] = useState("{}");
  const [rulesError, setRulesError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchModes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/gamemodes");
      const data = await res.json();
      if (data.success) setModes(data.gameModes);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModes();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setRulesStr("{}");
    setRulesError("");
    setModalOpen(true);
  };

  const openEdit = (mode: GameMode) => {
    setEditing(mode);
    const { rules, ...rest } = mode;
    setForm(rest);
    setRulesStr(JSON.stringify(rules ?? {}, null, 2));
    setRulesError("");
    setModalOpen(true);
  };

  const handleRulesChange = (val: string) => {
    setRulesStr(val);
    try {
      JSON.parse(val);
      setRulesError("");
    } catch (e: unknown) {
      setRulesError((e as Error).message);
    }
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
      if (editing) {
        await apiFetch(`/gamemodes/${editing._id}`, {
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
      setModalOpen(false);
      fetchModes();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this game mode?")) return;
    await apiFetch(`/gamemodes/${id}`, { method: "DELETE" });
    fetchModes();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-[#2F80ED]" />
          <h1 className="text-2xl font-bold text-white">Game Modes</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2568c4] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Game Mode
        </button>
      </div>

      <DataTable<GameMode>
        columns={[
          { key: "name", label: "Name", render: (item: GameMode) => <span className="font-medium text-white">{item.name}</span> },
          { key: "description", label: "Description", render: (item: GameMode) => <span className="text-[#94A3B8] text-sm">{item.description}</span> },
          {
            key: "timer",
            label: "Timer",
            render: (item: GameMode) => (
              <span className="text-[#94A3B8] font-mono text-sm">{formatTimer(item.timer)}</span>
            ),
          },
          { key: "maxPlayers", label: "Max Players" },
          { key: "scoringType", label: "Scoring Type", render: (item: GameMode) => <span className="px-2 py-1 rounded bg-[#334155] text-[#94A3B8] text-xs">{item.scoringType}</span> },
          {
            key: "isActive",
            label: "Active",
            render: (item: GameMode) => (
              <span className={`inline-block w-2 h-2 rounded-full ${item.isActive ? "bg-[#22C55E]" : "bg-[#334155]"}`} />
            ),
          },
          {
            key: "isPublished",
            label: "Published",
            render: (item: GameMode) => (
              <span className={`inline-block w-2 h-2 rounded-full ${item.isPublished ? "bg-[#22C55E]" : "bg-[#334155]"}`} />
            ),
          },
          {
            key: "_id",
            label: "Actions",
            render: (item: GameMode) => (
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-[#334155] rounded transition-colors">
                  <Pencil className="w-4 h-4 text-[#94A3B8]" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-1.5 hover:bg-[#334155] rounded transition-colors">
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </button>
              </div>
            ),
          },
        ]}
        data={modes}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Game Mode" : "Add Game Mode"}
        onSave={handleSave}
        saving={saving}
      >
        <div className="space-y-4">
          <InputField
            label="Name"
            value={form.name ?? ""}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <InputField
            label="Description"
            value={form.description ?? ""}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div className="grid grid-cols-3 gap-4">
            <InputField
              label="Timer (seconds)"
              type="number"
              value={String(form.timer ?? 300)}
              onChange={(v) => setForm({ ...form, timer: Number(v) })}
            />
            <InputField
              label="Max Players"
              type="number"
              value={String(form.maxPlayers ?? 12)}
              onChange={(v) => setForm({ ...form, maxPlayers: Number(v) })}
            />
            <InputField
              label="Min Players"
              type="number"
              value={String(form.minPlayers ?? 2)}
              onChange={(v) => setForm({ ...form, minPlayers: Number(v) })}
            />
          </div>
          <SelectField
            label="Scoring Type"
            value={form.scoringType ?? "kills"}
            options={[
              { value: "kills", label: "Kills" },
              { value: "team_kills", label: "Team Kills" },
              { value: "survival", label: "Survival" },
              { value: "objective", label: "Objective" },
            ]}
            onChange={(v) => setForm({ ...form, scoringType: v })}
          />
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Rules (JSON)</label>
            <textarea
              value={rulesStr}
              onChange={(e) => handleRulesChange(e.target.value)}
              className="w-full h-32 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#2F80ED]"
              spellCheck={false}
            />
            {rulesError && <p className="text-[#EF4444] text-xs mt-1">{rulesError}</p>}
          </div>
          <div className="flex gap-6">
            <ToggleField
              label="Active"
              value={form.isActive ?? false}
              onChange={(v) => setForm({ ...form, isActive: v })}
            />
            <ToggleField
              label="Published"
              value={form.isPublished ?? false}
              onChange={(v) => setForm({ ...form, isPublished: v })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
