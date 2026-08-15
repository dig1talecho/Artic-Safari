'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Search, Loader2, LocateFixed, ExternalLink } from 'lucide-react'
import type { GeocodeResult } from '@/app/api/geocode/search/route'

const LiveMap = dynamic(() => import('./live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-36 w-full animate-pulse rounded-2xl bg-[var(--home-surface-soft)]" />,
})

/**
 * One-tap navigation for whichever map app the viewer actually has --
 * Google Maps and Apple Maps both resolve to their native app via
 * universal links on mobile and fall back to the web viewer on desktop,
 * so this single pair of links covers "Google Maps, Apple Maps, or web."
 */
export function MapOpenButtons({ lat, lon }: { lat: number; lon: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://www.google.com/maps?q=${lat},${lon}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1.5 text-xs font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Google Maps
      </a>
      <a
        href={`https://maps.apple.com/?ll=${lat},${lon}&q=Pickup+Location`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1.5 text-xs font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Apple Maps
      </a>
    </div>
  )
}

/**
 * Real-time destination search: every keystroke (debounced 250ms) queries
 * /api/geocode/search, which proxies Photon (a keyless, prefix-aware OSM
 * geocoder) scoped to the Tromsø region -- so "t" genuinely surfaces
 * Tromsø Airport, Tromsø domkirke, Tromsdalen, etc. as the user types,
 * not a fixed local list. Selecting a result drops a live pin on an
 * inline map at its real coordinates. Shared by the dispatch console and
 * the custom-route taximeter so both address fields work identically.
 */
export function AddressAutocomplete({
  value,
  onChange,
  label,
  fieldIcon,
  placeholder,
  onCoordsChange,
  liveLocation,
  onRequestLiveLocation,
  liveLocating,
  liveError,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  fieldIcon: React.ReactNode
  placeholder: string
  onCoordsChange?: (coords: { lat: number; lon: number } | null) => void
  liveLocation?: { coords: { lat: number; lon: number }; nonce: number } | null
  onRequestLiveLocation?: () => void
  liveLocating?: boolean
  liveError?: string
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = value.trim()
    if (selected || q.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const data = await res.json()
        setResults(res.ok ? (data.results ?? []) : [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, selected])

  // Adopts a device-geolocation pickup ("Live" button) into this combobox
  // exactly as if it were a chosen search result -- same map pin, same
  // Open in Maps buttons -- instead of a separate hardcoded "live" mode.
  useEffect(() => {
    if (!liveLocation) return
    const label = `My Current Location (${liveLocation.coords.lat.toFixed(4)}, ${liveLocation.coords.lon.toFixed(4)})`
    onChange(label)
    setSelected(true)
    setSelectedResult({
      id: 'live-location',
      name: label,
      address: '',
      lat: liveLocation.coords.lat,
      lon: liveLocation.coords.lon,
      type: 'live',
    })
    setOpen(false)
    // Only re-sync when a fresh location comes in, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLocation?.nonce])

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  function handleSelect(result: GeocodeResult) {
    onChange(result.name)
    setSelected(true)
    setSelectedResult(result)
    onCoordsChange?.({ lat: result.lat, lon: result.lon })
    setOpen(false)
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)] focus-within:[background-image:radial-gradient(160px_60px_at_15%_50%,var(--home-accent-soft),transparent_70%)]">
        <span className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
            <span className="text-[var(--home-accent)]">{fieldIcon}</span>
            {label}
          </span>
          {onRequestLiveLocation && (
            <button
              type="button"
              onClick={onRequestLiveLocation}
              title="Use my current location"
              className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--home-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--home-accent)] transition-colors hover:bg-[var(--home-accent)] hover:text-white"
            >
              {liveLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
              Live
            </button>
          )}
        </span>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--home-accent)]" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-[var(--home-muted)]" />
          )}
          <input
            type="text"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setSelected(false)
              setSelectedResult(null)
              onCoordsChange?.(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
          />
          {selected && value && <MapPin className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />}
        </div>
      </label>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
        >
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected={value === r.name}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--home-surface-soft)]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-[var(--home-foreground)]">{r.name}</span>
                  {r.address && <span className="truncate text-xs text-[var(--home-muted)]">{r.address}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && value.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-2.5 text-xs text-[var(--home-muted)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
          No matches for “{value}” in the Tromsø area
        </div>
      )}
      {liveError && !open && (
        <button
          type="button"
          onClick={onRequestLiveLocation}
          className="mt-1 text-left text-[11px] text-destructive underline underline-offset-2"
        >
          {liveError} Retry
        </button>
      )}

      {selectedResult && (
        <div className="mt-2 space-y-2">
          <LiveMap lat={selectedResult.lat} lon={selectedResult.lon} />
          <MapOpenButtons lat={selectedResult.lat} lon={selectedResult.lon} />
        </div>
      )}
    </div>
  )
}
