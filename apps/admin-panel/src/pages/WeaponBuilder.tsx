import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Swords, Crosshair, Zap } from 'lucide-react'
import { InputField, SelectField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Weapon } from '../types'

interface WeaponBuilderProps {
  weaponId?: string
}

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

const damageTypeColors: Record<string, string> = {
  bullet: '#2F80ED',
  explosive: '#FF6B00',
  energy: '#A855F7',
  melee: '#EF4444',
}

export default function WeaponBuilder({ weaponId }: WeaponBuilderProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<WeaponFormData>(defaultWeapon)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEditing = !!weaponId

  useEffect(() => {
    if (!weaponId) return
    setLoading(true)
    apiFetch(`/admin/weapons`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const weapon = data.weapons.find((w: Weapon) => w.id === weaponId)
          if (weapon) {
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
              damageType: weapon.damageType ?? 'bullet',
              knockback: weapon.knockback ?? 0,
              isPublished: weapon.isPublished ?? false,
            })
          }
        }
      })
      .catch((err) => console.error('Failed to load weapon', err))
      .finally(() => setLoading(false))
  }, [weaponId])

  const updateField = <K extends keyof WeaponFormData>(key: K, value: WeaponFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEditing) {
        const res = await apiFetch(`/admin/weapons/${weaponId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) navigate('/weapons')
      } else {
        const res = await apiFetch('/admin/weapons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) navigate('/weapons')
      }
    } catch (err) {
      console.error('Failed to save weapon', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTestInSandbox = () => {
    alert(`Test sandbox for "${formData.name || 'Untitled Weapon'}" — coming soon!`)
  }

  const accentColor = damageTypeColors[formData.damageType] || '#2F80ED'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#94A3B8]">Loading weapon...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/weapons')}
              className="p-2 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <Swords className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? `Edit: ${formData.name || weaponId}` : 'New Weapon'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestInSandbox}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#334155] text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-colors"
            >
              <Crosshair size={16} />
              Test in Sandbox
            </button>
            <button
              onClick={() => navigate('/weapons')}
              className="px-4 py-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors"
            >
              Back to List
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.id || !formData.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Stats Form */}
          <div className="lg:col-span-2 bg-[#1E293B] rounded-xl border border-[#334155] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={18} style={{ color: accentColor }} />
              <h2 className="text-lg font-semibold text-white">Weapon Stats</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="ID"
                value={formData.id}
                onChange={(v) => updateField('id', v)}
                disabled={isEditing}
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
                  value={formData.isPublished}
                  onChange={(v) => updateField('isPublished', v)}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Preview */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Preview</h2>

            <div className="flex-1 flex items-center justify-center">
              <div
                className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-4"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
                  border: `2px solid ${accentColor}44`,
                }}
              >
                <Swords size={48} style={{ color: accentColor }} />
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {formData.name || 'Untitled'}
                  </div>
                  <div
                    className="text-sm font-medium mt-1 uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    {formData.damageType}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Damage</span>
                <span className="text-white font-medium">{formData.damage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Fire Rate</span>
                <span className="text-white font-medium">{formData.fireRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Range</span>
                <span className="text-white font-medium">{formData.range}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Ammo</span>
                <span className="text-white font-medium">{formData.ammo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Status</span>
                <span className={`font-medium ${formData.isPublished ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                  {formData.isPublished ? 'Live' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => navigate('/weapons')}
            className="px-6 py-2.5 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors"
          >
            Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.id || !formData.name}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50 font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Weapon'}
          </button>
        </div>
      </div>
    </div>
  )
}
