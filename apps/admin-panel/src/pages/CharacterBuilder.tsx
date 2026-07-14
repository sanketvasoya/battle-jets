import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, User } from 'lucide-react'
import { InputField, SelectField } from '../components/Modal'
import { apiFetch } from '../api'
import type { Character, CharacterPart } from '../types'

interface CharacterBuilderProps {
  characterId: string
}

const SLOT_OPTIONS = [
  { value: 'HEAD', label: 'Head' },
  { value: 'BODY', label: 'Body' },
  { value: 'ARMS', label: 'Arms' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'WING', label: 'Wing' },
]

const SLOT_COLORS: Record<string, string> = {
  HEAD: '#2F80ED',
  BODY: '#FF6B00',
  ARMS: '#A855F7',
  LEGS: '#22C55E',
  WING: '#EF4444',
}

const SLOT_ORDER = ['HEAD', 'BODY', 'ARMS', 'WING', 'LEGS']

interface PartForm {
  name: string
  slot: string
  color: string
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
  zIndex: number
}

const defaultPartForm: PartForm = {
  name: '',
  slot: 'BODY',
  color: '#2F80ED',
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  zIndex: 0,
}

export default function CharacterBuilder({ characterId }: CharacterBuilderProps) {
  const navigate = useNavigate()
  const [character, setCharacter] = useState<Character | null>(null)
  const [parts, setParts] = useState<CharacterPart[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [partForm, setPartForm] = useState<PartForm>(defaultPartForm)

  const selectedPart = parts.find(p => p.id === selectedPartId) ?? null

  useEffect(() => {
    loadData()
  }, [characterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [charData, partsData] = await Promise.all([
        apiFetch(`/characters/${characterId}`),
        apiFetch(`/characters/${characterId}/parts`),
      ])
      if (charData.success) setCharacter(charData.character)
      if (partsData.success) setParts(partsData.parts ?? [])
    } catch (err) {
      console.error('Failed to load character data', err)
    } finally {
      setLoading(false)
    }
  }

  const selectPart = (part: CharacterPart) => {
    setSelectedPartId(part.id)
    setShowAddForm(false)
    setPartForm({
      name: part.name,
      slot: part.slot,
      color: part.color || '#2F80ED',
      offsetX: part.offsetX ?? 0,
      offsetY: part.offsetY ?? 0,
      scale: part.scale ?? 1,
      rotation: part.rotation ?? 0,
      zIndex: part.zIndex ?? 0,
    })
  }

  const startAddPart = () => {
    setSelectedPartId(null)
    setShowAddForm(true)
    setPartForm(defaultPartForm)
  }

  const handleSavePart = async () => {
    setSaving(true)
    try {
      if (selectedPartId) {
        const data = await apiFetch(`/characters/${characterId}/parts/${selectedPartId}`, {
          method: 'PUT',
          body: JSON.stringify(partForm),
        })
        if (data.success) {
          setParts(prev => prev.map(p => p.id === selectedPartId ? data.part : p))
        }
      } else {
        const data = await apiFetch(`/characters/${characterId}/parts`, {
          method: 'POST',
          body: JSON.stringify(partForm),
        })
        if (data.success) {
          setParts(prev => [...prev, data.part])
          setSelectedPartId(data.part.id)
        }
        setShowAddForm(false)
      }
    } catch (err) {
      console.error('Failed to save part', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePart = async (partId: string) => {
    try {
      const data = await apiFetch(`/characters/${characterId}/parts/${partId}`, {
        method: 'DELETE',
      })
      if (data.success) {
        setParts(prev => prev.filter(p => p.id !== partId))
        if (selectedPartId === partId) setSelectedPartId(null)
      }
    } catch (err) {
      console.error('Failed to delete part', err)
    }
  }

  const handleSaveCharacter = async () => {
    if (!character) return
    setSaving(true)
    try {
      const data = await apiFetch(`/characters/${characterId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: character.name, description: character.description, baseHealth: character.baseHealth, speed: character.speed }),
      })
      if (data.success) setCharacter(data.character)
    } catch (err) {
      console.error('Failed to save character', err)
    } finally {
      setSaving(false)
    }
  }

  const updatePartForm = <K extends keyof PartForm>(key: K, value: PartForm[K]) => {
    setPartForm(prev => ({ ...prev, [key]: value }))
  }

  const groupedParts = SLOT_ORDER.reduce<Record<string, CharacterPart[]>>((acc, slot) => {
    acc[slot] = parts.filter(p => p.slot === slot)
    return acc
  }, {})

  const sortedParts = [...parts].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#94A3B8]">Loading character...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/characters')}
              className="p-2 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <User className="text-[#FF6B00]" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">{character?.name || 'Unknown'}</h1>
              <p className="text-sm text-[#94A3B8]">{parts.length} parts &middot; HP {character?.baseHealth} &middot; Speed {character?.speed}</p>
            </div>
          </div>
          <button
            onClick={handleSaveCharacter}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F80ED] text-white rounded-lg font-medium hover:bg-[#2470d4] transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Character'}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Panel: Parts List */}
          <div className="col-span-3 bg-[#1E293B] rounded-xl border border-[#334155] p-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Parts</h2>
              <button
                onClick={startAddPart}
                className="p-1.5 rounded-md bg-[#2F80ED]/20 text-[#2F80ED] hover:bg-[#2F80ED]/30 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {SLOT_ORDER.map(slot => {
              const slotParts = groupedParts[slot] ?? []
              if (slotParts.length === 0) return null
              return (
                <div key={slot} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SLOT_COLORS[slot] }} />
                    <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">{slot}</span>
                  </div>
                  <div className="space-y-1">
                    {slotParts.map(part => (
                      <button
                        key={part.id}
                        onClick={() => selectPart(part)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${
                          selectedPartId === part.id
                            ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40 text-white'
                            : 'hover:bg-[#334155] text-[#94A3B8] hover:text-white border border-transparent'
                        }`}
                      >
                        <span className="truncate">{part.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePart(part.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            {parts.length === 0 && (
              <p className="text-xs text-[#94A3B8] text-center py-8">No parts yet. Click + to add one.</p>
            )}
          </div>

          {/* Center Panel: Visual Preview */}
          <div className="col-span-5 bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Preview</h2>

            <div className="flex-1 flex items-center justify-center">
              <div className="relative" style={{ width: 200, height: 300 }}>
                {/* Ground line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[#334155]" />

                {/* Body reference rectangle */}
                <div
                  className="absolute border border-dashed border-[#334155] rounded"
                  style={{
                    width: 60,
                    height: 120,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />

                {sortedParts.map(part => {
                  const partWidth = 40 * (part.scale ?? 1)
                  const partHeight = 30 * (part.scale ?? 1)
                  return (
                    <div
                      key={part.id}
                      className={`absolute rounded cursor-pointer transition-all ${selectedPartId === part.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1E293B]' : ''}`}
                      style={{
                        width: partWidth,
                        height: partHeight,
                        backgroundColor: part.color || '#2F80ED',
                        left: `calc(50% + ${part.offsetX ?? 0}px)`,
                        top: `calc(50% + ${part.offsetY ?? 0}px)`,
                        transform: `translate(-50%, -50%) rotate(${part.rotation ?? 0}deg)`,
                        zIndex: part.zIndex ?? 0,
                        opacity: 0.85,
                      }}
                      onClick={() => selectPart(part)}
                      title={`${part.name} (${part.slot})`}
                    />
                  )
                })}

                {parts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User size={48} className="text-[#334155]" />
                  </div>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              <div className="bg-[#0F172A] rounded-lg p-2">
                <div className="text-xs text-[#94A3B8]">Parts</div>
                <div className="text-white font-bold">{parts.length}</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-2">
                <div className="text-xs text-[#94A3B8]">HP</div>
                <div className="text-[#FF6B00] font-bold">{character?.baseHealth ?? '—'}</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-2">
                <div className="text-xs text-[#94A3B8]">Speed</div>
                <div className="text-[#2F80ED] font-bold">{character?.speed ?? '—'}</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-2">
                <div className="text-xs text-[#94A3B8]">Status</div>
                <div className={`font-bold ${character?.isPublished ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                  {character?.isPublished ? 'Live' : 'Draft'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Part Editor */}
          <div className="col-span-4 bg-[#1E293B] rounded-xl border border-[#334155] p-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            {(selectedPart || showAddForm) ? (
              <>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {showAddForm ? 'New Part' : `Edit: ${selectedPart?.name}`}
                </h2>

                <div className="space-y-3">
                  <InputField
                    label="Name"
                    value={partForm.name}
                    onChange={(v) => updatePartForm('name', v)}
                    placeholder="Part name"
                  />
                  <SelectField
                    label="Slot"
                    value={partForm.slot}
                    onChange={(v) => updatePartForm('slot', v)}
                    options={SLOT_OPTIONS}
                  />
                  <div>
                    <label className="text-xs text-[#94A3B8] uppercase tracking-wider block mb-1">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={partForm.color}
                        onChange={(e) => updatePartForm('color', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-[#334155] bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={partForm.color}
                        onChange={(e) => updatePartForm('color', e.target.value)}
                        className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#2F80ED]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Offset X"
                      type="number"
                      value={partForm.offsetX}
                      onChange={(v) => updatePartForm('offsetX', Number(v))}
                    />
                    <InputField
                      label="Offset Y"
                      type="number"
                      value={partForm.offsetY}
                      onChange={(v) => updatePartForm('offsetY', Number(v))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Scale"
                      type="number"
                      value={partForm.scale}
                      onChange={(v) => updatePartForm('scale', Number(v))}
                      step="0.1"
                    />
                    <InputField
                      label="Rotation"
                      type="number"
                      value={partForm.rotation}
                      onChange={(v) => updatePartForm('rotation', Number(v))}
                    />
                  </div>

                  <InputField
                    label="Z-Index"
                    type="number"
                    value={partForm.zIndex}
                    onChange={(v) => updatePartForm('zIndex', Number(v))}
                  />

                  <div className="flex gap-3 pt-2">
                    {(selectedPart || showAddForm) && (
                      <button
                        onClick={() => { setSelectedPartId(null); setShowAddForm(false) }}
                        className="flex-1 py-2.5 border border-[#334155] rounded-xl text-[#94A3B8] hover:text-white transition-all text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleSavePart}
                      disabled={saving || !partForm.name}
                      className="flex-1 py-2.5 bg-[#2F80ED] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2470d4] transition-all disabled:opacity-50"
                    >
                      <Save size={14} />
                      {saving ? 'Saving...' : showAddForm ? 'Add Part' : 'Update Part'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#94A3B8]">
                <User size={40} className="mb-3 opacity-30" />
                <p className="text-sm text-center">Select a part to edit or click + to add a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
