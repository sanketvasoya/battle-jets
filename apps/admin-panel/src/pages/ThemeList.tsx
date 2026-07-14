import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Palette,
} from "lucide-react";
import { apiFetch } from "../api";
import DataTable from "../components/DataTable";
import Modal, {
  InputField,
  ToggleField,
} from "../components/Modal";

interface ThemeColor {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  success: string;
  danger: string;
  border: string;
  textMuted: string;
}

interface Theme {
  _id: string;
  name: string;
  description: string;
  colors: ThemeColor;
  isDefault: boolean;
  isPublished: boolean;
}

const defaultColors: ThemeColor = {
  primary: "#2F80ED",
  secondary: "#FF6B00",
  background: "#0F172A",
  surface: "#1E293B",
  success: "#22C55E",
  danger: "#EF4444",
  border: "#334155",
  textMuted: "#94A3B8",
};

const emptyForm: Partial<Theme> = {
  name: "",
  description: "",
  colors: { ...defaultColors },
  isDefault: false,
  isPublished: false,
};

const colorKeys: (keyof ThemeColor)[] = [
  "primary",
  "secondary",
  "background",
  "surface",
  "success",
  "danger",
  "border",
  "textMuted",
];

export default function ThemeList() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Theme | null>(null);
  const [form, setForm] = useState<Partial<Theme>>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/themes");
      const data = await res.json();
      if (data.success) setThemes(data.themes);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, colors: { ...defaultColors } });
    setModalOpen(true);
  };

  const openEdit = (theme: Theme) => {
    setEditing(theme);
    setForm({
      ...theme,
      colors: { ...defaultColors, ...theme.colors },
    });
    setModalOpen(true);
  };

  const handleColorChange = (key: keyof ThemeColor, value: string) => {
    setForm({
      ...form,
      colors: { ...form.colors!, [key]: value },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/themes/${editing._id}`, {
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
      setModalOpen(false);
      fetchThemes();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this theme?")) return;
    await apiFetch(`/themes/${id}`, { method: "DELETE" });
    fetchThemes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-[#2F80ED]" />
          <h1 className="text-2xl font-bold text-white">Themes</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2568c4] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Theme
        </button>
      </div>

      <DataTable<Theme>
        columns={[
          { key: "name", label: "Name", render: (item: Theme) => <span className="font-medium text-white">{item.name}</span> },
          { key: "description", label: "Description", render: (item: Theme) => <span className="text-[#94A3B8] text-sm">{item.description}</span> },
          {
            key: "colors",
            label: "Colors",
            render: (item: Theme) => (
              <div className="flex gap-1">
                {item.colors && colorKeys.map((k) => (
                  <div
                    key={k}
                    className="w-5 h-5 rounded-full border border-[#334155]"
                    style={{ backgroundColor: item.colors[k] }}
                    title={`${k}: ${item.colors[k]}`}
                  />
                ))}
              </div>
            ),
          },
          {
            key: "isDefault",
            label: "Default",
            render: (item: Theme) => (
              <span className={`inline-block w-2 h-2 rounded-full ${item.isDefault ? "bg-[#22C55E]" : "bg-[#334155]"}`} />
            ),
          },
          {
            key: "isPublished",
            label: "Published",
            render: (item: Theme) => (
              <span className={`inline-block w-2 h-2 rounded-full ${item.isPublished ? "bg-[#22C55E]" : "bg-[#334155]"}`} />
            ),
          },
          {
            key: "_id",
            label: "Actions",
            render: (item: Theme) => (
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
        data={themes}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Theme" : "Add Theme"}
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
          <ToggleField
            label="Default Theme"
            value={form.isDefault ?? false}
            onChange={(v) => setForm({ ...form, isDefault: v })}
          />
          <ToggleField
            label="Published"
            value={form.isPublished ?? false}
            onChange={(v) => setForm({ ...form, isPublished: v })}
          />

          <div className="pt-2">
            <h3 className="text-sm font-medium text-white mb-3">Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              {colorKeys.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.[key] ?? "#000000"}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded border border-[#334155] cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <label className="block text-xs text-[#94A3B8] capitalize">
                      {key === "textMuted" ? "Text Muted" : key}
                    </label>
                    <input
                      type="text"
                      value={form.colors?.[key] ?? ""}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#2F80ED]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
