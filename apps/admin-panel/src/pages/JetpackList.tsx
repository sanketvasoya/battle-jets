import { useState, useEffect } from 'react'
import { Pencil, Trash2, Rocket } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Jetpack } from '../types'

interface JetpackFormData {
  id: string
  name: string
  description: string
  fuel: number
  thrust: number
  rechargeRate: number
  burnRate: number
  particleColor: string
  trailLength: number
  isDefault: boolean
  isPublished: boolean
}

const defaultForm: JetpackFormData = {
  id: '',
  name: '',
  description: '',
  fuel: 100,
  thrust: 50,
  rechargeRate: 10,
  burnRate: 5,
  particleColor: '#FF6B00',
  trailLength: 20,
  isDefault: false,
  isPublished: false,
}

export default function JetpackList() {
  const [jetpacks, setJetpacks] = useState<Jetpack[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Jetpack | null>(null)
  const [formData, setFormData] = useState<JetpackFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Jetpack | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/jetpacks')
      if (res.success) setJetpacks(res.jetpacks)
    } catch (err) {
      console.error('Failed to load jetpacks', err)
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

  const openEdit = (j: Jetpack) => {
    setEditing(j)
    setFormData({
      id: j.id,
      name: j.name,
      description: j.description,
      fuel: j.fuel,
      thrust: j.thrust,
      rechargeRate: j.rechargeRate,
      burnRate: j.burnRate,
      particleColor: j.particleColor,
      trailLength: j.trailLength,
      isDefault: j.isDefault,
      isPublished: j.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await apiFetch(`/jetpacks/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) setJetpacks(res.jetpacks)
      } else {
        const res = await apiFetch('/jetpacks', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) setJetpacks(res.jetpacks)
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save jetpack', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (j: Jetpack) => {
    try {
      const res = await apiFetch(`/jetpacks/${j.id}`, { method: 'DELETE' })
      if (res.success) setJetpacks(res.jetpacks)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete jetpack', err)
    }
  }

  const updateField = <K extends keyof JetpackFormData>(key: K, value: JetpackFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const columns = [
    { key: 'name', label: 'Name', render: (j: Jetpack) => <span className="font-medium text-white">{j.name}</span> },
    { key: 'description', label: 'Description', render: (j: Jetpack) => <span className="text-[#94A3B8] text-xs max-w-[150px] truncate inline-block">{j.description || '—'}</span> },
    { key: 'fuel', label: 'Fuel', render: (j: Jetpack) => <span className="text-[#FF6B00]">{j.fuel}</span> },
    { key: 'thrust', label: 'Thrust', render: (j: Jetpack) => <span>{j.thrust}</span> },
    { key: 'rechargeRate', label: 'Recharge', render: (j: Jetpack) => <span>{j.rechargeRate}</span> },
    { key: 'burnRate', label: 'Burn Rate', render: (j: Jetpack) => <span>{j.burnRate}</span> },
    {
      key: 'particleColor', label: 'Particle Color',
      render: (j: Jetpack) => (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[#334155]" style={{ backgroundColor: j.particleColor }} />
          <span className="text-[#94A3B8] font-mono text-xs">{j.particleColor}</span>
        </div>
      ),
    },
    {
      key: 'isDefault', label: 'Default',
      render: (j: Jetpack) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${j.isDefault ? 'bg-[#2F80ED]/20 text-[#2F80ED]' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {j.isDefault ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isPublished', label: 'Published',
      render: (j: Jetpack) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${j.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'}`}>
          {j.isPublished ? 'Live' : 'Draft'}
        </span>
      ),
    },
  ]

  const renderActions = (j: Jetpack) => (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => openEdit(j)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors" title="Edit">
        <Pencil size={16} />
      </button>
      <button onClick={() => setDeleteConfirm(j)} className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-red-400 transition-colors" title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Rocket className="text-[#FF6B00]" size={28} />
          <h1 className="text-2xl font-bold text-white">Jetpacks</h1>
        </div>

        <DataTable<Jetpack>
          columns={columns}
          data={jetpacks}
          loading={loading}
          onRefresh={fetchData}
          onAdd={openCreate}
          addLabel="Add Jetpack"
          actions={renderActions}
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'New Jetpack'} onSave={handleSave} saving={saving} wide>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="Rocket Jetpack" />
            <InputField label="Description" value={formData.description} onChange={(v) => updateField('description', v)} placeholder="A high-speed jetpack" />
            <InputField label="Fuel" type="number" value={formData.fuel} onChange={(v) => updateField('fuel', Number(v))} />
            <InputField label="Thrust" type="number" value={formData.thrust} onChange={(v) => updateField('thrust', Number(v))} />
            <InputField label="Recharge Rate" type="number" value={formData.rechargeRate} onChange={(v) => updateField('rechargeRate', Number(v))} />
            <InputField label="Burn Rate" type="number" value={formData.burnRate} onChange={(v) => updateField('burnRate', Number(v))} />
            <InputField label="Particle Color" value={formData.particleColor} onChange={(v) => updateField('particleColor', v)} />
            <InputField label="Trail Length" type="number" value={formData.trailLength} onChange={(v) => updateField('trailLength', Number(v))} />
            <ToggleField label="Default" value={formData.isDefault} onChange={(v) => updateField('isDefault', v)} />
            <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
          </div>
        </Modal>

        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Jetpack">
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
