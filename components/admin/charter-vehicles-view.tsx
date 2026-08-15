'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Loader2, Save } from 'lucide-react'
import {
  listCharterVehicles,
  updateCharterVehicle,
  uploadCharterVehicleImage,
  type CharterVehicle,
} from '@/services/charter-vehicles.service'
import { compressImage } from '@/lib/image-compress'

function VehicleCard({
  vehicle,
  onSaved,
}: {
  vehicle: CharterVehicle
  onSaved: (updated: CharterVehicle) => void
}) {
  const [label, setLabel] = useState(vehicle.label)
  const [capacityLabel, setCapacityLabel] = useState(vehicle.capacity_label)
  const [dayRate, setDayRate] = useState(vehicle.day_rate.toString())
  const [imageUrl, setImageUrl] = useState(vehicle.image_url)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dirty =
    label !== vehicle.label ||
    capacityLabel !== vehicle.capacity_label ||
    Number(dayRate) !== vehicle.day_rate ||
    imageUrl !== vehicle.image_url

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    const compressed = await compressImage(file)
    const { publicUrl, error: uploadError } = await uploadCharterVehicleImage(compressed)
    setUploading(false)
    if (uploadError || !publicUrl) {
      setError('Image upload failed. Please try again.')
      return
    }
    setImageUrl(publicUrl)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const payload = {
      label: label.trim(),
      capacity_label: capacityLabel.trim(),
      day_rate: Number(dayRate) || 0,
      image_url: imageUrl,
    }
    const { error: saveError } = await updateCharterVehicle(vehicle.vehicle_type, payload)
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved({ ...vehicle, ...payload })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:grid-cols-[160px_1fr]">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        className="relative flex h-32 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-slate-400 transition-colors hover:border-[#33bbcf]/40"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : imageUrl ? (
          <Image src={imageUrl} alt={label} fill className="object-cover" sizes="160px" />
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span className="text-[11px]">Upload photo</span>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Capacity text</label>
            <input
              value={capacityLabel}
              onChange={(e) => setCapacityLabel(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Day rate (kr)</label>
            <input
              type="number"
              min={0}
              step={50}
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 rounded-lg border border-[#33bbcf]/30 bg-[#33bbcf]/10 px-3 py-1.5 text-xs font-semibold text-[#33bbcf] hover:bg-[#33bbcf]/20 disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export function CharterVehiclesView() {
  const [vehicles, setVehicles] = useState<CharterVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listCharterVehicles().then(({ data, error }) => {
      if (error) setError(error.message)
      else setVehicles((data ?? []) as CharterVehicle[])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Charter Vehicles</h2>
        <p className="mt-1 text-xs text-slate-400">
          Edit the label, capacity text, day rate, and photo shown for each vehicle on /charter. Changes
          take effect immediately -- the instant quote on the public page always reads the live rate.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
          {error}. Run supabase-charter-vehicles-setup.sql in Supabase, then reload this page.
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.vehicle_type}
              vehicle={v}
              onSaved={(updated) =>
                setVehicles((prev) => prev.map((p) => (p.vehicle_type === updated.vehicle_type ? updated : p)))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
