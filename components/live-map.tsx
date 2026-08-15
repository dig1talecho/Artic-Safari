'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

// Dark CARTO basemap (free, keyless, no usage restriction beyond
// attribution) to match the site's dark theme instead of the default
// light OSM tiles.
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'

const pinIcon = L.divIcon({
  className: '',
  html: '<div class="live-map-pin"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface LiveMapProps {
  lat: number
  lon: number
}

/** Compact preview map with a real pin at the geocoded coordinates.
 * Remounted (via key) on coordinate change since MapContainer doesn't
 * reactively re-center on prop changes after first mount. */
export function LiveMap({ lat, lon }: LiveMapProps) {
  return (
    <div className="h-36 w-full overflow-hidden rounded-2xl border border-[var(--home-border)]">
      <MapContainer
        key={`${lat}-${lon}`}
        center={[lat, lon]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <Marker position={[lat, lon]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
