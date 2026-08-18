import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { SITE_CONTENT_TAG } from '@/lib/get-site-content'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Clears the cached site copy after an admin saves.
 *
 * Without this, an edit would sit invisible until the 5-minute cache
 * expired, and whoever made it would assume it had not saved and press
 * the button again.
 *
 * The caller's token is verified here, server-side, rather than trusting
 * a header that says "I am an admin". Busting a cache is low-stakes, but
 * an unauthenticated endpoint that forces a database read on every call
 * is a free denial-of-service, so it is both checked and rate limited.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`revalidate-content:${ip}`, 20, 60_000)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const client = createClient(url, anonKey, { auth: { persistSession: false } })

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Being signed in is not enough -- a customer account has a valid token
  // too. Only an admin may force a re-render of the public site.
  const { data: staff } = await client
    .from('staff_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (staff?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Next 16 wants an explicit profile: 'max' clears every cached entry
  // carrying this tag rather than only the current request's.
  revalidateTag(SITE_CONTENT_TAG, 'max')
  return NextResponse.json({ revalidated: true })
}
