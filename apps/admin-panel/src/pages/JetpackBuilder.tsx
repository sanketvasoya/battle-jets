import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Rocket } from 'lucide-react'
import { InputField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Jetpack } from '../types'

interface JetpackBuilderProps {
  jetpackId?: string
}

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

export default function JetpackBuilder({ jetpackId }: JetpackBuilderProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<JetpackFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEditing = !!jetpackId

  useEffect(() => {
    if (!jetpackId) return
    setLoading(true)
    apiFetch('/jetpacks')
      .then((data) => {
        if (data.success) {
          const j = data.jetpacks.find((x: Jetpack) => x.id === jetpackId)
          if (j) {
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
          }
        }
      })
      .catch((err) => console.error('Failed to load jetpack', err))
      .finally(() => setLoading(false))
  }, [jetpackId])

  const updateField = <K extends keyof JetpackFormData>(key: K, value: JetpackFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEditing) {
        const res = await apiFetch(`/jetpacks/${jetpackId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/jetpacks')
      } else {
        const res = await apiFetch('/jetpacks', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/jetpacks')
      }
    } catch (err) {
      console.error('Failed to save jetpack', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#94A3B8]">Loading jetpack...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/jetpacks')} className="p-2 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <Rocket className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? `Edit: ${formData.name || jetpackId}` : 'New Jetpack'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/jetpacks')} className="px-4 py-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
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
            <h2 className="text-lg font-semibold text-white mb-6">Jetpack Settings</h2>
            <div className="space-y-4">
              <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="Rocket Jetpack" />
              <InputField label="Description" value={formData.description} onChange={(v) => updateField('description', v)} placeholder="High-speed jetpack with orange trail" />

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Fuel: {formData.fuel}</label>
                <input type="range" min="0" max="200" value={formData.fuel} onChange={(e) => updateField('fuel', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Thrust: {formData.thrust}</label>
                <input type="range" min="0" max="200" value={formData.thrust} onChange={(e) => updateField('thrust', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Recharge Rate: {formData.rechargeRate}</label>
                <input type="range" min="0" max="200" value={formData.rechargeRate} onChange={(e) => updateField('rechargeRate', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Burn Rate: {formData.burnRate}</label>
                <input type="range" min="0" max="200" value={formData.burnRate} onChange={(e) => updateField('burnRate', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Trail Length: {formData.trailLength}</label>
                <input type="range" min="0" max="100" value={formData.trailLength} onChange={(e) => updateField('trailLength', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Particle Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.particleColor}
                    onChange={(e) => updateField('particleColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#334155] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.particleColor}
                    onChange={(e) => updateField('particleColor', e.target.value)}
                    className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#2F80ED]"
                  />
                </div>
              </div>

              <ToggleField label="Default" value={formData.isDefault} onChange={(v) => updateField('isDefault', v)} />
              <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Preview</h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full h-full min-h-[300px] rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center overflow-hidden">
                {/* Jetpack body */}
                <div className="relative z-10 w-16 h-24 rounded-lg border-2 border-[#475569] bg-[#1E293B] flex items-center justify-center">
                  <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: formData.particleColor }} />
                </div>

                {/* Particle trail */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ animation: 'trailPulse 1.5s ease-in-out infinite' }}>
                  {Array.from({ length: Math.min(formData.trailLength, 12) }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: Math.max(2, 8 - i),
                        height: Math.max(2, 8 - i),
                        backgroundColor: formData.particleColor,
                        opacity: 1 - i * 0.08,
                        marginBottom: 2,
                      }}
                    />
                  ))}
                </div>

                <style>{`
                  @keyframes trailPulse {
                    0%, 100% { opacity: 0.7; transform: translateX(-50%) scaleY(1); }
                    50% { opacity: 1; transform: translateX(-50%) scaleY(1.15); }
                  }
                `}</style>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Fuel</span>
                <span className="text-white font-medium">{formData.fuel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Thrust</span>
                <span className="text-white font-medium">{formData.thrust}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Recharge</span>
                <span className="text-white font-medium">{formData.rechargeRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Burn Rate</span>
                <span className="text-white font-medium">{formData.burnRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Trail Length</span>
                <span className="text-white font-medium">{formData.trailLength}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Particle Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.particleColor }} />
                  <span className="text-white font-mono text-xs">{formData.particleColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => navigate('/jetpacks')} className="px-6 py-2.5 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
            Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50 font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Jetpack'}
          </button>
        </div>
      </div>
    </div>
  )
}
