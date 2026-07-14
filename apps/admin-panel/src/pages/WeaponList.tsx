import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Swords, Wrench } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal, { InputField, SelectField, ToggleField } from '../components/Modal'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}
import { apiFetch } from '../api'
import type { Weapon } from '../types'

interface WeaponFormData {
  id: string
  name: string
  damage: number
  fireRate: number
  range: number
  spread: number
  pellets: number
  explosionRadius: number
  projectileSpeed: number
  ammo: number
  reloadTime: number
  damageType: 'bullet' | 'explosive' | 'energy' | 'melee'
  knockback: number
  isPublished: boolean
}

const defaultWeapon: WeaponFormData = {
  id: '',
  name: '',
  damage: 10,
  fireRate: 5,
  range: 50,
  spread: 0,
  pellets: 1,
  explosionRadius: 0,
  projectileSpeed: 100,
  ammo: 30,
  reloadTime: 2,
  damageType: 'bullet',
  knockback: 0,
  isPublished: false,
}

const damageTypeOptions = [
  { value: 'bullet', label: 'Bullet' },
  { value: 'explosive', label: 'Explosive' },
  { value: 'energy', label: 'Energy' },
  { value: 'melee', label: 'Melee' },
]

export default function WeaponList() {
  const navigate = useNavigate()
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null)
  const [formData, setFormData] = useState<WeaponFormData>(defaultWeapon)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Weapon | null>(null)

  const fetchWeapons = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/admin/weapons')
      const data = await res.json()
      if (data.success) setWeapons(data.weapons)
    } catch (err) {
      console.error('Failed to load weapons', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWeapons() }, [])

  const openCreateModal = () => {
    setEditingWeapon(null)
    setFormData(defaultWeapon)
    setModalOpen(true)
  }

  const openEditModal = (weapon: Weapon) => {
    setEditingWeapon(weapon)
    setFormData({
      id: weapon.id,
      name: weapon.name,
      damage: weapon.damage ?? 10,
      fireRate: weapon.fireRate ?? 5,
      range: weapon.range ?? 50,
      spread: weapon.spread ?? 0,
      pellets: weapon.pellets ?? 1,
      explosionRadius: weapon.explosionRadius ?? 0,
      projectileSpeed: weapon.projectileSpeed ?? 100,
      ammo: weapon.ammo ?? 30,
      reloadTime: weapon.reloadTime ?? 2,
      damageType: (weapon.damageType ?? 'bullet') as WeaponFormData['damageType'],
      knockback: weapon.knockback ?? 0,
      isPublished: weapon.isPublished ?? false,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingWeapon) {
        const res = await apiFetch(`/admin/weapons/${editingWeapon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) setWeapons(data.weapons)
      } else {
        const res = await apiFetch('/admin/weapons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) setWeapons(data.weapons)
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save weapon', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (weapon: Weapon) => {
    try {
      const res = await apiFetch(`/admin/weapons/${weapon.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) setWeapons(data.weapons)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete weapon', err)
    }
  }

  const updateField = <K extends keyof WeaponFormData>(key: K, value: WeaponFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const columns: Column<Weapon>[] = [
    { key: 'id', label: 'ID', render: (w) => <span className="font-mono text-xs text-[#94A3B8]">{w.id}</span> },
    { key: 'name', label: 'Name', render: (w) => <span className="font-medium text-white">{w.name}</span> },
    { key: 'damage', label: 'Damage', render: (w) => <span className="text-[#FF6B00]">{w.damage}</span> },
    { key: 'fireRate', label: 'Fire Rate', render: (w) => <span>{w.fireRate}</span> },
    { key: 'range', label: 'Range', render: (w) => <span>{w.range}</span> },
    { key: 'pellets', label: 'Pellets', render: (w) => <span>{w.pellets}</span> },
    {
      key: 'explosionRadius',
      label: 'Explosion',
      render: (w) => <span>{w.explosionRadius > 0 ? w.explosionRadius : '-'}</span>,
    },
    {
      key: 'isPublished',
      label: 'Published',
      render: (w) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            w.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94A3B8]'
          }`}
        >
          {w.isPublished ? 'Live' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (w) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/weapons/${w.id}/build`)}
            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
            title="Build"
          >
            <Wrench size={16} />
          </button>
          <button
            onClick={() => openEditModal(w)}
            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#2F80ED] transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(w)}
            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Swords className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">Weapons</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] hover:bg-[#2470d4] text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Weapon
          </button>
        </div>

        <DataTable<Weapon> columns={columns} data={weapons} loading={loading} />

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingWeapon ? `Edit ${editingWeapon.name}` : 'New Weapon'}
          onSave={handleSave}
          saving={saving}
        >
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="ID"
              value={formData.id}
              onChange={(v) => updateField('id', v)}
              disabled={!!editingWeapon}
              placeholder="e.g. ak47"
            />
            <InputField
              label="Name"
              value={formData.name}
              onChange={(v) => updateField('name', v)}
              placeholder="AK-47"
            />
            <InputField
              label="Damage"
              type="number"
              value={formData.damage}
              onChange={(v) => updateField('damage', Number(v))}
            />
            <InputField
              label="Fire Rate"
              type="number"
              value={formData.fireRate}
              onChange={(v) => updateField('fireRate', Number(v))}
            />
            <InputField
              label="Range"
              type="number"
              value={formData.range}
              onChange={(v) => updateField('range', Number(v))}
            />
            <InputField
              label="Spread"
              type="number"
              value={formData.spread}
              onChange={(v) => updateField('spread', Number(v))}
            />
            <InputField
              label="Pellets"
              type="number"
              value={formData.pellets}
              onChange={(v) => updateField('pellets', Number(v))}
            />
            <InputField
              label="Explosion Radius"
              type="number"
              value={formData.explosionRadius}
              onChange={(v) => updateField('explosionRadius', Number(v))}
            />
            <InputField
              label="Projectile Speed"
              type="number"
              value={formData.projectileSpeed}
              onChange={(v) => updateField('projectileSpeed', Number(v))}
            />
            <InputField
              label="Ammo"
              type="number"
              value={formData.ammo}
              onChange={(v) => updateField('ammo', Number(v))}
            />
            <InputField
              label="Reload Time"
              type="number"
              value={formData.reloadTime}
              onChange={(v) => updateField('reloadTime', Number(v))}
              step="0.1"
            />
            <InputField
              label="Knockback"
              type="number"
              value={formData.knockback}
              onChange={(v) => updateField('knockback', Number(v))}
            />
            <div className="col-span-2">
              <SelectField
                label="Damage Type"
                value={formData.damageType}
                onChange={(v) => updateField('damageType', v as WeaponFormData['damageType'])}
                options={damageTypeOptions}
              />
            </div>
            <div className="col-span-2">
              <ToggleField
                label="Published"
                checked={formData.isPublished}
                onChange={(v) => updateField('isPublished', v)}
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Weapon"
          onSave={() => { if (deleteConfirm) return handleDelete(deleteConfirm) }}
          saveLabel="Delete"
        >
          <p className="text-[#94A3B8]">
            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm?.name}</span>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </div>
  )
}
