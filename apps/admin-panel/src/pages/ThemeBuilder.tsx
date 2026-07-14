import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Palette,
} from "lucide-react";
import { apiFetch } from "../api";

interface ThemeBuilderProps {
  themeId?: string;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  success: string;
  danger: string;
  border: string;
  textMuted: string;
}

interface ThemeForm {
  name: string;
  description: string;
  colors: ThemeColors;
  isDefault: boolean;
  isPublished: boolean;
}

const defaultColors: ThemeColors = {
  primary: "#2F80ED",
  secondary: "#FF6B00",
  background: "#0F172A",
  surface: "#1E293B",
  success: "#22C55E",
  danger: "#EF4444",
  border: "#334155",
  textMuted: "#94A3B8",
};

const colorLabels: Record<keyof ThemeColors, string> = {
  primary: "Primary",
  secondary: "Secondary",
  background: "Background",
  surface: "Surface",
  success: "Success",
  danger: "Danger",
  border: "Border",
  textMuted: "Text Muted",
};

const defaultForm: ThemeForm = {
  name: "",
  description: "",
  colors: { ...defaultColors },
  isDefault: false,
  isPublished: false,
};

export default function ThemeBuilder({ themeId }: ThemeBuilderProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ThemeForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!themeId);

  useEffect(() => {
    if (!themeId) return;
    apiFetch(`/themes/${themeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.theme) {
          setForm({
            ...data.theme,
            colors: { ...defaultColors, ...data.theme.colors },
          });
        }
      })
      .finally(() => setLoading(false));
  }, [themeId]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setForm({
      ...form,
      colors: { ...form.colors, [key]: value },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (themeId) {
        await apiFetch(`/themes/${themeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      navigate('/themes');
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#94A3B8]">Loading...</div>
      </div>
    );
  }

  const c = form.colors;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/themes')} className="p-2 hover:bg-[#334155] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#94A3B8]" />
          </button>
          <Palette className="w-6 h-6 text-[#2F80ED]" />
          <h1 className="text-2xl font-bold text-white">
            {themeId ? "Edit Theme" : "New Theme"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/themes')}
            className="px-4 py-2 text-[#94A3B8] hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2568c4] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Color Pickers */}
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Theme Info</h2>
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
                  rows={2}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2F80ED] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Colors</h2>
            <div className="space-y-4">
              {(Object.keys(defaultColors) as (keyof ThemeColors)[]).map((key) => (
                <div key={key} className="flex items-center gap-4">
                  <input
                    type="color"
                    value={c[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-12 rounded-lg border border-[#334155] cursor-pointer bg-transparent shrink-0"
                  />
                  <div className="flex-1">
                    <label className="block text-sm text-[#94A3B8]">{colorLabels[key]}</label>
                    <input
                      type="text"
                      value={c[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-[#2F80ED]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Live Preview</h2>

          {/* Button Preview */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 mb-4">
            <h3 className="text-sm font-medium text-[#94A3B8] mb-3">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: c.primary }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: c.secondary }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: c.success }}
              >
                Success
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: c.danger }}
              >
                Danger
              </button>
            </div>
          </div>

          {/* Card Preview */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}
          >
            <h3 className="text-sm font-medium mb-2" style={{ color: c.textMuted }}>Card Component</h3>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: c.background }}
            >
              <h4 className="font-semibold text-white mb-1">Card Title</h4>
              <p className="text-sm" style={{ color: c.textMuted }}>
                This is a card preview rendered with your theme colors.
              </p>
            </div>
          </div>

          {/* Table Row Preview */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: `1px solid ${c.border}` }}
          >
            <h3 className="text-sm font-medium p-3" style={{ color: c.textMuted, backgroundColor: c.surface }}>
              Table Row
            </h3>
            <div
              className="flex items-center justify-between p-3"
              style={{ backgroundColor: c.background }}
            >
              <div>
                <div className="text-sm text-white font-medium">Player Name</div>
                <div className="text-xs" style={{ color: c.textMuted }}>Last seen 2 min ago</div>
              </div>
              <div className="flex gap-2">
                <span
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: c.success }}
                >
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Badge Preview */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}
          >
            <h3 className="text-sm font-medium mb-3" style={{ color: c.textMuted }}>Badges</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Primary", bg: c.primary },
                { label: "Secondary", bg: c.secondary },
                { label: "Success", bg: c.success },
                { label: "Danger", bg: c.danger },
                { label: "Muted", bg: c.textMuted },
              ].map(({ label, bg }) => (
                <span
                  key={label}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: bg }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Full Mockup */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${c.border}` }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: c.surface }}>
              <span className="font-bold text-white">Battle Jets</span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: c.primary }}
                >
                  Play
                </button>
                <button
                  className="px-3 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: c.background, color: c.textMuted }}
                >
                  Settings
                </button>
              </div>
            </div>
            <div className="p-5" style={{ backgroundColor: c.background }}>
              <h4 className="text-white font-medium mb-2">Lobby</h4>
              <div
                className="rounded-lg p-4 mb-3"
                style={{ backgroundColor: c.surface }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Team Deathmatch</span>
                  <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: c.secondary }}>
                    8/12
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.border }}>
                  <div className="h-full rounded-full" style={{ width: "66%", backgroundColor: c.success }} />
                </div>
              </div>
              <p className="text-xs" style={{ color: c.textMuted }}>
                Full lobby mockup using your theme colors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
