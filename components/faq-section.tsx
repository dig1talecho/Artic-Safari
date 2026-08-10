'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'How do I book a Northern Lights tour with Artic Safari in Tromsø?',
    answer:
      'Book directly on the homepage — select a tour package, fill in your details (or sign in if you have an account), choose a date, and submit your request. Our team confirms availability via WhatsApp or email.',
  },
  {
    question: 'What is the price of a private Northern Lights tour in Tromsø?',
    answer:
      'The Private Group Northern Lights tour is a flat rate of 15,000 kr for up to 8 guests. A per-person shared option is also available at 2,000 kr / person, and a private small-group option (1–4 persons) is 11,000 kr.',
  },
  {
    question: 'Does Artic Safari provide airport transfers in Tromsø?',
    answer:
      'Yes. We offer private VIP airport transfers starting at 490 kr for a small vehicle (1–4 passengers), including chauffeur service and free Wi-Fi.',
  },
  {
    question: 'What is included in an Artic Safari Northern Lights tour?',
    answer:
      'Tours include a private heated vehicle, a chase route customized in real time to find clear skies, thermal suits, professional photography assistance, and hot drinks & snacks.',
  },
  {
    question: 'How can I contact Artic Safari to check tour availability?',
    answer:
      'You can reach us via WhatsApp or phone at +47 929 97 190, on Instagram @articsafaritour, or through the booking form above.',
  },
]

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-[var(--home-border)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--home-accent)]"
      >
        <span className="font-[family-name:var(--font-display)] text-base text-[var(--home-foreground)] sm:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--home-muted)] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-[var(--home-muted)]">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-24">
      <div className="mb-10 text-center">
        <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--home-accent)]">
          <HelpCircle className="h-4 w-4" />
          Frequently Asked Questions
        </p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl text-[var(--home-foreground)] sm:text-4xl">
          Good to know
        </h2>
      </div>

      <div className="rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] px-6 shadow-[0_2px_24px_-8px_rgba(33,31,27,0.08)] sm:px-8">
        {faqs.map((faq, index) => (
          <FaqItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            open={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  )
}
