import { useState, useEffect } from 'react'
import { Pencil, Trash2, Target } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField, SelectField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Crosshair } from '../types'

interface CrosshairFormData {
  id: string
  name: string
  style: string
  color: string
  size: number
  thickness: number
  gap: number
  dot: boolean
  isDefault: boolean
  isPublished: boolean
}

const defaultForm: CrosshairFormData = {
  id: '',
  name: '',
  style: 'cross',
  color: '#FFFFFF',
  size: 24,
  thickness: 2,
  gap: 4,
  dot: false,
  isDefault: false,
  isPublished: false,
}

const styleOptions = [
  { value: 'cross', label: 'Cross' },
  { value: 'dot', label: 'Dot' },
  { value: 'circle', label: 'Circle' },
  { value: 'crosshair_dot', label: 'Crosshair + Dot' },
]

function CrosshairPreview({ form, size = 64 }: { form: CrosshairFormData; size?: number }) {
  const half = size / 2
  const armLen = form.size / 2
  const armW = form.thickness
  const dotSize = Math.max(2, form.thickness + 1)

  return (
    <div
      className="relative bg-[#0F172A] border border-[#334155] rounded-lg flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {(form.style === 'cross' || form.style === 'crosshair_dot') && (
        <>
          <div className="absolute" style={{ left: half - form.gap - armLen, top: half - armW / 2, width: armLen, height: armW, backgroundColor: form.color }} />
          <div className="absolute" style={{ left: half + form.gap, top: half - armW / 2, width: armLen, height: armW, backgroundColor: form.color }} />
          <div className="absolute" style={{ left: half - armW / 2, top: half - form.gap - armLen, width: armW, height: armLen, backgroundColor: form.color }} />
          <div className="absolute" style={{ left: half - armW / 2, top: half + form.gap, width: armW, height: armLen, backgroundColor: form.color }} />
        </>
      )}
      {form.style === 'circle' && (
        <div
          className="absolute rounded-full"
          style={{ width: form.size, height: form.size, border: `${form.thickness}px solid ${form.color}`, backgroundColor: 'transparent' }}
        />
      )}
      {(form.style === 'dot' || form.style === 'crosshair_dot') && (
        <div className="absolute rounded-full" style={{ width: dotSize, height: dotSize, backgroundColor: form.color }} />
      )}
    </div>
  )
}

export default function CrosshairList() {
  const [crosshairs, setCrosshairs] = useState<Crosshair[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Crosshair | null>(null)
  const [formData, setFormData] = useState<CrosshairFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Crosshair | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/crosshairs')
      if (res.success) setCrosshairs(res.crosshairs)
    } catch (err) {
      console.error('Failed to load crosshairs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditing(null)
    setFormData(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (c: Crosshair) => {
    setEditing(c)
    setFormData({
      id: c.id,
      name: c.name,
      style: c.style,
      color: c.color,
      size: c.size,
      thickness: c.thickness,
      gap: c.gap,
      dot: c.dot,
      isDefault: c.isDefault,
      isPublished: c.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await apiFetch(`/crosshairs/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) setCrosshairs(res.crosshairs)
      } else {
        const res = await apiFetch('/crosshairs', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) setCrosshairs(res.crosshairs)
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save crosshair', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Crosshair) => {
    try {
      const res = await apiFetch(`/crosshairs/${c.id}`, { method: 'DELETE' })
      if (res.success) setCrosshairs(res.crosshairs)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete crosshair', err)
    }
  }

  const updateField = <K extends keyof CrosshairFormData>(key: K, value: CrosshairFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const columns = [
    { key: 'name', label: 'Name', render: (c: Crosshair) => <span className="font-medium text-white">{c.name}</span> },
    { key: 'style', label: 'Style', render: (c: Crosshair) => <span className="text-[#94A3B8] capitalize">{c.style}</span> },
    {
      key: 'color', label: 'Color',
      render: (c: Crosshair) => (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[#334155]" style={{ backgroundColor: c.color }} />
          <span className="text-[#94A3B8] font-mono text-xs">{c.color}</span>
        </div>
      ),
    },
    { key: 'size', label: 'Size', render: (c: Crosshair) => <span className="text-[#94A3B8]">{c.size}</span> },
    {
      key: 'isDefault', label: 'Default',
      render: (c: Crosshair) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isDefault ? 'bg-[#2F80ED]/20 text-[#2F80ED]' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {c.isDefault ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isPublished', label: 'Published',
      render: (c: Crosshair) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {c.isPublished ? 'Live' : 'Draft'}
        </span>
      ),
    },
  ]

  const renderActions = (c: Crosshair) => (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors" title="Edit">
        <Pencil size={16} />
      </button>
      <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-red-400 transition-colors" title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Target className="text-[#FF6B00]" size={28} />
          <h1 className="text-2xl font-bold text-white">Crosshairs</h1>
        </div>

        <DataTable<Crosshair>
          columns={columns}
          data={crosshairs}
          loading={loading}
          onRefresh={fetchData}
          onAdd={openCreate}
          addLabel="Add Crosshair"
          actions={renderActions}
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'New Crosshair'} onSave={handleSave} saving={saving} wide>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="My Crosshair" />
            <SelectField label="Style" value={formData.style} onChange={(v) => updateField('style', v)} options={styleOptions} />
            <InputField label="Color" value={formData.color} onChange={(v) => updateField('color', v)} />
            <InputField label="Size" type="number" value={formData.size} onChange={(v) => updateField('size', Number(v))} />
            <InputField label="Thickness" type="number" value={formData.thickness} onChange={(v) => updateField('thickness', Number(v))} />
            <InputField label="Gap" type="number" value={formData.gap} onChange={(v) => updateField('gap', Number(v))} />
            <ToggleField label="Center Dot" value={formData.dot} onChange={(v) => updateField('dot', v)} />
            <ToggleField label="Default" value={formData.isDefault} onChange={(v) => updateField('isDefault', v)} />
            <div className="col-span-2">
              <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#334155]/50">
            <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-2">Preview</label>
            <div className="flex items-center gap-4">
              <CrosshairPreview form={formData} size={64} />
              <CrosshairPreview form={formData} size={32} />
              <CrosshairPreview form={formData} size={16} />
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Crosshair">
          <p className="text-[#94A3B8]">
            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#334155]/50">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
              Cancel
            </button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors">
              Delete
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
