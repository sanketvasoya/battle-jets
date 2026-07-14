import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Target } from 'lucide-react'
import { InputField, SelectField, ToggleField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Crosshair } from '../types'

interface CrosshairBuilderProps {
  crosshairId?: string
}

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

export default function CrosshairBuilder({ crosshairId }: CrosshairBuilderProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CrosshairFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEditing = !!crosshairId

  useEffect(() => {
    if (!crosshairId) return
    setLoading(true)
    apiFetch('/crosshairs')
      .then((data) => {
        if (data.success) {
          const c = data.crosshairs.find((x: Crosshair) => x.id === crosshairId)
          if (c) {
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
          }
        }
      })
      .catch((err) => console.error('Failed to load crosshair', err))
      .finally(() => setLoading(false))
  }, [crosshairId])

  const updateField = <K extends keyof CrosshairFormData>(key: K, value: CrosshairFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEditing) {
        const res = await apiFetch(`/crosshairs/${crosshairId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/crosshairs')
      } else {
        const res = await apiFetch('/crosshairs', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (res.success) navigate('/crosshairs')
      }
    } catch (err) {
      console.error('Failed to save crosshair', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#94A3B8]">Loading crosshair...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/crosshairs')} className="p-2 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <Target className="text-[#FF6B00]" size={28} />
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? `Edit: ${formData.name || crosshairId}` : 'New Crosshair'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/crosshairs')} className="px-4 py-2 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
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
            <h2 className="text-lg font-semibold text-white mb-6">Style Controls</h2>
            <div className="space-y-4">
              <InputField label="Name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="My Crosshair" />
              <SelectField label="Style" value={formData.style} onChange={(v) => updateField('style', v)} options={styleOptions} />

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

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Size: {formData.size}</label>
                <input type="range" min="4" max="64" value={formData.size} onChange={(e) => updateField('size', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Thickness: {formData.thickness}</label>
                <input type="range" min="1" max="8" value={formData.thickness} onChange={(e) => updateField('thickness', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Gap: {formData.gap}</label>
                <input type="range" min="0" max="20" value={formData.gap} onChange={(e) => updateField('gap', Number(e.target.value))} className="w-full accent-[#2F80ED]" />
              </div>

              <ToggleField label="Center Dot" value={formData.dot} onChange={(v) => updateField('dot', v)} />
              <ToggleField label="Default" value={formData.isDefault} onChange={(v) => updateField('isDefault', v)} />
              <ToggleField label="Published" value={formData.isPublished} onChange={(v) => updateField('isPublished', v)} />
            </div>
          </div>

          {/* Right Panel - Large Preview */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Live Preview</h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full aspect-square rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center relative">
                {(formData.style === 'cross' || formData.style === 'crosshair_dot') && (
                  <>
                    <div className="absolute" style={{
                      left: `calc(50% - ${formData.gap}px - ${formData.size / 2}px)`,
                      top: `calc(50% - ${formData.thickness / 2}px)`,
                      width: formData.size / 2, height: formData.thickness, backgroundColor: formData.color,
                    }} />
                    <div className="absolute" style={{
                      left: `calc(50% + ${formData.gap}px)`,
                      top: `calc(50% - ${formData.thickness / 2}px)`,
                      width: formData.size / 2, height: formData.thickness, backgroundColor: formData.color,
                    }} />
                    <div className="absolute" style={{
                      left: `calc(50% - ${formData.thickness / 2}px)`,
                      top: `calc(50% - ${formData.gap}px - ${formData.size / 2}px)`,
                      width: formData.thickness, height: formData.size / 2, backgroundColor: formData.color,
                    }} />
                    <div className="absolute" style={{
                      left: `calc(50% - ${formData.thickness / 2}px)`,
                      top: `calc(50% + ${formData.gap}px)`,
                      width: formData.thickness, height: formData.size / 2, backgroundColor: formData.color,
                    }} />
                  </>
                )}
                {formData.style === 'circle' && (
                  <div className="absolute rounded-full" style={{
                    width: formData.size, height: formData.size,
                    border: `${formData.thickness}px solid ${formData.color}`,
                    backgroundColor: 'transparent',
                  }} />
                )}
                {(formData.style === 'dot' || formData.style === 'crosshair_dot') && (
                  <div className="absolute rounded-full" style={{
                    width: Math.max(4, formData.thickness + 2), height: Math.max(4, formData.thickness + 2),
                    backgroundColor: formData.color,
                  }} />
                )}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Style</span>
                <span className="text-white font-medium capitalize">{formData.style}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Size</span>
                <span className="text-white font-medium">{formData.size}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Thickness</span>
                <span className="text-white font-medium">{formData.thickness}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Gap</span>
                <span className="text-white font-medium">{formData.gap}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }} />
                  <span className="text-white font-mono text-xs">{formData.color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => navigate('/crosshairs')} className="px-6 py-2.5 rounded-lg bg-[#334155] text-[#94A3B8] hover:bg-[#475569] transition-colors">
            Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2F80ED] text-white hover:bg-[#2470d4] transition-colors disabled:opacity-50 font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Crosshair'}
          </button>
        </div>
      </div>
    </div>
  )
}
