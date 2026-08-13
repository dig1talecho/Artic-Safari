'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  ImageOff,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  getAllToursAdmin,
  createTour,
  updateTour,
  deleteTour,
  uploadTourImage,
  type Tour,
  type TourInsertPayload,
} from '@/services/tours.service'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const v = draft.trim()
    if (v) onChange([...values, v])
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2">
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full border border-aurora/30 bg-aurora/10 px-2.5 py-1 text-xs text-aurora"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="w-full bg-transparent px-1 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none"
      />
    </div>
  )
}

function CoverImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const { publicUrl, error } = await uploadTourImage(file)
    setUploading(false)
    if (!error && publicUrl) onChange(publicUrl)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative flex h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors ${
        dragOver ? 'border-aurora bg-aurora/5' : 'border-white/15 bg-white/5 hover:border-white/25'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {value ? (
        <Image src={value} alt="Cover" fill className="object-cover" sizes="400px" />
      ) : uploading ? (
        <span className="text-xs text-slate-400">Uploading…</span>
      ) : (
        <>
          <Upload className="h-5 w-5 text-slate-500" />
          <span className="text-xs text-slate-400">Drag &amp; drop or click to upload cover image</span>
        </>
      )}
    </div>
  )
}

function GalleryUploader({ values, onChange }: { values: string[]; onChange: (next: string[]) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const { publicUrl } = await uploadTourImage(file)
      if (publicUrl) uploaded.push(publicUrl)
    }
    setUploading(false)
    onChange([...values, ...uploaded])
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg">
            <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/15 text-slate-500 hover:border-white/25"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px]">{uploading ? 'Uploading…' : 'Add'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

const emptyTour: TourInsertPayload = {
  slug: '',
  status: 'draft',
  eyebrow: '',
  title: '',
  meta_title: '',
  meta_description: '',
  intro: '',
  price: '',
  price_note: '',
  duration: '',
  meeting_point: '',
  highlights: [],
  features: [],
  cover_image: '',
  cover_image_alt: '',
  gallery: [],
  sort_order: 0,
}

function TourForm({
  tour,
  onClose,
  onSaved,
}: {
  tour: Tour | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<TourInsertPayload>(tour ?? emptyTour)
  const [slugTouched, setSlugTouched] = useState(!!tour)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof TourInsertPayload>(key: K, value: TourInsertPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim()) return

    setSaving(true)
    setError(null)

    const { error } = tour ? await updateTour(tour.id, form) : await createTour(form)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{tour ? 'Edit Tour' : 'New Tour'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Cover image</label>
            <CoverImageUploader value={form.cover_image} onChange={(url) => set('cover_image', url)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value)
                  if (!slugTouched) set('slug', slugify(e.target.value))
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', slugify(e.target.value))
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Eyebrow (category label)</label>
            <input
              value={form.eyebrow}
              onChange={(e) => set('eyebrow', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Intro / description</label>
            <textarea
              rows={3}
              value={form.intro}
              onChange={(e) => set('intro', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Price (e.g. "2,250 kr")</label>
              <input
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Price note (e.g. "/ person")</label>
              <input
                value={form.price_note}
                onChange={(e) => set('price_note', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="e.g. 3-4 hours"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Meeting point</label>
              <input
                value={form.meeting_point}
                onChange={(e) => set('meeting_point', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Route highlights</label>
            <TagInput
              values={form.highlights}
              onChange={(v) => set('highlights', v)}
              placeholder="Type a stop and press Enter…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Features / inclusions</label>
            <TagInput
              values={form.features}
              onChange={(v) => set('features', v)}
              placeholder="Type a feature and press Enter…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Gallery images</label>
            <GalleryUploader values={form.gallery} onChange={(v) => set('gallery', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Meta title (SEO)</label>
              <input
                value={form.meta_title}
                onChange={(e) => set('meta_title', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Meta description (SEO)</label>
              <input
                value={form.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <span className="text-xs text-slate-300">Publish this tour on the live site</span>
            <button
              type="button"
              onClick={() => set('status', form.status === 'active' ? 'draft' : 'active')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                form.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-slate-400'
              }`}
            >
              {form.status === 'active' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {form.status === 'active' ? 'Active' : 'Draft'}
            </button>
          </div>

          {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-aurora py-2 text-xs font-semibold text-black hover:bg-aurora/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : tour ? 'Save Changes' : 'Create Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ToursView() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Tour | null | 'new'>(null)

  const fetchTours = async () => {
    setLoading(true)
    const { data, error } = await getAllToursAdmin()
    if (error) setError(error.message)
    else {
      setError(null)
      setTours(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTours()
  }, [])

  const handleDelete = async (tour: Tour) => {
    const { error } = await deleteTour(tour.id)
    if (!error) setTours((prev) => prev.filter((t) => t.id !== tour.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Tour Catalog ({tours.length})
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Powers the homepage tour cards and every /tours page. Draft tours stay hidden from the public site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-aurora px-4 py-2 text-xs font-semibold text-black hover:bg-aurora/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Tour
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs text-rose-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading…</div>
      ) : tours.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 py-16 text-center text-slate-400">
          <ImageOff className="h-6 w-6" />
          No tours yet. Create the first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-xl"
            >
              <div className="relative h-32 bg-white/5">
                {tour.cover_image ? (
                  <Image src={tour.cover_image} alt={tour.cover_image_alt || tour.title} fill className="object-cover" sizes="360px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    tour.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/90 text-slate-200'
                  }`}
                >
                  {tour.status}
                </span>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{tour.eyebrow || 'Tour'}</p>
                <h3 className="mt-0.5 truncate text-sm font-semibold text-white">{tour.title}</h3>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {tour.price || '—'} {tour.price_note}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(tour)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tour)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TourForm
          tour={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            fetchTours()
          }}
        />
      )}
    </div>
  )
}
