import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import type { GameMap, MapData, Platform, JumpPad, MovingPlatform, Box } from '../types'
import {
  ArrowLeft,
  Pointer,
  Square,
  MapPin,
  ChevronUp,
  Box as BoxIcon,
  Trash2,
  Save,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react'

type Tool =
  | 'select'
  | 'platform'
  | 'one_way_platform'
  | 'spawn_point'
  | 'jump_pad'
  | 'moving_platform'
  | 'box'
  | 'delete'

type DrawableObject = {
  kind: 'platform' | 'spawn_point' | 'jump_pad' | 'moving_platform' | 'box'
  data: Platform | { x: number; y: number } | JumpPad | MovingPlatform | Box
}

const GRID_SIZE = 32
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function defaultMapData(): MapData {
  return {
    id: '',
    name: '',
    width: 3000,
    height: 1600,
    platforms: [],
    spawnPoints: [],
    jumpPads: [],
    movingPlatforms: [],
    boxes: [],
  }
}

export default function MapBuilder({ mapId }: { mapId: string }) {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [map, setMap] = useState<GameMap | null>(null)
  const [mapName, setMapName] = useState('')
  const [mapData, setMapData] = useState<MapData>(defaultMapData())
  const [mapWidth, setMapWidth] = useState(2000)
  const [mapHeight, setMapHeight] = useState(1200)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [tool, setTool] = useState<Tool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cursorWorld, setCursorWorld] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const draggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const drawingRef = useRef(false)
  const drawStartRef = useRef({ x: 0, y: 0 })
  const panningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const spaceDownRef = useRef(false)
  const moveDragRef = useRef<{ id: string; kind: string; offsetX: number; offsetY: number } | null>(null)

  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [movingPath, setMovingPath] = useState<{ x: number; y: number }[]>([])

  useEffect(() => {
    apiFetch(`/maps/${mapId}`).then((res: any) => {
      const m = res.map as GameMap
      setMap(m)
      setMapName(m.name)
      setMapData(m.json ?? defaultMapData())
      setMapWidth(m.width)
      setMapHeight(m.height)
    })
  }, [mapId])

  const worldToScreen = useCallback(
    (wx: number, wy: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: wx, y: wy }
      return {
        x: wx * zoom + panX,
        y: wy * zoom + panY,
      }
    },
    [zoom, panX, panY]
  )

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      return {
        x: (sx - panX) / zoom,
        y: (sy - panY) / zoom,
      }
    },
    [zoom, panX, panY]
  )

  const getObjectAt = useCallback(
    (wx: number, wy: number): DrawableObject | null => {
      const d = mapData
      for (const b of d.boxes) {
        if (wx >= b.x && wx <= b.x + b.width && wy >= b.y && wy <= b.y + b.height) {
          return { kind: 'box', data: b }
        }
      }
      for (const p of d.platforms) {
        if (wx >= p.x && wx <= p.x + p.width && wy >= p.y && wy <= p.y + p.height) {
          return { kind: 'platform', data: p }
        }
      }
      for (const mp of d.movingPlatforms) {
        if (wx >= mp.x && wx <= mp.x + mp.width && wy >= mp.y && wy <= mp.y + mp.height) {
          return { kind: 'moving_platform', data: mp }
        }
      }
      for (const jp of d.jumpPads) {
        const dx = wx - jp.x
        const dy = wy - jp.y
        if (dx * dx + dy * dy < 20 * 20) {
          return { kind: 'jump_pad', data: jp }
        }
      }
      for (const sp of d.spawnPoints) {
        const dx = wx - sp.x
        const dy = wy - sp.y
        if (dx * dx + dy * dy < 15 * 15) {
          return { kind: 'spawn_point', data: sp }
        }
      }
      return null
    },
    [mapData]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const w = rect.width
    const h = rect.height

    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1 / zoom
    const gs = GRID_SIZE
    const startX = Math.floor(-panX / zoom / gs) * gs
    const startY = Math.floor(-panY / zoom / gs) * gs
    const endX = Math.ceil((w - panX) / zoom / gs) * gs
    const endY = Math.ceil((h - panY) / zoom / gs) * gs
    ctx.beginPath()
    for (let x = startX; x <= endX; x += gs) {
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
    }
    for (let y = startY; y <= endY; y += gs) {
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2 / zoom
    ctx.strokeRect(0, 0, mapWidth, mapHeight)

    const d = mapData

    for (const p of d.platforms) {
      const isHovered = hoveredId === p.id
      const isSelected = selectedId === p.id
      ctx.fillStyle = p.type === 'solid' ? '#475569' : '#2F80ED'
      ctx.fillRect(p.x, p.y, p.width, p.height)
      if (p.type === 'one_way') {
        ctx.strokeStyle = '#93C5FD'
        ctx.lineWidth = 2 / zoom
        ctx.setLineDash([6 / zoom, 4 / zoom])
        ctx.strokeRect(p.x, p.y, p.width, p.height)
        ctx.setLineDash([])
      }
      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#22C55E' : '#FBBF24'
        ctx.lineWidth = 2 / zoom
        ctx.strokeRect(p.x - 1, p.y - 1, p.width + 2, p.height + 2)
      }
    }

    for (const mp of d.movingPlatforms) {
      const isHovered = hoveredId === mp.id
      const isSelected = selectedId === mp.id
      ctx.fillStyle = '#8B5CF6'
      ctx.fillRect(mp.x, mp.y, mp.width, mp.height)
      ctx.strokeStyle = '#A78BFA'
      ctx.lineWidth = 1.5 / zoom
      ctx.strokeRect(mp.x, mp.y, mp.width, mp.height)

      if (mp.path.length > 0) {
        ctx.strokeStyle = '#A78BFA80'
        ctx.lineWidth = 1 / zoom
        ctx.setLineDash([4 / zoom, 4 / zoom])
        ctx.beginPath()
        ctx.moveTo(mp.x + mp.width / 2, mp.y + mp.height / 2)
        for (const pt of mp.path) {
          ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()
        ctx.setLineDash([])

        for (const pt of mp.path) {
          ctx.fillStyle = '#C4B5FD'
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 4 / zoom, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const cx = mp.x + mp.width / 2
      const cy = mp.y + mp.height / 2
      ctx.fillStyle = '#E0E7FF'
      ctx.beginPath()
      ctx.moveTo(cx + 6 / zoom, cy)
      ctx.lineTo(cx - 3 / zoom, cy - 4 / zoom)
      ctx.lineTo(cx - 3 / zoom, cy + 4 / zoom)
      ctx.closePath()
      ctx.fill()

      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#22C55E' : '#FBBF24'
        ctx.lineWidth = 2 / zoom
        ctx.strokeRect(mp.x - 1, mp.y - 1, mp.width + 2, mp.height + 2)
      }
    }

    for (const b of d.boxes) {
      const isHovered = hoveredId === b.id
      const isSelected = selectedId === b.id
      ctx.fillStyle = '#94A3B8'
      ctx.fillRect(b.x, b.y, b.width, b.height)
      ctx.strokeStyle = '#CBD5E1'
      ctx.lineWidth = 1 / zoom
      ctx.strokeRect(b.x, b.y, b.width, b.height)
      ctx.strokeStyle = '#64748B'
      ctx.lineWidth = 1 / zoom
      ctx.beginPath()
      ctx.moveTo(b.x, b.y + b.height / 2)
      ctx.lineTo(b.x + b.width, b.y + b.height / 2)
      ctx.moveTo(b.x + b.width / 2, b.y)
      ctx.lineTo(b.x + b.width / 2, b.y + b.height)
      ctx.stroke()

      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#22C55E' : '#FBBF24'
        ctx.lineWidth = 2 / zoom
        ctx.strokeRect(b.x - 1, b.y - 1, b.width + 2, b.height + 2)
      }
    }

    for (const jp of d.jumpPads) {
      const isHovered = hoveredId === jp.id
      const isSelected = selectedId === jp.id
      const sz = 14
      ctx.fillStyle = '#FF6B00'
      ctx.beginPath()
      ctx.moveTo(jp.x, jp.y - sz)
      ctx.lineTo(jp.x - sz, jp.y + sz / 2)
      ctx.lineTo(jp.x + sz, jp.y + sz / 2)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#FB923C'
      ctx.lineWidth = 1.5 / zoom
      ctx.stroke()

      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#22C55E' : '#FBBF24'
        ctx.lineWidth = 2 / zoom
        ctx.beginPath()
        ctx.arc(jp.x, jp.y, sz + 4, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    for (const sp of d.spawnPoints) {
      const isHovered = hoveredId === `sp_${sp.x}_${sp.y}`
      const isSelected = selectedId === `sp_${sp.x}_${sp.y}`
      ctx.fillStyle = '#22C55E'
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#4ADE80'
      ctx.lineWidth = 2 / zoom
      ctx.stroke()

      ctx.fillStyle = '#0F172A'
      ctx.font = `bold ${10 / zoom}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('S', sp.x, sp.y)

      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#22C55E' : '#FBBF24'
        ctx.lineWidth = 2 / zoom
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    if (drawRect) {
      ctx.strokeStyle = '#FBBF24'
      ctx.lineWidth = 1.5 / zoom
      ctx.setLineDash([6 / zoom, 3 / zoom])
      ctx.strokeRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h)
      ctx.setLineDash([])

      ctx.fillStyle = '#FBBF2420'
      ctx.fillRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h)

      ctx.fillStyle = '#FBBF24'
      ctx.font = `${11 / zoom}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(
        `${Math.round(drawRect.w)} x ${Math.round(drawRect.h)}`,
        drawRect.x + drawRect.w / 2,
        drawRect.y - 4 / zoom
      )
    }

    ctx.restore()

    ctx.fillStyle = '#94A3B8'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(
      `Cursor: ${Math.round(cursorWorld.x)}, ${Math.round(cursorWorld.y)}  |  Zoom: ${Math.round(zoom * 100)}%`,
      12,
      h - 12
    )
  }, [mapData, zoom, panX, panY, mapWidth, mapHeight, selectedId, hoveredId, cursorWorld, drawRect])

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const r = container.getBoundingClientRect()
      canvas.style.width = r.width + 'px'
      canvas.style.height = r.height + 'px'
      render()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceDownRef.current = true
      }
      if (e.code === 'Escape') {
        setSelectedId(null)
        setTool('select')
        setDrawRect(null)
        setMovingPath([])
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedId && document.activeElement === document.body) {
          deleteObject(selectedId)
          setSelectedId(null)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedId, mapData])

  const deleteObject = (id: string) => {
    setMapData((prev) => {
      const d = { ...prev }
      if (id.startsWith('sp_')) {
        const parts = id.split('_')
        const x = parseFloat(parts[1])
        const y = parseFloat(parts[2])
        d.spawnPoints = d.spawnPoints.filter((s) => s.x !== x || s.y !== y)
      } else {
        d.platforms = d.platforms.filter((p) => p.id !== id)
        d.jumpPads = d.jumpPads.filter((j) => j.id !== id)
        d.movingPlatforms = d.movingPlatforms.filter((m) => m.id !== id)
        d.boxes = d.boxes.filter((b) => b.id !== id)
      }
      return d
    })
    setDirty(true)
    setSelectedId(null)
  }

  const updateObject = (id: string, updates: Record<string, any>) => {
    setMapData((prev) => {
      const d = { ...prev }
      if (id.startsWith('sp_')) {
        const parts = id.split('_')
        const oldX = parseFloat(parts[1])
        const oldY = parseFloat(parts[2])
        d.spawnPoints = d.spawnPoints.map((s) => {
          if (s.x === oldX && s.y === oldY) {
            return { x: updates.x ?? s.x, y: updates.y ?? s.y }
          }
          return s
        })
        const newX = updates.x ?? oldX
        const newY = updates.y ?? oldY
        setSelectedId(`sp_${newX}_${newY}`)
      } else {
        d.platforms = d.platforms.map((p) => (p.id === id ? { ...p, ...updates } : p))
        d.jumpPads = d.jumpPads.map((j) => (j.id === id ? { ...j, ...updates } : j))
        d.movingPlatforms = d.movingPlatforms.map((m) => (m.id === id ? { ...m, ...updates } : m))
        d.boxes = d.boxes.map((b) => (b.id === id ? { ...b, ...updates } : b))
      }
      return d
    })
    setDirty(true)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const sx = e.clientX - r.left
    const sy = e.clientY - r.top
    const w = screenToWorld(sx, sy)

    if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
      panningRef.current = true
      panStartRef.current = { x: e.clientX, y: e.clientY, px: panX, py: panY }
      return
    }

    if (tool === 'select') {
      const obj = getObjectAt(w.x, w.y)
      if (obj) {
        let id: string | null = null
        if (obj.kind === 'spawn_point') {
          const sp = obj.data as { x: number; y: number }
          id = `sp_${sp.x}_${sp.y}`
        } else {
          id = (obj.data as any).id
        }
        setSelectedId(id)
        if (id) {
          let ox = 0
          let oy = 0
          if (obj.kind === 'platform' || obj.kind === 'box' || obj.kind === 'moving_platform') {
            const d = obj.data as Platform
            ox = w.x - d.x
            oy = w.y - d.y
          } else if (obj.kind === 'jump_pad') {
            const d = obj.data as JumpPad
            ox = w.x - d.x
            oy = w.y - d.y
          } else if (obj.kind === 'spawn_point') {
            const d = obj.data as { x: number; y: number }
            ox = w.x - d.x
            oy = w.y - d.y
          }
          moveDragRef.current = { id, kind: obj.kind, offsetX: ox, offsetY: oy }
        }
        return
      }
      setSelectedId(null)
      return
    }

    if (tool === 'delete') {
      const obj = getObjectAt(w.x, w.y)
      if (obj) {
        if (obj.kind === 'spawn_point') {
          const sp = obj.data as { x: number; y: number }
          deleteObject(`sp_${sp.x}_${sp.y}`)
        } else {
          deleteObject((obj.data as any).id)
        }
      }
      return
    }

    if (tool === 'spawn_point') {
      setMapData((prev) => ({
        ...prev,
        spawnPoints: [...prev.spawnPoints, { x: Math.round(w.x), y: Math.round(w.y) }],
      }))
      setDirty(true)
      return
    }

    if (tool === 'jump_pad') {
      const id = generateId()
      setMapData((prev) => ({
        ...prev,
        jumpPads: [...prev.jumpPads, { id, x: Math.round(w.x), y: Math.round(w.y), force: 15 }],
      }))
      setSelectedId(id)
      setDirty(true)
      return
    }

    drawingRef.current = true
    drawStartRef.current = { x: Math.round(w.x), y: Math.round(w.y) }

    if (tool === 'moving_platform') {
      setMovingPath([{ x: Math.round(w.x), y: Math.round(w.y) }])
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const sx = e.clientX - r.left
    const sy = e.clientY - r.top
    const w = screenToWorld(sx, sy)
    setCursorWorld(w)

    if (panningRef.current) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPanX(panStartRef.current.px + dx)
      setPanY(panStartRef.current.py + dy)
      return
    }

    if (moveDragRef.current) {
      const md = moveDragRef.current
      const nx = Math.round(w.x - md.offsetX)
      const ny = Math.round(w.y - md.offsetY)
      if (md.kind === 'spawn_point') {
        const parts = md.id.split('_')
        const oldX = parseFloat(parts[1])
        const oldY = parseFloat(parts[2])
        setMapData((prev) => ({
          ...prev,
          spawnPoints: prev.spawnPoints.map((s) =>
            s.x === oldX && s.y === oldY ? { x: nx, y: ny } : s
          ),
        }))
        setSelectedId(`sp_${nx}_${ny}`)
      } else {
        updateObject(md.id, { x: nx, y: ny })
      }
      setDirty(true)
      return
    }

    if (drawingRef.current) {
      const sx0 = drawStartRef.current.x
      const sy0 = drawStartRef.current.y
      const w2 = Math.round(w.x)
      const w2y = Math.round(w.y)
      setDrawRect({
        x: Math.min(sx0, w2),
        y: Math.min(sy0, w2y),
        w: Math.abs(w2 - sx0),
        h: Math.abs(w2y - sy0),
      })
      return
    }

    const obj = getObjectAt(w.x, w.y)
    if (obj) {
      if (obj.kind === 'spawn_point') {
        const sp = obj.data as { x: number; y: number }
        setHoveredId(`sp_${sp.x}_${sp.y}`)
      } else {
        setHoveredId((obj.data as any).id)
      }
      canvas.style.cursor = tool === 'delete' ? 'crosshair' : tool === 'select' ? 'grab' : 'crosshair'
    } else {
      setHoveredId(null)
      canvas.style.cursor =
        tool === 'select'
          ? 'default'
          : tool === 'delete'
          ? 'crosshair'
          : 'crosshair'
    }
  }

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (panningRef.current) {
      panningRef.current = false
      return
    }

    if (moveDragRef.current) {
      moveDragRef.current = null
      return
    }

    if (!drawingRef.current) return
    drawingRef.current = false

    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const sx = e.clientX - r.left
    const sy = e.clientY - r.top
    const w = screenToWorld(sx, sy)

    const sx0 = drawStartRef.current.x
    const sy0 = drawStartRef.current.y
    const w2 = Math.round(w.x)
    const w2y = Math.round(w.y)
    const x = Math.min(sx0, w2)
    const y = Math.min(sy0, w2y)
    const width = Math.abs(w2 - sx0)
    const height = Math.abs(w2y - sy0)

    setDrawRect(null)

    if (width < 8 && height < 8 && tool !== 'moving_platform') return

    if (tool === 'platform') {
      const id = generateId()
      setMapData((prev) => ({
        ...prev,
        platforms: [
          ...prev.platforms,
          { id, x, y, width, height, type: 'solid' as const },
        ],
      }))
      setSelectedId(id)
      setDirty(true)
    } else if (tool === 'one_way_platform') {
      const id = generateId()
      setMapData((prev) => ({
        ...prev,
        platforms: [
          ...prev.platforms,
          { id, x, y, width, height, type: 'one_way' as const },
        ],
      }))
      setSelectedId(id)
      setDirty(true)
    } else if (tool === 'box') {
      const id = generateId()
      setMapData((prev) => ({
        ...prev,
        boxes: [
          ...prev.boxes,
          { id, x, y, width: width || 32, height: height || 32, health: 3 },
        ],
      }))
      setSelectedId(id)
      setDirty(true)
    } else if (tool === 'moving_platform') {
      const id = generateId()
      setMapData((prev) => ({
        ...prev,
        movingPlatforms: [
          ...prev.movingPlatforms,
          {
            id,
            x,
            y,
            width: width || 128,
            height: height || 24,
            speed: 2,
            path: [...movingPath, { x: w2, y: w2y }],
          },
        ],
      }))
      setSelectedId(id)
      setMovingPath([])
      setDirty(true)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top

    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor))

    const wx = (mx - panX) / zoom
    const wy = (my - panY) / zoom

    setPanX(mx - wx * newZoom)
    setPanY(my - wy * newZoom)
    setZoom(newZoom)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch(`/maps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mapName,
          width: mapWidth,
          height: mapHeight,
          json: mapData,
        }),
      })
      setDirty(false)
    } catch (err) {
      console.error('Failed to save map:', err)
    }
    setSaving(false)
  }

  const findSelected = () => {
    if (!selectedId) return null
    if (selectedId.startsWith('sp_')) {
      const parts = selectedId.split('_')
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const sp = mapData.spawnPoints.find((s) => s.x === x && s.y === y)
      if (sp) return { kind: 'spawn_point' as const, data: sp }
      return null
    }
    const p = mapData.platforms.find((p) => p.id === selectedId)
    if (p) return { kind: 'platform' as const, data: p }
    const jp = mapData.jumpPads.find((j) => j.id === selectedId)
    if (jp) return { kind: 'jump_pad' as const, data: jp }
    const mp = mapData.movingPlatforms.find((m) => m.id === selectedId)
    if (mp) return { kind: 'moving_platform' as const, data: mp }
    const b = mapData.boxes.find((b) => b.id === selectedId)
    if (b) return { kind: 'box' as const, data: b }
    return null
  }

  const selectedObj = findSelected()

  const totalObjects =
    mapData.platforms.length +
    mapData.spawnPoints.length +
    mapData.jumpPads.length +
    mapData.movingPlatforms.length +
    mapData.boxes.length

  const toolDefs: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <Pointer size={18} />, label: 'Select' },
    { id: 'platform', icon: <Square size={18} />, label: 'Platform' },
    { id: 'one_way_platform', icon: <ChevronUp size={18} />, label: 'One-Way' },
    { id: 'spawn_point', icon: <MapPin size={18} />, label: 'Spawn' },
    { id: 'jump_pad', icon: <ChevronUp size={18} />, label: 'Jump Pad' },
    { id: 'moving_platform', icon: <Move size={18} />, label: 'Move Plt' },
    { id: 'box', icon: <BoxIcon size={18} />, label: 'Box' },
    { id: 'delete', icon: <Trash2 size={18} />, label: 'Delete' },
  ]

  const renderPropsPanel = () => {
    if (!selectedObj) return null

    const fields: React.ReactNode[] = []

    const kindLabel = {
      platform: 'Platform',
      spawn_point: 'Spawn Point',
      jump_pad: 'Jump Pad',
      moving_platform: 'Moving Platform',
      box: 'Box',
    }[selectedObj.kind]

    const kindColor = {
      platform: '#475569',
      spawn_point: '#22C55E',
      jump_pad: '#FF6B00',
      moving_platform: '#8B5CF6',
      box: '#94A3B8',
    }[selectedObj.kind]

    fields.push(
      <div key="type" className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: kindColor }} />
        <span className="text-sm font-medium" style={{ color: kindColor }}>
          {kindLabel}
        </span>
      </div>
    )

    if (selectedObj.kind === 'platform') {
      const p = selectedObj.data as Platform
      fields.push(
        <div key="type_field" className="mb-2">
          <label className="text-xs text-gray-400 block mb-1">Platform Type</label>
          <select
            value={p.type}
            onChange={(e) => updateObject(p.id, { type: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          >
            <option value="solid">Solid</option>
            <option value="one_way">One-Way</option>
          </select>
        </div>
      )
    }

    if ('x' in selectedObj.data && 'y' in selectedObj.data) {
      const d = selectedObj.data as { id?: string; x: number; y: number; width?: number; height?: number }
      fields.push(
        <div key="pos" className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">X</label>
            <input
              type="number"
              value={Math.round(d.x)}
              onChange={(e) => updateObject(d.id!, { x: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Y</label>
            <input
              type="number"
              value={Math.round(d.y)}
              onChange={(e) => updateObject(d.id!, { y: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      )
    }

    if ('width' in selectedObj.data && 'height' in selectedObj.data && selectedObj.kind !== 'spawn_point') {
      const d = selectedObj.data as { id: string; width: number; height: number }
      fields.push(
        <div key="size" className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Width</label>
            <input
              type="number"
              value={Math.round(d.width)}
              onChange={(e) => updateObject(d.id, { width: parseInt(e.target.value) || 1 })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Height</label>
            <input
              type="number"
              value={Math.round(d.height)}
              onChange={(e) => updateObject(d.id, { height: parseInt(e.target.value) || 1 })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      )
    }

    if (selectedObj.kind === 'jump_pad') {
      const jp = selectedObj.data as JumpPad
      fields.push(
        <div key="force" className="mb-2">
          <label className="text-xs text-gray-400 block mb-1">Force</label>
          <input
            type="number"
            value={jp.force}
            onChange={(e) => updateObject(jp.id, { force: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          />
        </div>
      )
    }

    if (selectedObj.kind === 'moving_platform') {
      const mp = selectedObj.data as MovingPlatform
      fields.push(
        <div key="speed" className="mb-2">
          <label className="text-xs text-gray-400 block mb-1">Speed</label>
          <input
            type="number"
            step="0.5"
            value={mp.speed}
            onChange={(e) => updateObject(mp.id, { speed: parseFloat(e.target.value) || 0.5 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          />
        </div>
      )
    }

    if (selectedObj.kind === 'box') {
      const b = selectedObj.data as Box
      fields.push(
        <div key="health" className="mb-2">
          <label className="text-xs text-gray-400 block mb-1">Health</label>
          <input
            type="number"
            value={b.health}
            onChange={(e) => updateObject(b.id, { health: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          />
        </div>
      )
    }

    const objId = selectedObj.kind === 'spawn_point'
      ? `sp_${(selectedObj.data as any).x}_${(selectedObj.data as any).y}`
      : (selectedObj.data as any).id

    fields.push(
      <button
        key="delete"
        onClick={() => {
          deleteObject(objId)
          setSelectedId(null)
        }}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2 text-sm transition-colors"
      >
        <Trash2 size={14} />
        Delete Object
      </button>
    )

    return (
      <div className="p-3 border-b border-gray-700">
        {fields}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#1E293B] border-b border-[#334155]">
        <button
          onClick={() => navigate('/maps')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="h-5 w-px bg-gray-600" />

        <input
          value={mapName}
          onChange={(e) => {
            setMapName(e.target.value)
            setDirty(true)
          }}
          className="bg-transparent border-b border-gray-600 focus:border-[#2F80ED] outline-none text-white font-medium px-2 py-1 text-sm w-48"
          placeholder="Map name..."
        />

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>W:</span>
          <input
            type="number"
            value={mapWidth}
            onChange={(e) => {
              setMapWidth(parseInt(e.target.value) || 1000)
              setDirty(true)
            }}
            className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-white text-xs"
          />
          <span>H:</span>
          <input
            type="number"
            value={mapHeight}
            onChange={(e) => {
              setMapHeight(parseInt(e.target.value) || 1000)
              setDirty(true)
            }}
            className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-white text-xs"
          />
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        <div className="flex-1" />

        {dirty && (
          <span className="text-xs text-yellow-400 mr-2">Unsaved changes</span>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            saving
              ? 'bg-gray-600 text-gray-400'
              : 'bg-[#2F80ED] hover:bg-[#1D6FD1] text-white'
          }`}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-14 bg-[#1E293B] border-r border-[#334155] flex flex-col items-center py-2 gap-1">
          {toolDefs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                tool === t.id
                  ? 'bg-[#2F80ED] text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              } ${t.id === 'delete' && tool === t.id ? '!bg-red-600' : ''}`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => {
              if (panningRef.current) panningRef.current = false
              if (drawingRef.current) {
                drawingRef.current = false
                setDrawRect(null)
              }
              if (moveDragRef.current) moveDragRef.current = null
            }}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Tool hint */}
          <div className="absolute top-3 left-3 bg-[#1E293B]/90 border border-[#334155] rounded px-3 py-1.5 text-xs text-gray-400 pointer-events-none">
            {tool === 'select' && 'Click to select · Drag to move · Scroll to zoom'}
            {tool === 'platform' && 'Click + drag to draw solid platform'}
            {tool === 'one_way_platform' && 'Click + drag to draw one-way platform'}
            {tool === 'spawn_point' && 'Click to place spawn point'}
            {tool === 'jump_pad' && 'Click to place jump pad'}
            {tool === 'moving_platform' && 'Click + drag to draw moving platform'}
            {tool === 'box' && 'Click + drag to draw box'}
            {tool === 'delete' && 'Click an object to delete it'}
          </div>
        </div>

        {/* Right properties panel */}
        {selectedObj && (
          <div className="w-56 bg-[#1E293B] border-l border-[#334155] overflow-y-auto flex-shrink-0">
            <div className="px-3 py-2 border-b border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</h3>
            </div>
            {renderPropsPanel()}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-[#1E293B] border-t border-[#334155] text-xs text-gray-400">
        <span>Total: {totalObjects} objects</span>
        <span>|</span>
        <span>Platforms: {mapData.platforms.length}</span>
        <span>Spawns: {mapData.spawnPoints.length}</span>
        <span>Jump Pads: {mapData.jumpPads.length}</span>
        <span>Moving: {mapData.movingPlatforms.length}</span>
        <span>Boxes: {mapData.boxes.length}</span>
        <div className="flex-1" />
        <span>Grid: {GRID_SIZE}px</span>
        <span>|</span>
        <span>
          {Math.round(cursorWorld.x)}, {Math.round(cursorWorld.y)}
        </span>
      </div>
    </div>
  )
}
