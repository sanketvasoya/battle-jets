import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Zap } from 'lucide-react'
import { InputField, SelectField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { PowerUp } from '../types'

interface PowerUpBuilderProps {
  powerupId?: string
}

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

const typeHelp: Record<string, string> = {
  health: 'Restores player health by the magnitude value.',
  speed: 'Increases player movement speed by magnitude%.',
  damage: 'Boosts weapon damage by magnitude% for the duration.',
  shield: 'Grants a temporary shield that absorbs damage equal to magnitude.',
  stealth: 'Makes the player invisible for the duration.',
}

const typeIcons: Record<string, string> = {
  health: '\u2764',
  speed: '\u26A1',
  damage: '\u2694',
  shield: '\u26E8',
  stealth: '\u{1F47B}',
}

export default function PowerUpBuilder({ powerupId }: PowerUpBuilderProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<PowerUpFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEditing = !!powerupId

  useEffect(() => {
    if (!powerupId) return
    setLoading(true)
    apiFetch('/powerups')
      .then((data) => {
        if (data.success) {
          const p = data.powerups.find((x: PowerUp) => x.id === powerupId)
          if (p) {
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
          }
        }
      })
      .catch((err) => console.error('Failed to load powerup', err))
      .finally(() => setLoading(false))
  }, [powerupId])

  const updateField = <K extends keyof PowerUpFormData>(key: K, value: PowerUpFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEditing) {
        const res = await apiFetch(`/powerups/${powerupId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/powerups')
      } else {
        const res = await apiFetch('/powerups', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/powerups')
      }
    } catch (err) {
      console.error('Failed to save powerup', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#94A3B8]">Loading power-up...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/powerups')} className="p-2 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <Zap className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? `Edit: ${formData.name || powerupId}` : 'New Power-Up'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/powerups')} className="px-4 py-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
              Back to List
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Power-Up Settings</h2>
            <div className="space-y-4">
              <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="Health Pack" />
              <SelectField label="Type" value={formData.type} onChange={(v) => updateField('type', v)} options={typeOptions} />

              {typeHelp[formData.type] && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#94A3B8]">
                  {typeHelp[formData.type]}
                </div>
              )}

              <InputField label="Description" value={formData.description} onChange={(v) => updateField('description', v)} placeholder="Restores 50 HP on pickup" />
              <InputField label="Duration (seconds)" type="number" value={formData.duration} onChange={(v) => updateField('duration', Number(v))} />
              <InputField label="Magnitude" type="number" value={formData.magnitude} onChange={(v) => updateField('magnitude', Number(v))} />
              <InputField label="Effect" value={formData.effect} onChange={(v) => updateField('effect', v)} placeholder="heal" />
              <InputField label="Spawn Weight" type="number" value={formData.spawnWeight} onChange={(v) => updateField('spawnWeight', Number(v))} />

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#334155] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#2F80ED]"
                  />
                </div>
              </div>

              <ToggleField label="Active" value={formData.isActive} onChange={(v) => updateField('isActive', v)} />
              <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Preview</h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full aspect-square rounded-xl bg-[#0F172A] border border-[#334155] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ background: `radial-gradient(circle at center, ${formData.color}, transparent 70%)` }}
                />
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative z-10"
                  style={{
                    backgroundColor: `${formData.color}22`,
                    border: `2px solid ${formData.color}66`,
                  }}
                >
                  {typeIcons[formData.type] || '?'}
                </div>
                <div className="text-center relative z-10">
                  <div className="text-lg font-bold text-white">{formData.name || 'Untitled'}</div>
                  <div className="text-sm capitalize mt-1" style={{ color: formData.color }}>{formData.type}</div>
                  {formData.description && (
                    <div className="text-xs text-[#94A3B8] mt-2 max-w-[200px]">{formData.description}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Type</span>
                <span className="text-white font-medium capitalize">{formData.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Duration</span>
                <span className="text-white font-medium">{formData.duration}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Magnitude</span>
                <span className="text-white font-medium">{formData.magnitude}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Spawn Weight</span>
                <span className="text-white font-medium">{formData.spawnWeight}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }} />
                  <span className="text-white font-mono text-xs">{formData.color}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Status</span>
                <span className={`font-medium ${formData.isActive ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => navigate('/powerups')} className="px-6 py-2.5 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
            Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50 font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Power-Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
