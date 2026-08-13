'use client'

import { useEffect, useState } from 'react'
import { Tag, Trash2, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { getAllToursAdmin, type Tour } from '@/services/tours.service'
import {
  listAllAddonsForTourAdmin,
  createAddon,
  updateAddon,
  deleteAddon,
  type TourAddon,
} from '@/services/addons.service'

export function AddonsView() {
  const [tours, setTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [selectedTourId, setSelectedTourId] = useState<string>('')

  const [addons, setAddons] = useState<TourAddon[]>([])
  const [addonsLoading, setAddonsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAllToursAdmin().then(({ data, error }) => {
      if (!error && data) {
        setTours(data)
        if (data.length > 0) setSelectedTourId(data[0].id)
      }
      setToursLoading(false)
    })
  }, [])

  const fetchAddons = (tourId: string) => {
    setAddonsLoading(true)
    listAllAddonsForTourAdmin(tourId).then(({ data, error }) => {
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        setAddons(data ?? [])
      }
      setAddonsLoading(false)
    })
  }

  useEffect(() => {
    if (selectedTourId) fetchAddons(selectedTourId)
  }, [selectedTourId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTourId || !name.trim() || !price) return

    setSubmitting(true)
    setError(null)
    const { error } = await createAddon({
      tour_id: selectedTourId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      active: true,
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setDescription('')
    setPrice('')
    fetchAddons(selectedTourId)
  }

  const toggleActive = async (addon: TourAddon) => {
    const { error } = await updateAddon(addon.id, { active: !addon.active })
    if (!error) {
      setAddons((prev) => prev.map((a) => (a.id === addon.id ? { ...a, active: !a.active } : a)))
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteAddon(id)
    if (!error) {
      setAddons((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Manage Add-ons</h2>
        <p className="mt-1 text-xs text-slate-400">
          Extras guests can attach to a booking (thermal suits, photo packages, etc.) — priced per tour.
        </p>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-slate-400">Tour</label>
          {toursLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tours…
            </div>
          ) : tours.length === 0 ? (
            <p className="text-sm text-slate-400">No tours found. Create a tour in Tour Catalog first.</p>
          ) : (
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none sm:w-80"
            >
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id} className="bg-slate-900">
                  {tour.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedTourId && (
          <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Add-on name (e.g. Thermal Suit)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none sm:col-span-2"
            />
            <input
              type="text"
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none sm:col-span-2"
            />
            <input
              required
              type="number"
              min={0}
              step={1}
              placeholder="Price (NOK)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none"
            />
            {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-aurora px-4 py-2.5 text-sm font-semibold text-black hover:bg-aurora/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </form>
        )}
      </div>

      {selectedTourId && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Add-ons for this tour ({addons.length})
            </h2>
          </div>

          {addonsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : addons.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No add-ons yet for this tour. Add one above.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {addons.map((addon) => (
                <div key={addon.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-aurora">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{addon.name}</span>
                        <span className="font-mono text-xs text-aurora">{addon.price.toLocaleString()} kr</span>
                        {!addon.active && (
                          <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                            Hidden
                          </span>
                        )}
                      </div>
                      {addon.description && <p className="mt-1 text-xs text-slate-400">{addon.description}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toggleActive(addon)}
                      title={addon.active ? 'Hide from booking wizard' : 'Show in booking wizard'}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                    >
                      {addon.active ? <ToggleRight className="h-4 w-4 text-aurora" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(addon.id)}
                      title="Delete"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
