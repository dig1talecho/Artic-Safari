'use client'

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

/**
 * One map for the whole journey.
 *
 * The console used to render a separate map under each address field:
 * two disconnected rectangles showing two lonely pins, with no sense of
 * the trip between them. This shows both ends and the line joining them,
 * which is the thing a guest is actually trying to confirm — that the
 * route is the one they meant.
 *
 * Falls back to a single pin while only one end is known, so it appears
 * as soon as there is anything to show rather than waiting for both.
 */

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'

/** Cyan halo for the pickup — where the car is going. */
const originIcon = L.divIcon({
  className: '',
  html: '<div class="route-pin route-pin--origin"><span></span></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/** Hollow ring for the destination, so the two never read as the same thing. */
const destinationIcon = L.divIcon({
  className: '',
  html: '<div class="route-pin route-pin--destination"><span></span></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export interface Point {
  lat: number
  lon: number
}

/**
 * Leaflet does not re-frame on prop changes, and remounting the whole map
 * on every keystroke would flash the tiles. This fits the view instead,
 * inside the existing map instance.
 */
function FitBounds({ origin, destination }: { origin: Point | null; destination: Point | null }) {
  const map = useMap()

  useEffect(() => {
    if (origin && destination) {
      map.fitBounds(
        L.latLngBounds([origin.lat, origin.lon], [destination.lat, destination.lon]),
        // Generous padding so neither pin sits under the rounded corners.
        { padding: [38, 38], maxZoom: 15, animate: true },
      )
    } else if (origin) {
      map.setView([origin.lat, origin.lon], 14, { animate: true })
    } else if (destination) {
      map.setView([destination.lat, destination.lon], 14, { animate: true })
    }
  }, [map, origin, destination])

  return null
}

export function RouteMap({
  origin,
  destination,
  className = '',
}: {
  origin: Point | null
  destination: Point | null
  className?: string
}) {
  const anchor = origin ?? destination
  if (!anchor) return null

  return (
    <div className={`route-map relative overflow-hidden rounded-2xl ${className}`}>
      <MapContainer
        center={[anchor.lat, anchor.lon]}
        zoom={13}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <FitBounds origin={origin} destination={destination} />

        {origin && destination && (
          <>
            {/* Two strokes: a soft wide glow under a bright thin line, so
                the route reads on dark tiles without hiding the streets. */}
            <Polyline
              positions={[
                [origin.lat, origin.lon],
                [destination.lat, destination.lon],
              ]}
              pathOptions={{ color: '#67e8f9', weight: 9, opacity: 0.16, lineCap: 'round' }}
            />
            <Polyline
              positions={[
                [origin.lat, origin.lon],
                [destination.lat, destination.lon],
              ]}
              pathOptions={{
                color: '#a5f3fc',
                weight: 2,
                opacity: 0.9,
                dashArray: '1 7',
                lineCap: 'round',
              }}
            />
          </>
        )}

        {origin && <Marker position={[origin.lat, origin.lon]} icon={originIcon} />}
        {destination && <Marker position={[destination.lat, destination.lon]} icon={destinationIcon} />}
      </MapContainer>

      {/* Cold cast over the tiles so the map belongs to the frozen panel
          instead of sitting in it as a foreign rectangle. */}
      <div className="route-map__chill" aria-hidden="true" />

      {/* Attribution, placed by us. Leaflet's own control wrapped onto two
          lines and spilled outside the rounded corner. */}
      <p
        className="pointer-events-auto absolute bottom-0 right-0 z-[500] rounded-tl-lg bg-[rgba(4,16,22,0.72)] px-2 py-0.5 text-[9px] leading-none text-white/45 [&_a]:text-white/60 [&_a:hover]:text-[#67e8f9]"
        dangerouslySetInnerHTML={{ __html: ATTRIBUTION }}
      />
    </div>
  )
}
