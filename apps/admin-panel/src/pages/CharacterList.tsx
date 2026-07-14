import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Swords, Wrench } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Character } from '../types'

interface CharacterFormData {
  name: string
  description: string
  baseHealth: number
  speed: number
}

const defaultForm: CharacterFormData = {
  name: '',
  description: '',
  baseHealth: 100,
  speed: 5,
}

export default function CharacterList() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Character | null>(null)
  const [formData, setFormData] = useState<CharacterFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null)

  const fetchCharacters = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/characters')
      if (data.success) setCharacters(data.characters)
    } catch (err) {
      console.error('Failed to load characters', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCharacters() }, [])

  const openCreate = () => {
    setEditing(null)
    setFormData(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (c: Character) => {
    setEditing(c)
    setFormData({
      name: c.name,
      description: c.description ?? '',
      baseHealth: c.baseHealth ?? 100,
      speed: c.speed ?? 5,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const data = await apiFetch(`/characters/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (data.success) setCharacters(prev => prev.map(c => c.id === editing.id ? data.character : c))
      } else {
        const data = await apiFetch('/characters', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (data.success) setCharacters(prev => [...prev, data.character])
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save character', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const data = await apiFetch(`/characters/${deleteTarget.id}`, { method: 'DELETE' })
      if (data.success) setCharacters(prev => prev.filter(c => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete character', err)
    }
  }

  const update = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Swords className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">Characters</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2470d4] text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Character
          </button>
        </div>

        <DataTable<Character>
          columns={[
            { key: 'name', label: 'Name', render: (c: Character) => <span className="font-medium text-white">{c.name}</span> },
            { key: 'description', label: 'Description', render: (c: Character) => <span className="text-[#94A3B8] truncate max-w-xs block">{c.description || '—'}</span> },
            { key: 'baseHealth', label: 'Health', render: (c: Character) => <span className="text-[#FF6B00]">{c.baseHealth}</span> },
            { key: 'speed', label: 'Speed', render: (c: Character) => <span>{c.speed}</span> },
            { key: 'parts', label: 'Parts', render: (c: Character) => <span className="text-[#2F80ED]">{c.parts?.length ?? 0}</span> },
            {
              key: 'isPublished',
              label: 'Published',
              render: (c: Character) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'
                }`}>
                  {c.isPublished ? 'Live' : 'Draft'}
                </span>
              ),
            },
          ]}
          data={characters}
          loading={loading}
          onRefresh={fetchCharacters}
          onAdd={openCreate}
          addLabel="Add Character"
          actions={(c) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/characters/${c.id}/build`)}
                  className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
                  title="Build Parts"
                >
                  <Wrench size={16} />
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
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
          title={editing ? `Edit ${editing.name}` : 'New Character'}
          onSave={handleSave}
          saveLabel={editing ? 'Update' : 'Create'}
          saving={saving}
        >
          <div className="space-y-3">
            <InputField
              label="Name"
              value={formData.name}
              onChange={(v) => update('name', v)}
              placeholder="Character name"
            />
            <InputField
              label="Description"
              value={formData.description}
              onChange={(v) => update('description', v)}
              placeholder="Short description"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Base Health"
                type="number"
                value={formData.baseHealth}
                onChange={(v) => update('baseHealth', Number(v))}
              />
              <InputField
                label="Speed"
                type="number"
                value={formData.speed}
                onChange={(v) => update('speed', Number(v))}
              />
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Character"
          onSave={handleDelete}
          saveLabel="Delete"
        >
          <p className="text-[#94A3B8]">
            Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.name}</span>?
            This will also delete all associated parts. This action cannot be undone.
          </p>
        </Modal>
      </div>
    </div>
  )
}
