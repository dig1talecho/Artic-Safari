'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Search, Loader2, LocateFixed, ExternalLink, X } from 'lucide-react'
import type { GeocodeResult } from '@/app/api/geocode/search/route'

const LiveMap = dynamic(() => import('./live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-36 w-full animate-pulse rounded-2xl bg-[var(--home-surface-soft)]" />,
})

const MAP_LINK_CLASS =
  'flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1.5 text-xs font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]'

/**
 * One-tap navigation for whichever map app the viewer actually has --
 * Google Maps and Apple Maps both resolve to their native app via
 * universal links on mobile and fall back to the web viewer on desktop,
 * so this single pair of links covers "Google Maps, Apple Maps, or web."
 *
 * Takes either exact coordinates or a plain address string. The address
 * form matters: a guest can type a place the geocoder doesn't know (a new
 * cabin, a private address) and still needs a way to check it resolves
 * before a driver is sent there.
 */
export function MapOpenButtons(
  props: { lat: number; lon: number; query?: never } | { query: string; lat?: never; lon?: never },
) {
  const google =
    props.query !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.query)}`
      : `https://www.google.com/maps?q=${props.lat},${props.lon}`

  const apple =
    props.query !== undefined
      ? `https://maps.apple.com/?q=${encodeURIComponent(props.query)}`
      : `https://maps.apple.com/?ll=${props.lat},${props.lon}&q=Pickup+Location`

  return (
    <div className="flex flex-wrap gap-2">
      <a href={google} target="_blank" rel="noopener noreferrer" className={MAP_LINK_CLASS}>
        <ExternalLink className="h-3.5 w-3.5" />
        Google Maps
      </a>
      <a href={apple} target="_blank" rel="noopener noreferrer" className={MAP_LINK_CLASS}>
        <ExternalLink className="h-3.5 w-3.5" />
        Apple Maps
      </a>
    </div>
  )
}

/**
 * Adds "Tromsø, Norway" to a bare place name so a map search can't land on
 * a same-named street in another country. Skipped when the text already
 * says Tromsø, which is the common case for geocoder results.
 */
export function withTromsoContext(query: string) {
  const q = query.trim()
  if (!q) return q
  return /troms[øo]/i.test(q) ? q : `${q}, Tromsø, Norway`
}

/**
 * Real-time destination search: every keystroke (debounced 250ms) queries
 * /api/geocode/search, which proxies Photon (a keyless, prefix-aware OSM
 * geocoder) scoped to the Tromsø region -- so "t" genuinely surfaces
 * Tromsø Airport, Tromsø domkirke, Tromsdalen, etc. as the user types,
 * not a fixed local list. Selecting a result drops a live pin on an
 * inline map at its real coordinates. Shared by the dispatch console and
 * the custom-route taximeter so both address fields work identically.
 *
 * LIVE LOCATION IS OPT-IN AND OWNED HERE. It used to be driven from the
 * parent through a `liveLocation` prop derived from the parent's pickup
 * coords -- which meant that merely *picking a search result* set those
 * coords, changed the prop, fired the adoption effect, and relabelled the
 * guest's chosen address as "My Current Location". Both call sites made
 * the same mistake, because the prop shape invited it.
 *
 * Geolocation now lives inside this component and is adopted
 * synchronously in the button's own click handler. There is no derived
 * state and no effect left to misfire, so typing or selecting an address
 * can never trigger a location request. The device is only ever asked
 * when the guest presses the button.
 */
