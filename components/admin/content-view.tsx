'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save, RotateCcw, Search, Check, AlertTriangle, PencilLine } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CONTENT_GROUPS, CONTENT_DEFAULTS } from '@/lib/site-content'
import { listSiteContent, setSiteContent } from '@/services/site-content.service'

/**
 * Site copy editor.
 *
 * Every editable string appears with its current wording already in the
 * box, whether that wording comes from the database or from the code.
 * Nobody should face an empty field and have to remember what used to be
 * there.
 *
 * Clearing a box is the same as resetting it. Blank means "use the
 * original", never "show nothing" — a content system whose failure mode
 * is a hole in the homepage is worse than no content system.
 */
export function ContentView() {
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [editors, setEditors] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listSiteContent().then(({ data, error }) => {
      if (error) {
        setStatus({
          ok: false,
          message: `Could not load saved text: ${error.message}. Run supabase-site-content.sql if you have not yet.`,
        })
      } else if (data) {
        setOverrides(Object.fromEntries(data.map((r) => [r.key, r.value])))
        setEditors(Object.fromEntries(data.map((r) => [r.key, r.updated_by])))
      }
      setLoading(false)
    })
  }, [])

  /** The override if there is one, otherwise the wording baked into the code. */
  const shown = (key: string) => draft[key] ?? overrides[key] ?? CONTENT_DEFAULTS[key] ?? ''

  const isEdited = (key: string) => {
    const v = shown(key).trim()
    return v !== '' && v !== (CONTENT_DEFAULTS[key] ?? '').trim()
  }

  const dirtyKeys = useMemo(
    () =>
      Object.keys(draft).filter(
        (k) => (draft[k] ?? '') !== (overrides[k] ?? CONTENT_DEFAULTS[k] ?? ''),
      ),
    [draft, overrides],
  )

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(CONTENT_GROUPS)
      .map(([groupKey, group]) => ({
        groupKey,
        group,
        fields: Object.entries(group.fields).filter(([key, field]) => {
          if (!q) return true
          const current = draft[key] ?? overrides[key] ?? CONTENT_DEFAULTS[key] ?? ''
          return (
            key.toLowerCase().includes(q) ||
            field.label.toLowerCase().includes(q) ||
            current.toLowerCase().includes(q)
          )
        }),
      }))
      .filter((g) => g.fields.length > 0)
  }, [query, draft, overrides])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)

    for (const key of dirtyKeys) {
      const { error } = await setSiteContent(key, draft[key] ?? '')
      if (error) {
        setSaving(false)
        return setStatus({ ok: false, message: `${key}: ${error.message}` })
      }
    }

    // Mirror what the database now holds: a cleared field has no row.
    const next = { ...overrides }
    for (const key of dirtyKeys) {
      const v = (draft[key] ?? '').trim()
      if (v === '') delete next[key]
      else next[key] = v
    }
    setOverrides(next)
    setDraft({})

    // The public site caches this copy for five minutes. Without clearing
    // it, a correct save looks like a failed one and gets pressed again.
    let cacheCleared = false
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        const res = await fetch('/api/revalidate-content', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        cacheCleared = res.ok
      }
    } catch {
      cacheCleared = false
    }

    setSaving(false)
    setStatus({
      ok: true,
      message: cacheCleared
        ? 'Saved. The site is showing the new wording now.'
        : 'Saved. The site will pick it up within five minutes.',
    })
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#33bbcf]">
            <PencilLine className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-semibold text-white">Site text</p>
            <p className="text-xs text-slate-400">
              Change any wording on the public site. Clear a box to put the original back.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for the text you want to change…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {groups.map(({ groupKey, group, fields }) => (
        <section key={groupKey} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <p className="font-semibold text-white">{group.title}</p>
          <p className="mt-1 text-xs text-slate-400">{group.description}</p>

          <div className="mt-5 space-y-4">
            {fields.map(([key, field]) => (
              <div key={key}>
                <label className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">{field.label}</span>
                  {isEdited(key) && (
                    <span className="rounded bg-[#33bbcf]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#33bbcf]">
                      Edited
                    </span>
                  )}
                  {editors[key] && (
                    <span className="text-[10px] text-slate-500">by {editors[key]}</span>
                  )}
                </label>

                {field.kind === 'multiline' ? (
                  <textarea
                    rows={2}
                    value={shown(key)}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white focus:border-[#33bbcf] focus:outline-none"
                  />
                ) : (
                  <input
                    value={shown(key)}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
                  />
                )}

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500">{field.hint}</p>
                  {isEdited(key) && (
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, [key]: '' }))}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-[#33bbcf]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset to original
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {status && (
        <p
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            status.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          {status.ok ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {status.message}
        </p>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dirtyKeys.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#33bbcf] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : dirtyKeys.length === 0 ? 'No changes' : `Publish ${dirtyKeys.length}`}
        </button>
        {dirtyKeys.length > 0 && (
          <button
            type="button"
            onClick={() => setDraft({})}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-white/25"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  )
}
