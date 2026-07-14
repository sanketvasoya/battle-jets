import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
} from "lucide-react";
import { apiFetch } from "../api";
import { InputField, ToggleField } from "../components/Modal";

interface Setting {
  key: string;
  value: string | boolean | number;
  type: string;
  label: string;
}

const typeLabels: Record<string, string> = {
  server_name: "Server Name",
  max_concurrent_matches: "Max Concurrent Matches",
  enable_registration: "Enable Registration",
  maintenance_mode: "Maintenance Mode",
  content_version: "Content Version",
};

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [original, setOriginal] = useState<Record<string, string | boolean | number>>({});
  const [values, setValues] = useState<Record<string, string | boolean | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const map: Record<string, string | boolean | number> = {};
        for (const s of data.settings) {
          map[s.key] = s.value;
        }
        setOriginal(map);
        setValues(map);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateValue = (key: string, value: string | boolean | number) => {
    setValues({ ...values, [key]: value });
  };

  const hasChanges = Object.keys(values).some((k) => values[k] !== original[k]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        if (values[s.key] !== original[s.key]) {
          await apiFetch("/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: s.key, value: values[s.key] }),
          });
        }
      }
      fetchSettings();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#94A3B8]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-[#2F80ED]" />
          <h1 className="text-2xl font-bold text-white">Global Settings</h1>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2568c4] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
        <div className="space-y-6">
          {settings.map((s) => (
            <div key={s.key} className="border-b border-[#334155] last:border-0 pb-5 last:pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-white">
                    {typeLabels[s.key] ?? s.key}
                  </label>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{s.key}</p>
                </div>
                <div className="w-64">
                  {s.type === "toggle" || s.type === "boolean" || typeof s.value === "boolean" ? (
                    <ToggleField
                      label=""
                      value={!!values[s.key]}
                      onChange={(v) => updateValue(s.key, v)}
                    />
                  ) : s.type === "number" ? (
                    <InputField
                      label=""
                      type="number"
                      value={String(values[s.key] ?? "")}
                      onChange={(v) => updateValue(s.key, Number(v))}
                    />
                  ) : s.key === "content_version" ? (
                    <InputField
                      label=""
                      value={String(values[s.key] ?? "")}
                      onChange={() => {}}
                    />
                  ) : (
                    <InputField
                      label=""
                      value={String(values[s.key] ?? "")}
                      onChange={(v) => updateValue(s.key, v)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