export function AddressAutocomplete({
  value,
  onChange,
  label,
  fieldIcon,
  placeholder,
  onCoordsChange,
  allowLiveLocation = false,
  showMap = true,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  fieldIcon: React.ReactNode
  placeholder: string
  onCoordsChange?: (coords: { lat: number; lon: number } | null) => void
  /** Shows the optional "Use my location" button. Never auto-triggered. */
  allowLiveLocation?: boolean
  /**
   * Set false when the parent draws its own map. The taxi console shows
   * one route map for both ends instead of a lonely pin under each field.
   */
  showMap?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'error'>('idle')
  const [geoError, setGeoError] = useState('')
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
        setActiveIndex(-1)
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

  function clearField() {
    onChange('')
    setSelected(false)
    setSelectedResult(null)
    onCoordsChange?.(null)
    setGeoStatus('idle')
    setGeoError('')
  }

  /**
   * Only ever runs from the button's onClick. Adopts the device fix as if
   * it were a chosen search result -- same pin, same Open in Maps links --
   * so there is one selection flow rather than a separate "live" mode.
   */
  function requestLiveLocation() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoError('Location is not supported on this device.')
      return
    }

    setGeoStatus('locating')
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const name = `My Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`

        onChange(name)
        setSelected(true)
        setSelectedResult({ id: 'live-location', name, address: '', lat, lon, type: 'live' })
        onCoordsChange?.({ lat, lon })
        setOpen(false)
        setGeoStatus('idle')
      },
      (error) => {
        setGeoStatus('error')
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Type an address instead.'
            : 'Could not get your location. Type an address instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)] focus-within:[background-image:radial-gradient(160px_60px_at_15%_50%,var(--home-accent-soft),transparent_70%)]">
        <span className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
            <span className="text-[var(--home-accent)]">{fieldIcon}</span>
            {label}
          </span>
          {allowLiveLocation && (
            <button
              type="button"
              onClick={requestLiveLocation}
              disabled={geoStatus === 'locating'}
              title="Optional — use my current location instead of typing an address"
              aria-label="Optional: use my current location"
              className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--home-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--home-accent)] transition-colors hover:bg-[var(--home-accent)] hover:text-white disabled:opacity-60"
            >
              {geoStatus === 'locating' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LocateFixed className="h-3 w-3" />
              )}
              {geoStatus === 'locating' ? 'Locating' : 'Use my location'}
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
            onKeyDown={(e) => {
              // Arrow keys move a highlight; Enter takes it. Without this
              // the list was mouse-only, which fails a keyboard user and
              // is slower for everyone else.
              if (!open || results.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => (i + 1) % results.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
              } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault()
                handleSelect(results[activeIndex])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
          />
          {selected && value && <MapPin className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />}
          {value && (
            <button
              type="button"
              onClick={clearField}
              aria-label={`Clear ${label}`}
              title="Clear"
              className="shrink-0 rounded-full p-0.5 text-[var(--home-muted)] transition-colors hover:text-[var(--home-foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </label>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="frost-menu absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-64 overflow-y-auto rounded-2xl py-1"
        >
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => handleSelect(r)}
                className={`frost-menu__item flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'frost-menu__item--active' : ''
                }`}
                data-active={i === activeIndex}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#67e8f9]" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-white">{r.name}</span>
                  {r.address && <span className="truncate text-xs text-white/45">{r.address}</span>}
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
      {geoStatus === 'error' && geoError && !open && (
        <button
          type="button"
          onClick={requestLiveLocation}
          className="mt-1 text-left text-[11px] text-destructive underline underline-offset-2"
        >
          {geoError} Retry
        </button>
      )}

      {selectedResult ? (
        <div className="mt-2 space-y-2">
          {showMap && <LiveMap lat={selectedResult.lat} lon={selectedResult.lon} />}
          <MapOpenButtons lat={selectedResult.lat} lon={selectedResult.lon} />
        </div>
      ) : (
        // Typed something the geocoder didn't match, so there are no
        // coordinates to pin -- but the guest can still check the text
        // resolves to the right place before a driver is dispatched.
        !open &&
        value.trim().length > 2 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-[var(--home-muted)]">
              Using your typed address. Check it opens the right place:
            </p>
            <MapOpenButtons query={withTromsoContext(value)} />
          </div>
        )
      )}
    </div>
  )
}
