import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Map, ExternalLink } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { GameMap } from '../types'

interface MapFormData {
  name: string
  width: number
  height: number
  isActive: boolean
}

const defaultForm: MapFormData = {
  name: '',
  width: 3000,
  height: 1600,
  isActive: false,
}

export default function MapList() {
  const navigate = useNavigate()
  const [maps, setMaps] = useState<GameMap[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GameMap | null>(null)
  const [formData, setFormData] = useState<MapFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GameMap | null>(null)

  const fetchMaps = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/maps')
      if (data.success) setMaps(data.maps)
    } catch (err) {
      console.error('Failed to load maps', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMaps() }, [])

  const openCreate = () => {
    setEditing(null)
    setFormData(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (m: GameMap) => {
    setEditing(m)
    setFormData({
      name: m.name,
      width: m.width ?? 3000,
      height: m.height ?? 1600,
      isActive: m.isActive ?? false,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const data = await apiFetch(`/maps/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (data.success) setMaps(prev => prev.map(m => m.id === editing.id ? data.map : m))
      } else {
        const json = {
          platforms: [],
          spawnPoints: [{ x: formData.width / 2, y: 1200 }],
          jumpPads: [],
          movingPlatforms: [],
          boxes: [],
        }
        const data = await apiFetch('/maps', {
          method: 'POST',
          body: JSON.stringify({ name: formData.name, json }),
        })
        if (data.success) setMaps(prev => [...prev, data.map])
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save map', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const data = await apiFetch(`/maps/${deleteTarget.id}`, { method: 'DELETE' })
      if (data.success) setMaps(prev => prev.filter(m => m.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete map', err)
    }
  }

  const update = <K extends keyof MapFormData>(key: K, value: MapFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Map className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">Maps</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2470d4] text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Map
          </button>
        </div>

        <DataTable<GameMap>
          columns={[
            { key: 'name', label: 'Name', render: (m: GameMap) => <span className="font-medium text-white">{m.name}</span> },
            { key: 'width', label: 'Width', render: (m: GameMap) => <span className="text-[#FF6B00]">{m.width}</span> },
            { key: 'height', label: 'Height', render: (m: GameMap) => <span className="text-[#FF6B00]">{m.height}</span> },
            {
              key: 'isActive',
              label: 'Active',
              render: (m: GameMap) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  m.isActive ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'
                }`}>
                  {m.isActive ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'createdAt',
              label: 'Created',
              render: (m: GameMap) => <span className="text-[#94A3B8] text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</span>,
            },
          ]}
          data={maps}
          loading={loading}
          onRefresh={fetchMaps}
          onAdd={openCreate}
          addLabel="Add Map"
          actions={(m) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/maps/' + m.id + '/build')}
                  className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#22C55E] transition-colors"
                  title="Open Builder"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => openEdit(m)}
                  className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
          )}
        />

        {/* Create / Edit Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? `Edit ${editing.name}` : 'New Map'}
          onSave={handleSave}
          saveLabel={editing ? 'Update' : 'Create'}
          saving={saving}
        >
          <div className="space-y-3">
            <InputField
              label="Name"
              value={formData.name}
              onChange={(v) => update('name', v)}
              placeholder="Map name"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Width"
                type="number"
                value={formData.width}
                onChange={(v) => update('width', Number(v))}
              />
              <InputField
                label="Height"
                type="number"
                value={formData.height}
                onChange={(v) => update('height', Number(v))}
              />
            </div>
            {editing && (
              <ToggleField
                label="Active"
                value={formData.isActive}
                onChange={(v) => update('isActive', v)}
              />
            )}
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Map"
          onSave={handleDelete}
          saveLabel="Delete"
        >
          <p className="text-[#94A3B8]">
            Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.name}</span>?
            This action cannot be undone.
          </p>
        </Modal>
      </div>
    </div>
  )
}
