'use client'

import { useEffect, useRef } from 'react'
import type { KpForecastPoint } from '@/services/aurora.service'

interface AuroraWaveformProps {
  forecast: KpForecastPoint[]
  currentKp: number
}

/**
 * Canvas rendering of the REAL Kp forecast (services/aurora.service.ts) --
 * point positions are exact, never randomized. Only the color shimmer
 * animates, as pure ambient decoration; the data shape itself is static
 * and truthful to what NOAA actually returned.
 */
export function AuroraWaveform({ forecast, currentKp }: AuroraWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || forecast.length === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const maxKp = 9
    const padX = 24
    const padY = 20
    const plotW = width - padX * 2
    const plotH = height - padY * 2

    const points = forecast.map((f, i) => ({
      x: padX + (i / (forecast.length - 1 || 1)) * plotW,
      y: padY + plotH - (f.kp / maxKp) * plotH,
      kp: f.kp,
    }))

    const hue = 195 - (currentKp / maxKp) * 45 // cyan -> green as activity rises
    let frame = 0
    let raf = 0

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Smooth path through the real data points (Catmull-Rom-ish via quadratic mids)
      const path = new Path2D()
      path.moveTo(points[0].x, points[0].y)
      for (let i = 0; i < points.length - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2
        const my = (points[i].y + points[i + 1].y) / 2
        path.quadraticCurveTo(points[i].x, points[i].y, mx, my)
      }
      path.quadraticCurveTo(
        points[points.length - 1].x,
        points[points.length - 1].y,
        points[points.length - 1].x,
        points[points.length - 1].y,
      )

      // Ambient shimmer: hue drifts a few degrees, pure decoration, no data change.
      const shimmer = reduceMotion ? 0 : Math.sin(frame * 0.015) * 8
      const liveHue = hue + shimmer

      // Fill under the curve
      const fillPath = new Path2D(path)
      fillPath.lineTo(points[points.length - 1].x, height - padY)
      fillPath.lineTo(points[0].x, height - padY)
      fillPath.closePath()
      const gradient = ctx.createLinearGradient(0, padY, 0, height - padY)
      gradient.addColorStop(0, `hsla(${liveHue}, 85%, 65%, 0.28)`)
      gradient.addColorStop(1, `hsla(${liveHue}, 85%, 65%, 0)`)
      ctx.fillStyle = gradient
      ctx.fill(fillPath)

      // Glow passes
      for (const blur of [14, 6, 0]) {
        ctx.save()
        ctx.filter = blur ? `blur(${blur}px)` : 'none'
        ctx.strokeStyle = `hsla(${liveHue}, 90%, 70%, ${blur ? 0.35 : 0.95})`
        ctx.lineWidth = blur ? 4 : 2
        ctx.stroke(path)
        ctx.restore()
      }

      // Real data point markers
      points.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${liveHue}, 90%, 75%, 0.9)`
        ctx.fill()
      })

      frame++
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [forecast, currentKp])

  return <canvas ref={canvasRef} className="h-40 w-full" aria-hidden="true" />
}
