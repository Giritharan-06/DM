'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { CardArt } from './card-art';
import {
  ArrowUpRight,
  ArrowDown,
  Check,
  Menu,
  X,
  Mail,
  CalendarDays,
  MoveUpRight,
} from 'lucide-react';
import type { WebsiteSettings } from '@zyroz/validation';
export type Brand =
  'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'whatsapp' | 'google';
export function BrandIcon({ brand }: { brand: Brand }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {brand === 'instagram' ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
        </>
      ) : brand === 'facebook' ? (
        <path
          fill="currentColor"
          stroke="none"
          d="M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1h-3c-4 0-5 2-5 6v2H7v4h3v9z"
        />
      ) : brand === 'youtube' ? (
        <>
          <rect x="2" y="5" width="20" height="14" rx="5" />
          <path d="m10 9 6 3-6 3z" fill="currentColor" stroke="none" />
        </>
      ) : brand === 'linkedin' ? (
        <>
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <path
            d="M7 10v8m0-11v.1M11 18v-8m0 4c0-5 6-5 6 0v4"
            strokeWidth="2.4"
          />
        </>
      ) : brand === 'whatsapp' ? (
        <>
          <path d="M21 11.5a9 9 0 0 1-13.4 8L3 21l1.4-4.7A9 9 0 1 1 21 11.5Z" />
          <path
            d="M8.2 7.2c-.7 0-1.3 1-1 2.2.6 2.3 3.1 5 5.9 6 .9.3 2.5-.5 2.7-1.4l-2.4-1.4-1 1c-1.6-.7-2.7-1.9-3.3-3.3l1-1-1.1-2.1Z"
            fill="currentColor"
            stroke="none"
          />
        </>
      ) : (
        <>
          <path d="M20 12h-8m8 0a8 8 0 1 1-2.3-5.7M20 12v5" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
export function SocialLinks({
  profile,
  compact = false,
  showUnconfigured = false,
}: {
  profile: WebsiteSettings;
  compact?: boolean;
  showUnconfigured?: boolean;
}) {
  return (
    <div className={`social-links ${compact ? 'compact' : ''}`}>
      {(['instagram', 'facebook', 'linkedin', 'youtube'] as const)
        .filter((brand) => profile[brand] || showUnconfigured)
        .map((brand) =>
          profile[brand] ? (
            <a
              key={brand}
              href={profile[brand]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`ZYROZ on ${brand}`}
              className={`social-link social-${brand}`}
            >
              <BrandIcon brand={brand} />
              {!compact && <span>{brand}</span>}
              <ArrowUpRight size={13} />
            </a>
          ) : (
            <span
              key={brand}
              className={`social-link social-${brand} social-pending`}
              role="img"
              aria-label={`${brand} profile coming soon`}
              title={`${brand[0].toUpperCase() + brand.slice(1)} — profile coming soon`}
            >
              <BrandIcon brand={brand} />
              <ArrowUpRight size={13} />
            </span>
          ),
        )}
    </div>
  );
}
export function PlatformBand() {
  return (
    <div className="platform-band">
      <div className="container platform-inner">
        <span>
          YOUR AUDIENCE IS HERE.
          <br />
          <strong>LET’S MEET THEM.</strong>
        </span>
        <div className="platform-list">
          {(
            ['instagram', 'facebook', 'google', 'youtube', 'linkedin'] as const
          ).map((brand) => (
            <div key={brand} className={`platform-logo social-${brand}`}>
              <BrandIcon brand={brand} />
              <span>
                {brand === 'google'
                  ? 'Google'
                  : brand[0].toUpperCase() + brand.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function SocialOrbit() {
  return (
    <div className="social-orbit" aria-hidden="true">
      {(['instagram', 'facebook', 'youtube', 'whatsapp'] as const).map(
        (brand, i) => (
          <span key={brand} className={`orbit-chip orbit-${i} social-${brand}`}>
            <BrandIcon brand={brand} />
          </span>
        ),
      )}
    </div>
  );
}
export function MobileMenu() {
  return (
    <details className="mobile-menu-web">
      <summary aria-label="Open website menu">
        <Menu size={22} />
      </summary>
      <div>
        {[
          ['#services', 'Services'],
          ['#studio', 'Our expertise'],
          ['#plans', 'Find your plan'],
          ['#industries', 'Industries'],
          ['#work', 'Our work'],
          ['#faq', 'FAQ'],
          ['#consultation', 'Contact'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={(e) =>
              e.currentTarget.closest('details')?.removeAttribute('open')
            }
          >
            {label}
            <ArrowUpRight size={15} />
          </a>
        ))}
      </div>
    </details>
  );
}
const chapters = [
  {
    name: 'Make people stop. Then make them care.',
    tag: '01 / BRAND & CONTENT',
    image: 'premium-creative',
    copy: 'A clear identity. Content with a point of view. Creative that feels unmistakably yours.',
    tags: ['Brand direction', 'Social content', 'Creative production'],
    theme: 'creative',
  },
  {
    name: 'Get in front of your next customer.',
    tag: '02 / PERFORMANCE & DISCOVERY',
    image: 'premium-campaign',
    copy: 'Turn intent into conversations through focused campaigns, useful search visibility and a clear next step.',
    tags: ['Meta campaigns', 'Google Ads', 'Search strategy'],
    theme: 'performance',
  },
  {
    name: 'Build an experience that moves people.',
    tag: '03 / DIGITAL EXPERIENCES',
    image: 'unique-feature-studio-digital',
    copy: 'Bring your brand to life with thoughtful websites, connected customer journeys and clear enquiry paths.',
    tags: ['Website design', 'Landing pages', 'Conversion journeys'],
    theme: 'digital',
  },
];
export function SignatureServices() {
  return (
    <section className="signature-section" id="studio">
      <div className="container signature-heading">
        <div>
          <span className="eyebrow">THE GROWTH STUDIO</span>
          <h2>
            Good strategy.
            <br />
            <em>Unforgettable execution.</em>
          </h2>
        </div>
        <p>
          Three disciplines.
          <br />
          One connected approach.
        </p>
      </div>
      <div className="signature-stage container">
        <div className="signature-stack">
          {chapters.map((chapter, i) => (
            <article
              className={`signature-panel signature-${chapter.theme}`}
              key={chapter.tag}
            >
              <div className="signature-copy">
                <span className="signature-kicker">{chapter.tag}</span>
                <h3>{chapter.name}</h3>
                <p>{chapter.copy}</p>
                <div className="signature-tags">
                  {chapter.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a href="#consultation" className="button signature-cta">
                  Let’s build something <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="signature-art">
                <span className="art-orbit" />
                <Image
                  src={`/art/${chapter.image}.webp`}
                  alt={
                    i === 0
                      ? 'Chrome camera and creative production artwork'
                      : i === 1
                        ? 'Sculptural campaign target with analytics bars'
                        : 'Sculptural browser portal with connected mobile interfaces'
                  }
                  width={chapter.theme === 'digital' ? 1024 : 1536}
                  height={1024}
                  sizes="(max-width: 760px) 95vw, 50vw"
                />
              </div>
              <span className="signature-page">0{i + 1} — 03</span>
            </article>
          ))}
        </div>
        <div className="signature-caption">
          <span>SCROLL THROUGH THE STUDIO</span>
          <div className="signature-progress">
            <i />
          </div>
          <ArrowDown size={16} />
        </div>
      </div>
    </section>
  );
}
const goals = {
  'More enquiries': {
    title: 'Turn interest into a conversation.',
    services: ['Google Ads', 'Meta Ads', 'Landing pages'],
    copy: 'A focused acquisition plan, with clear enquiry paths and meaningful measurement.',
  },
  'A stronger brand': {
    title: 'Make your business unmistakable.',
    services: ['Brand direction', 'Social media', 'Content creation'],
    copy: 'A connected visual identity and content approach to build recognition and trust.',
  },
  'A better website': {
    title: 'Make every visit feel effortless.',
    services: ['Website design', 'SEO foundations', 'Enquiry journeys'],
    copy: 'A considered web experience that helps visitors understand your business and take the next step.',
  },
} as const;
export function GrowthFinder() {
  const [goal, setGoal] = useState<keyof typeof goals>('More enquiries');
  const current = goals[goal];
  return (
    <section className="section growth-finder" id="plans">
      <div className="container finder-grid">
        <div>
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>
            Big ambitions.
            <br />
            <em>A clear starting point.</em>
          </h2>
          <p>
            No one-size-fits-all packages. Start with your goal and we’ll shape
            the right scope together.
          </p>
          <div
            className="goal-options"
            role="group"
            aria-label="Choose your business goal"
          >
            {(Object.keys(goals) as (keyof typeof goals)[]).map((value) => (
              <button
                aria-pressed={goal === value}
                key={value}
                onClick={() => setGoal(value)}
              >
                {value}
                <MoveUpRight size={15} />
              </button>
            ))}
          </div>
        </div>
        <div className="finder-card">
          <CardArt
            name={
              goal === 'A stronger brand'
                ? 'unique-goal-brand'
                : goal === 'A better website'
                  ? 'unique-goal-website'
                  : 'unique-goal-enquiries'
            }
          />
          <span className="finder-topline">
            A POSSIBLE DIRECTION <span>↗</span>
          </span>
          <h3>{current.title}</h3>
          <p>{current.copy}</p>
          <ul>
            {current.services.map((service) => (
              <li key={service}>
                <Check size={16} />
                {service}
              </li>
            ))}
          </ul>
          <div className="finder-price">
            <strong>Built around your business</strong>
            <span>Scope and quote agreed after your consultation.</span>
          </div>
          <a className="button primary" href="#consultation">
            Build my growth plan <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
export function ContactDock({ profile }: { profile: WebsiteSettings }) {
  const dialog = useRef<HTMLDialogElement>(null);
  if (!profile.whatsappEnabled) return null;
  const number = profile.whatsapp.replace(/\D/g, '');
  return (
    <>
      <div className="contact-dock">
        {number ? (
          <a
            className="whatsapp-button"
            href={`https://wa.me/${number}?text=${encodeURIComponent('Hi ZYROZ, I’d like to discuss digital marketing for my business.')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with ZYROZ on WhatsApp"
          >
            <BrandIcon brand="whatsapp" />
            <span>Let’s talk</span>
          </a>
        ) : (
          <button
            className="whatsapp-button"
            aria-label="Start a conversation"
            onClick={() => dialog.current?.showModal()}
          >
            <BrandIcon brand="whatsapp" />
            <span>Let’s talk</span>
          </button>
        )}
        <a className="back-top" href="#main" aria-label="Back to top">
          <ArrowUpRight size={18} />
        </a>
      </div>
      <dialog
        ref={dialog}
        className="contact-dialog"
        aria-labelledby="contact-dialog-title"
      >
        <button
          className="dialog-close"
          aria-label="Close contact options"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h2 id="contact-dialog-title">
          Let’s start
          <br />a conversation.
        </h2>
        <p>Tell us about your business and what you’d like to achieve.</p>
        <a
          className="button primary"
          href="#consultation"
          onClick={() => dialog.current?.close()}
        >
          Get a free consultation <ArrowUpRight size={16} />
        </a>
        {profile.email && (
          <a href={`mailto:${profile.email}`} className="contact-option">
            <Mail size={18} />
            {profile.email}
          </a>
        )}
        {profile.bookingUrl && (
          <a
            href={profile.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-option"
          >
            <CalendarDays size={18} />
            Book a conversation
          </a>
        )}
        <SocialLinks profile={profile} />
      </dialog>
    </>
  );
}
