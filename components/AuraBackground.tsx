'use client'

import { useEffect, useRef, useState } from 'react'

type AuraState = 'idle' | 'thinking' | 'generating'

interface AuraBackgroundProps {
  state: AuraState
}

export default function AuraBackground({ state }: AuraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const orbs = [
      { x: 0.2, y: 0.3, r: 0.35 },
      { x: 0.8, y: 0.7, r: 0.3 },
      { x: 0.5, y: 0.9, r: 0.25 },
    ]

    const draw = (ts: number) => {
      const t = ts / 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#050508'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const speed = state === 'thinking' ? 2.5 : state === 'generating' ? 4 : 0.5
      const intensity = state === 'thinking' ? 0.18 : state === 'generating' ? 0.28 : 0.10

      const colors =
        state === 'generating'
          ? ['#ec4899', '#8b5cf6', '#06b6d4']
          : state === 'thinking'
          ? ['#6366f1', '#8b5cf6', '#3b82f6']
          : ['#4f46e5', '#7c3aed', '#1d4ed8']

      orbs.forEach((orb, i) => {
        const ox = canvas.width * (orb.x + 0.08 * Math.sin(t * speed + i * 2.1))
        const oy = canvas.height * (orb.y + 0.06 * Math.cos(t * speed + i * 1.7))
        const radius = Math.min(canvas.width, canvas.height) * (orb.r + 0.04 * Math.sin(t * speed * 0.8 + i))

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius)
        grad.addColorStop(0, hexToRgba(colors[i % colors.length], intensity))
        grad.addColorStop(1, hexToRgba(colors[i % colors.length], 0))
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(ox, oy, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [state, mounted])

  if (!mounted) return <div className="fixed inset-0" style={{ background: '#050508', zIndex: 0 }} />

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
