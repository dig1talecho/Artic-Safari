import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { posts } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Northern Lights Travel Guides | Artic Safari Blog',
  description:
    'Practical guides for your Northern Lights trip to Tromsø, Norway — what to wear, when to go, and how to photograph the aurora.',
}

export default function BlogIndexPage() {
  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-[var(--home-accent)]/30 bg-[var(--home-accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--home-accent)]">
            Travel Guides
          </span>
          <h1 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl italic leading-[1.1] tracking-tight text-[var(--home-foreground)] sm:text-5xl">
            Aurora Guides &amp; Tips
          </h1>
          <p className="mt-5 text-pretty leading-relaxed text-[var(--home-muted)]">
            Practical, honest advice for planning your Northern Lights trip to Tromsø.
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--home-muted)]">
            {posts.length} guides · Written by the Artic Safari team
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] shadow-[0_2px_24px_-8px_rgba(38,36,31,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--home-accent)]/40 hover:shadow-[0_16px_40px_-12px_rgba(38,36,31,0.16)] sm:flex-row"
            >
              <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(min-width: 640px) 256px, 100vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-center gap-4 text-xs text-[var(--home-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--home-foreground)]">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--home-muted)]">
                  {post.excerpt}
                </p>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-[var(--home-accent)]">
                  Read Guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
