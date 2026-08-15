import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { posts, getPostBySlug } from '@/lib/blog-data'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <SiteShell>
      <article className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:pt-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--home-muted)] transition-colors hover:text-[var(--home-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All Guides
        </Link>

        <div className="mt-6 flex items-center gap-4 text-xs text-[var(--home-muted)]">
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

        <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--home-foreground)] sm:text-4xl">
          {post.title}
        </h1>

        <div className="relative mt-8 h-56 w-full overflow-hidden rounded-[1.75rem] ring-1 ring-inset ring-black/10 sm:h-80">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>

        <div className="mt-8 space-y-8">
          {post.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="font-[family-name:var(--font-display)] text-xl leading-tight text-[var(--home-foreground)]">
                  {section.heading}
                </h2>
              )}
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-pretty leading-relaxed text-[var(--home-muted)]">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/#tours"
          className="group mt-10 inline-flex items-center gap-2 rounded-[10px] bg-[image:var(--home-gradient-cta)] px-7 py-3.5 text-sm font-semibold text-[var(--home-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)] active:translate-y-0 active:scale-[0.98]"
        >
          Browse Our Northern Lights Tours
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </article>
    </SiteShell>
  )
}
