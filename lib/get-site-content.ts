import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { createContentReader, CONTENT_DEFAULTS } from '@/lib/site-content'

export const SITE_CONTENT_TAG = 'site-content'

/**
 * Server-side content loader for Server Components.
 *
 * Uses its own client rather than lib/supabase.ts: that module is shared
 * with the browser and carries a session, whereas this runs per-request
 * on the server and must stay anonymous and sessionless.
 *
 * Wrapped in unstable_cache so one homepage render is not one database
 * round trip per component. Tagged, so saving in the admin panel can
 * clear it immediately instead of waiting out the timer.
 *
 * IF THE TABLE OR THE DATABASE IS UNREACHABLE this returns no overrides,
 * which renders the wording baked into lib/site-content.ts. A content
 * system that can take the site down when it hiccups is not worth having.
 */
const loadOverrides = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return {}

    try {
      const client = createClient(url, key, { auth: { persistSession: false } })
      const { data, error } = await client.from('site_content').select('key, value')
      if (error || !data) return {}
      return Object.fromEntries(data.map((row) => [row.key, row.value as string]))
    } catch {
      return {}
    }
  },
  ['site-content-overrides'],
  { tags: [SITE_CONTENT_TAG], revalidate: 300 },
)

/**
 * Returns a reader: `const content = await getSiteContent()` then
 * `content('hero.headline')`. Never throws and never returns blank for a
 * known key.
 */
export async function getSiteContent() {
  const overrides = await loadOverrides()
  return createContentReader(overrides)
}

/** Raw overrides, for the admin panel's "customised vs default" display. */
export async function getSiteContentOverrides() {
  return loadOverrides()
}

export { CONTENT_DEFAULTS }
