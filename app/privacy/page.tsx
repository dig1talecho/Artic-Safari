import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, ExternalLink, Globe, Server } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { legal, dataCategories, recipients, storageItems, rights } from '@/lib/legal-config'

export const metadata: Metadata = {
  title: 'Privacy Policy | Artic Safari',
  description:
    'What personal data Artic Safari collects when you book a Northern Lights tour or a Tromsø transfer, why we need it, how long we keep it, and how to have it deleted.',
}

const updated = new Date(legal.lastUpdated).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--home-border)] pt-10">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-[var(--home-foreground)] sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-[var(--home-muted)]">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  const { controller, contact, authority, databaseRegion } = legal

  return (
    <SiteShell>
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-28 sm:pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
          Legal
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--home-foreground)] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--home-muted)]">
          This explains what we collect when you book a tour or a transfer with us, why we need it,
          who else sees it, and how to get it deleted. It describes what our booking system actually
          does — not a generic template.
        </p>
        <p className="mt-4 text-sm text-[var(--home-muted)]">
          Last updated <time dateTime={legal.lastUpdated}>{updated}</time>
        </p>

        <div className="mt-14 space-y-12">
          <Section id="who" title="Who is responsible">
            <p>
              {controller.legalName ?? controller.tradingName} operates{' '}
              <strong className="text-[var(--home-foreground)]">articsafaritour.com</strong> and the
              Artic Safari mobile app, running private Northern Lights tours and VIP transfers in{' '}
              {controller.city}, {controller.country}. We are the data controller for the
              information described here.
            </p>
            {(controller.orgNumber || controller.address) && (
              <ul className="space-y-1">
                {controller.orgNumber && <li>Organisation number: {controller.orgNumber}</li>}
                {controller.address && <li>Registered address: {controller.address}</li>}
              </ul>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`mailto:${contact.privacyEmail}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-2 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
              >
                <Mail className="h-4 w-4" />
                {contact.privacyEmail}
              </a>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-2 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
              >
                <MessageCircle className="h-4 w-4" />
                {contact.whatsapp}
              </a>
            </div>
          </Section>

          <Section id="what" title="What we collect and why">
            <p>
              We only ask for what a trip actually requires. There is no advertising profile, no
              data broker, and nothing is sold.
            </p>
            <div className="mt-6 space-y-6">
              {dataCategories.map((c) => (
                <div
                  key={c.what}
                  className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5"
                >
                  <h3 className="text-[15px] font-semibold text-[var(--home-foreground)]">
                    {c.what}
                  </h3>
                  <p className="mt-2 text-sm">{c.why}</p>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--home-accent)] sm:pt-0.5">
                      Why we may
                    </dt>
                    <dd>{c.basis}</dd>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--home-accent)] sm:pt-0.5">
                      How long
                    </dt>
                    <dd>{c.keptFor}</dd>
                  </dl>
                </div>
              ))}
            </div>
          </Section>

          <Section id="location" title="Your location">
            <p>
              Sharing your live location is{' '}
              <strong className="text-[var(--home-foreground)]">always optional</strong>. Nothing on
              this site or in the app asks your device for a position unless you press the
              &ldquo;Use my location&rdquo; button, and your browser or phone will ask your
              permission on top of that. Typing an address instead works exactly as well.
            </p>
            <p>
              If you do share it, we use it once — to place your pickup pin so a driver is not
              circling a street looking for you. You can clear the field before submitting, and the
              pickup point can be corrected afterwards.
            </p>
            <p>
              During a trip, the driver&rsquo;s position may be shown to you so you can see the car
              approaching. That is the driver&rsquo;s location, not yours, and only one current
              position is stored per booking — it is not a movement history.
            </p>
          </Section>

          <Section id="who-else" title="Who else sees your data">
            <p>
              We use a small number of established services to run the site. Two of them are worth
              distinguishing: some are contacted directly by your browser, which means they see your
              IP address, while others are only ever contacted by our server on your behalf, which
              means they do not.
            </p>
            <div className="mt-6 space-y-3">
              {recipients.map((r) => (
                <div
                  key={r.name}
                  className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="text-[15px] font-semibold text-[var(--home-foreground)]">
                      {r.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        r.reach === 'browser'
                          ? 'bg-[var(--home-accent-soft)] text-[var(--home-accent)]'
                          : 'border border-[var(--home-border)] text-[var(--home-muted)]'
                      }`}
                    >
                      {r.reach === 'browser' ? (
                        <>
                          <Globe className="h-3 w-3" /> Your browser contacts them
                        </>
                      ) : (
                        <>
                          <Server className="h-3 w-3" /> Our server only
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {r.role}
                    {r.conditional && (
                      <span className="text-[var(--home-muted)]/70">
                        {' '}
                        Used only when that feature is switched on.
                      </span>
                    )}
                  </p>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--home-accent)]"
                  >
                    Their privacy policy
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
            <p className="pt-2">
              Our drivers see the name, phone number and pickup address for the trips they are
              assigned — nothing more, and it is the database that enforces that limit, not just the
              app screen.
            </p>
            {databaseRegion && <p>Our database is hosted in {databaseRegion}.</p>}
          </Section>

          <Section id="cookies" title="Cookies">
            <p>
              <strong className="text-[var(--home-foreground)]">
                This site sets no advertising or tracking cookies
              </strong>
              , which is why you are not being interrupted by a consent banner. There is nothing
              non-essential here to consent to. What we do store:
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--home-border)]">
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-[var(--home-accent)]">
                      What
                    </th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-[var(--home-accent)]">
                      Kind
                    </th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-[var(--home-accent)]">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {storageItems.map((s) => (
                    <tr key={s.name} className="border-b border-[var(--home-border)]/50">
                      <td className="py-3 pr-4 font-medium text-[var(--home-foreground)]">
                        {s.name}
                      </td>
                      <td className="py-3 pr-4">{s.kind}</td>
                      <td className="py-3">{s.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pt-2">
              Map images and page-view statistics still involve your IP address reaching the
              companies listed above, as they would on any site that shows a map. If we ever add
              advertising or cross-site tracking, we will ask you first.
            </p>
          </Section>

          <Section id="rights" title="Your rights">
            <p>
              Under the GDPR you have the following rights, and exercising them is free. Email{' '}
              <a
                href={`mailto:${contact.privacyEmail}`}
                className="font-medium text-[var(--home-accent)]"
              >
                {contact.privacyEmail}
              </a>{' '}
              or message us on WhatsApp, and we will respond within one month.
            </p>
            <dl className="mt-6 space-y-4">
              {rights.map(([name, detail]) => (
                <div
                  key={name}
                  className="border-l-2 border-[var(--home-accent)]/40 pl-4 sm:grid sm:grid-cols-[160px_1fr] sm:gap-5 sm:border-l-0 sm:pl-0"
                >
                  <dt className="text-[15px] font-semibold text-[var(--home-foreground)]">{name}</dt>
                  <dd className="mt-1 text-sm sm:mt-0">{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-4">
              One thing worth being straight about: when you ask us to delete your data, we cannot
              erase the financial record of a trip you already took. Norwegian bookkeeping law
              requires us to keep transaction documentation for five years. What we do instead is
              strip your name, email, phone and address from that record, leaving an anonymous
              entry that satisfies the accountant without identifying you.
            </p>
          </Section>

          <Section id="security" title="How it is protected">
            <p>
              Access rules are enforced inside the database itself rather than by the app hiding
              buttons. Signed in as a guest, you can only ever read rows that match your own email
              address; a driver can only read the jobs assigned to them or still unclaimed. If
              somebody bypassed our website entirely and queried the database directly, those limits
              would still hold.
            </p>
            <p>
              Passwords are never stored — our authentication provider keeps only a one-way hash
              that we cannot read or reverse. All traffic is encrypted in transit.
            </p>
            <p>
              We do not process card payments on this site. Bookings are recorded as requests and
              confirmed with you directly, so no card details are ever entered here.
            </p>
          </Section>

          <Section id="children" title="Children">
            <p>
              Our booking system is intended for adults. We do not knowingly collect data from
              anyone under 16. Children are welcome on our tours as part of a family booking made by
              a parent or guardian, whose details are the ones we hold.
            </p>
          </Section>

          <Section id="complaints" title="If you are not happy">
            <p>
              Contact us first — most things are a misunderstanding we can fix quickly. If you are
              still dissatisfied, you have the right to lodge a complaint with{' '}
              <a
                href={authority.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--home-accent)]"
              >
                {authority.name}
              </a>
              .
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              If we add a feature that changes what we collect, we update this page and the date at
              the top. Material changes affecting existing bookings will be emailed to the address
              on the booking.
            </p>
          </Section>
        </div>

        <div className="mt-16 border-t border-[var(--home-border)] pt-8">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--home-accent)] transition-opacity hover:opacity-80"
          >
            ← Back to Artic Safari
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
