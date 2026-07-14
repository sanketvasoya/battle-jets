import { useState, useEffect } from 'react'
import { Pencil, Trash2, Zap } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField, SelectField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { PowerUp } from '../types'

interface PowerUpFormData {
  id: string
  name: string
  description: string
  type: string
  duration: number
  magnitude: number
  effect: string
  color: string
  spawnWeight: number
  isActive: boolean
  isPublished: boolean
}

const defaultForm: PowerUpFormData = {
  id: '',
  name: '',
  description: '',
  type: 'health',
  duration: 10,
  magnitude: 1,
  effect: '',
  color: '#22C55E',
  spawnWeight: 1,
  isActive: true,
  isPublished: false,
}

const typeOptions = [
  { value: 'health', label: 'Health' },
  { value: 'speed', label: 'Speed' },
  { value: 'damage', label: 'Damage' },
  { value: 'shield', label: 'Shield' },
  { value: 'stealth', label: 'Stealth' },
]

export default function PowerUpList() {
  const [powerups, setPowerups] = useState<PowerUp[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PowerUp | null>(null)
  const [formData, setFormData] = useState<PowerUpFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<PowerUp | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/powerups')
      if (res.success) setPowerups(res.powerups)
    } catch (err) {
      console.error('Failed to load powerups', err)
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

  const openEdit = (p: PowerUp) => {
    setEditing(p)
    setFormData({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      duration: p.duration,
      magnitude: p.magnitude,
      effect: p.effect,
      color: p.color,
      spawnWeight: p.spawnWeight,
      isActive: p.isActive,
      isPublished: p.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await apiFetch(`/powerups/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) setPowerups(res.powerups)
      } else {
        const res = await apiFetch('/powerups', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) setPowerups(res.powerups)
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save powerup', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: PowerUp) => {
    try {
      const res = await apiFetch(`/powerups/${p.id}`, { method: 'DELETE' })
      if (res.success) setPowerups(res.powerups)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete powerup', err)
    }
  }

  const updateField = <K extends keyof PowerUpFormData>(key: K, value: PowerUpFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const columns = [
    { key: 'name', label: 'Name', render: (p: PowerUp) => <span className="font-medium text-white">{p.name}</span> },
    {
      key: 'type', label: 'Type',
      render: (p: PowerUp) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#2F80ED]/20 text-[#2F80ED] capitalize">
          {p.type}
        </span>
      ),
    },
    { key: 'duration', label: 'Duration', render: (p: PowerUp) => <span className="text-[#94A3B8]">{p.duration}s</span> },
    { key: 'magnitude', label: 'Magnitude', render: (p: PowerUp) => <span>{p.magnitude}</span> },
    { key: 'effect', label: 'Effect', render: (p: PowerUp) => <span className="text-[#94A3B8] text-xs max-w-[120px] truncate inline-block">{p.effect || '—'}</span> },
    {
      key: 'color', label: 'Color',
      render: (p: PowerUp) => (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[#334155]" style={{ backgroundColor: p.color }} />
          <span className="text-[#94A3B8] font-mono text-xs">{p.color}</span>
        </div>
      ),
    },
    {
      key: 'isActive', label: 'Active',
      render: (p: PowerUp) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {p.isActive ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isPublished', label: 'Published',
      render: (p: PowerUp) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {p.isPublished ? 'Live' : 'Draft'}
        </span>
      ),
    },
  ]

  const renderActions = (p: PowerUp) => (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors" title="Edit">
        <Pencil size={16} />
      </button>
      <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-red-400 transition-colors" title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Zap className="text-[#FF6B00]" size={28} />
          <h1 className="text-2xl font-bold text-white">Power-Ups</h1>
        </div>

        <DataTable<PowerUp>
          columns={columns}
          data={powerups}
          loading={loading}
          onRefresh={fetchData}
          onAdd={openCreate}
          addLabel="Add Power-Up"
          actions={renderActions}
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'New Power-Up'} onSave={handleSave} saving={saving} wide>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="Health Pack" />
            <SelectField label="Type" value={formData.type} onChange={(v) => updateField('type', v)} options={typeOptions} />
            <div className="col-span-2">
              <InputField label="Description" value={formData.description} onChange={(v) => updateField('description', v)} placeholder="Restores 50 HP" />
            </div>
            <InputField label="Duration" type="number" value={formData.duration} onChange={(v) => updateField('duration', Number(v))} />
            <InputField label="Magnitude" type="number" value={formData.magnitude} onChange={(v) => updateField('magnitude', Number(v))} />
            <InputField label="Effect" value={formData.effect} onChange={(v) => updateField('effect', v)} placeholder="heal" />
            <InputField label="Color" value={formData.color} onChange={(v) => updateField('color', v)} />
            <InputField label="Spawn Weight" type="number" value={formData.spawnWeight} onChange={(v) => updateField('spawnWeight', Number(v))} />
            <ToggleField label="Active" value={formData.isActive} onChange={(v) => updateField('isActive', v)} />
            <div className="col-span-2">
              <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Power-Up">
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
