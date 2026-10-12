'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  CardArt,
  serviceArt,
  journeyArt,
  solutionArt,
  industryArt,
} from './card-art';
import { SiteFooter } from './site-footer';
import Image from 'next/image';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ShieldCheck,
  Play,
  Megaphone,
  Search,
  Palette,
  Code2,
  PenTool,
  Target,
  BarChart3,
  Users,
  Bell,
  MousePointer2,
  MapPin,
  Store,
  Utensils,
  Dumbbell,
  GraduationCap,
  Scissors,
  Building2,
  HeartPulse,
  Shirt,
} from 'lucide-react';
import { Badge } from '@zyroz/ui';
import { industries, serviceNames } from '@zyroz/validation';
import { Consultation } from './consultation';
import { useStory } from '@/animations/story';
import { Process, Partnership, FAQ, Decor } from './story-sections';
import type { WebsiteSettings } from '@zyroz/validation';
import {
  SignatureServices,
  GrowthFinder,
  PlatformBand,
  SocialOrbit,
  ContactDock,
  MobileMenu,
} from './premium-elements';
const icons = [
  Users,
  Megaphone,
  MousePointer2,
  Search,
  Code2,
  Palette,
  PenTool,
  Target,
];
const descriptions = [
  'Build a community around your brand with content that connects.',
  'Put your business in front of the right people on Facebook and Instagram.',
  'Reach customers at the moment they are looking for what you offer.',
  'Help customers discover your business through organic search.',
  'Turn your online presence into a clear, welcoming customer experience.',
  'Make every first impression consistent, memorable and unmistakably yours.',
  'Give your brand a voice with purposeful photography, video and copy.',
  'Create a thoughtful path from discovering your business to making an enquiry.',
];
const strategies: Record<string, string[]> = {
  Restaurant: [
    'Local search and Google Business Profile',
    'Short-form food and atmosphere content',
    'Location-based offers and enquiry campaigns',
  ],
  'Clothing Store': [
    'Product storytelling and seasonal collections',
    'Shopping-focused Meta campaigns',
    'A mobile-friendly product discovery experience',
  ],
  Salon: [
    'Local discovery and service pages',
    'Portfolio content with customer consent',
    'Booking-focused campaigns and remarketing',
  ],
  Gym: [
    'Local awareness and membership enquiries',
    'Educational fitness content',
    'Landing pages for classes and trial sessions',
  ],
  'Real Estate': [
    'Project landing pages and qualified enquiries',
    'Location-based search campaigns',
    'Follow-up journeys for interested buyers',
  ],
  Education: [
    'Course discovery and helpful explainers',
    'Admissions enquiry campaigns',
    'Parent and student information journeys',
  ],
  Healthcare: [
    'Clear, factual service information',
    'Local discoverability and accessible websites',
    'Privacy-conscious appointment enquiries',
  ],
  Other: [
    'A strategy built around your business goals',
    'Audience research and channel selection',
    'Useful content and a clear enquiry journey',
  ],
};
const industryIcons = [
  Utensils,
  Shirt,
  Scissors,
  Dumbbell,
  Building2,
  GraduationCap,
  HeartPulse,
  Store,
];
export function Landing({ contact }: { contact: WebsiteSettings }) {
  useStory();
  const [industry, setIndustry] = useState<string>('Restaurant');
  const [service, setService] = useState<string | null>(null);
  const IndustryIcon =
    industryIcons[
      industries.indexOf(industry as (typeof industries)[number])
    ] || Store;
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <header className="container site-header">
        <nav className="site-nav" aria-label="Main navigation">
          <Link className="logo" href="/" aria-label="Zyroz Digital home">
            <Image className="brand-icon" src="/zyroz-mark.png" alt="" width={80} height={80} />
            <span>Zyroz Digital</span>
          </Link>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#approach">Our approach</a>
            <a href="#industries">Industries</a>
            <a href="#work">Our work</a>
            <a href="#plans">Find your plan</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-right">
            <a
              href={process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001'}
              style={{ fontSize: 12, color: 'var(--muted)' }}
            >
              Client & team login
            </a>
            <MobileMenu />
            <a className="button primary" href="#consultation">
              Let’s talk <ArrowUpRight size={16} />
            </a>
          </div>
        </nav>
      </header>
      <main id="main">
        <section className="hero">
          <Decor />
          <div className="container">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">
                  STRATEGY. CREATIVE. PERFORMANCE.
                </div>
                <h1>
                  Turn Your Business Into a <span>Growth Story.</span>
                </h1>
                <p>
                  We help businesses attract more customers, build stronger
                  brands and grow online through smart digital marketing.
                </p>
                <div className="hero-actions">
                  <a className="button primary" href="#consultation">
                    Get Free Consultation <ArrowUpRight size={17} />
                  </a>
                  <a className="button secondary" href="#approach">
                    <Play size={13} /> See How It Works
                  </a>
                </div>
                <div className="hero-highlights">
                  <div>
                    <strong>08</strong>
                    <span>Connected services</span>
                  </div>
                  <div>
                    <strong>04</strong>
                    <span>Clear steps forward</span>
                  </div>
                  <div>
                    <strong>01</strong>
                    <span>Partner for your growth</span>
                  </div>
                </div>
                <div className="hero-note">
                  <ShieldCheck size={15} /> Thoughtful strategy. Transparent
                  partnerships.
                </div>
              </div>
              <div
                className="hero-art"
                aria-label="Illustrative digital marketing workspace"
              >
                <div className="hero-orbit" aria-hidden="true" />
                <Image
                  className="hero-illustration"
                  src="/art/premium-growth.webp"
                  alt="Chrome rocket, navy sculpture and glass analytics panels representing digital growth"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 760px) 100vw, 55vw"
                  loading="eager"
                />
                <SocialOrbit />
                <div className="floating-label top float-card">
                  <BarChart3 size={21} />
                  <div>
                    <strong>Ideas → Impact</strong>
                    <br />
                    <span className="muted">Strategy meets possibility</span>
                  </div>
                </div>
                <div className="floating-label bottom float-card">
                  <Bell size={20} />
                  <div>
                    <strong>Your next customer</strong>
                    <br />
                    <span className="muted">Starts with being discovered</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-bottom">
              <span>ONE PARTNER. EVERY DIGITAL TOUCHPOINT.</span>
              <div className="capabilities">
                <span>
                  <Search size={18} /> Google & search
                </span>
                <span>
                  <Users size={18} /> Social media
                </span>
                <span>
                  <Megaphone size={18} /> Paid campaigns
                </span>
                <span>
                  <Code2 size={18} /> Websites
                </span>
              </div>
            </div>
          </div>
        </section>
        <PlatformBand />
        <section className="section soft" id="approach">
          <div className="container problem-grid">
            <div className="problem-visual reveal">
              <Image
                src="/art/business-owner.webp"
                alt="A thoughtful business owner beside a neighborhood shop"
                width={1536}
                height={1024}
                sizes="(max-width: 760px) 95vw, 45vw"
                className="business-illustration"
              />
              <span className="question-bubble bubble-one">
                Low visibility?
              </span>
              <span className="question-bubble bubble-two">
                Fewer enquiries?
              </span>
              <span className="question-bubble bubble-three">
                Ready for your next chapter?
              </span>
              <div className="floating-label bottom">
                <MapPin size={18} /> A great business. Ready to be found.
              </div>
            </div>
            <div className="reveal">
              <div className="eyebrow">The opportunity</div>
              <h2>
                You have a great business.
                <br />
                Do enough people know about it?
              </h2>
              <p>
                Your next customer could be searching right now. Let’s help them
                find you.
              </p>
              <ul className="problem-list">
                <li>
                  <Search size={20} />
                  <div>
                    <strong>Be visible where it matters</strong>
                    <p>
                      Make it easier for the right people to discover your
                      business.
                    </p>
                  </div>
                </li>
                <li>
                  <Users size={20} />
                  <div>
                    <strong>Turn attention into conversations</strong>
                    <p>
                      Give interested customers a clear reason to get in touch.
                    </p>
                  </div>
                </li>
                <li>
                  <Target size={20} />
                  <div>
                    <strong>Stand out with a clear story</strong>
                    <p>Show what makes your business the right choice.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section className="transformation" aria-label="Digital transformation">
          <div className="container">
            <div className="eyebrow">The solution</div>
            <h2>
              How digital marketing
              <br />
              helps your business grow.
            </h2>
            <p>
              Every touchpoint works together to help your business move
              forward.
            </p>
            <div className="transform-steps">
              {[
                [Search, 'Get discovered', 'Show up in relevant searches.'],
                [Users, 'Build connection', 'Share content that matters.'],
                [Megaphone, 'Reach further', 'Speak to the right audience.'],
                [Bell, 'Start conversations', 'Make enquiries effortless.'],
                [BarChart3, 'Learn & improve', 'Measure, refine, repeat.'],
              ].map(([Icon, title, description], i) => {
                const I = Icon as typeof Search;
                return (
                  <div className="transform-step" key={String(title)}>
                    <CardArt name={solutionArt[i]} />
                    <div className="sculpt-icon">
                      <I size={34} />
                    </div>
                    <span className="transform-index">0{i + 1}</span>
                    <h3>{String(title)}</h3>
                    <p>{String(description)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <SignatureServices />
        <section className="section services-section" id="services">
          <div className="container">
            <div className="head-row">
              <div className="section-head reveal">
                <div className="eyebrow">What we do</div>
                <h2>
                  Everything your business
                  <br />
                  needs. In one place.
                </h2>
              </div>
              <p>
                Everything your business needs to build a stronger digital
                presence.
              </p>
            </div>
            <div className="service-window">
              <div className="service-track">
                {serviceNames.map((name, i) => {
                  const Icon = icons[i];
                  return (
                    <article
                      className="card service-card"
                      key={name}
                      id={`service-${i + 1}`}
                    >
                      <CardArt name={serviceArt[i]} />
                      <span className="service-number">0{i + 1}</span>
                      <div className="service-icon">
                        <Icon size={25} />
                      </div>
                      <h3>{name}</h3>
                      <p>{descriptions[i]}</p>
                      <button
                        onClick={() =>
                          setService(service === name ? null : name)
                        }
                        aria-expanded={service === name}
                      >
                        Learn more <ArrowRight size={14} />
                      </button>
                      {service === name && (
                        <p style={{ marginTop: 18, minHeight: 0 }}>
                          We start with your business goals, define a focused
                          plan, and review progress together.{' '}
                          <a
                            href="#consultation"
                            style={{ color: 'var(--purple)' }}
                          >
                            Discuss {name.toLowerCase()} →
                          </a>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="services-foot">
              <span>SCROLL TO EXPLORE YOUR POSSIBILITIES</span>
              <div className="services-meter">
                <i />
              </div>
              <ArrowRight size={18} />
            </div>
          </div>
        </section>
        <section className="section soft">
          <div className="container">
            <div className="section-head reveal">
              <div className="eyebrow">Our approach</div>
              <h2>
                Small steps.
                <br />
                Meaningful progress.
              </h2>
              <p>A clear journey from where you are to where you want to be.</p>
            </div>
            <div className="journey">
              {[
                [
                  'Increase Visibility',
                  'Build an online presence that makes your business easier to find.',
                ],
                [
                  'Reach the Right Audience',
                  'Connect with the people most likely to need what you offer.',
                ],
                [
                  'Generate Enquiries',
                  'Create simple, useful paths for customers to get in touch.',
                ],
                [
                  'Grow Your Business',
                  'Use real insights to improve your strategy over time.',
                ],
              ].map(([title, desc], i) => (
                <div className="journey-step reveal" key={title}>
                  <CardArt name={journeyArt[i]} />
                  <div className="step-num">0{i + 1}</div>
                  <div className="journey-icon sculpt-icon">
                    {i === 0 ? (
                      <Search />
                    ) : i === 1 ? (
                      <Target />
                    ) : i === 2 ? (
                      <Bell />
                    ) : (
                      <BarChart3 />
                    )}
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Process />
        <section className="section" id="industries">
          <div className="container industry-grid">
            <div className="reveal">
              <div className="eyebrow">Built around your business</div>
              <h2>
                Your industry.
                <br />
                Your goals.
                <br />
                Your growth strategy.
              </h2>
              <p>
                Different businesses need different approaches. Explore what a
                focused strategy could look like for yours.
              </p>
              <div
                className="industry-tabs"
                role="tablist"
                aria-label="Business category"
              >
                {industries.map((v) => (
                  <button
                    key={v}
                    role="tab"
                    id={`tab-${v.replaceAll(' ', '-')}`}
                    aria-selected={industry === v}
                    aria-controls="industry-panel"
                    onClick={() => setIndustry(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="industry-detail"
              role="tabpanel"
              id="industry-panel"
              aria-labelledby={`tab-${industry.replaceAll(' ', '-')}`}
            >
              <div className="industry-art">
                <CardArt name={industryArt[industry]} />
                <IndustryIcon size={85} strokeWidth={1} />
              </div>
              <Badge>A tailored approach</Badge>
              <h3 style={{ marginTop: 20 }}>
                A new chapter for your{' '}
                {industry === 'Other' ? 'business' : industry.toLowerCase()}.
              </h3>
              <ul>
                {strategies[industry].map((s) => (
                  <li key={s}>
                    <Check size={16} />
                    {s}
                  </li>
                ))}
              </ul>
              <a className="button primary" href="#consultation">
                Explore your possibilities <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </section>
        <section className="section soft" id="work">
          <div className="container">
            <div className="head-row">
              <div className="section-head reveal">
                <div className="eyebrow">Ideas in action</div>
                <h2>See what’s possible.</h2>
                <p>
                  Illustrative approaches, built to show how strategy comes
                  together.
                </p>
              </div>
              <Badge>Demonstration examples · No claimed results</Badge>
            </div>
            <div className="case-grid">
              {[
                [
                  Utensils,
                  'Restaurant',
                  'From local favourite to easier discovery',
                  'An inconsistent online presence.',
                  'Local search, food content and an enquiry-focused campaign.',
                  'Scattered information → a coherent digital presence',
                ],
                [
                  Shirt,
                  'Retail',
                  'A stronger story for every collection',
                  'Products without a clear digital identity.',
                  'Brand direction, collection content and audience-focused ads.',
                  'Disconnected visuals → consistent brand storytelling',
                ],
                [
                  Dumbbell,
                  'Fitness',
                  'Make the first step feel simple',
                  'A confusing path from interest to membership.',
                  'A clear landing page, class content and trial enquiries.',
                  'Unclear next steps → a focused enquiry journey',
                ],
              ].map(([, industry, title, challenge, strategy, comparison]) => {
                const illustration =
                  String(industry) === 'Restaurant'
                    ? 'unique-case-restaurant'
                    : String(industry) === 'Retail'
                      ? 'unique-case-retail'
                      : 'unique-case-fitness';
                return (
                  <article key={String(title)} className="card case-card">
                    <div className="case-visual">
                      <Image
                        src={`/art/${illustration}.webp`}
                        alt={`Illustrative marketing artwork for the ${String(industry)} concept`}
                        width={1024}
                        height={1024}
                        sizes="(max-width: 760px) 90vw, 30vw"
                      />
                    </div>
                    <div className="case-content">
                      <Badge>{String(industry)} · Demo concept</Badge>
                      <h3>{String(title)}</h3>
                      <p>
                        <strong>Challenge:</strong> {String(challenge)}
                      </p>
                      <p>
                        <strong>Approach:</strong> {String(strategy)}
                      </p>
                      <div className="case-comparison">
                        {String(comparison)}
                        <br />
                        No measured client results available.
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <Partnership />
        <GrowthFinder />
        <FAQ />
        <section className="section" id="consultation">
          <div className="container consult-grid">
            <div className="consult-copy reveal">
              <div className="eyebrow">Let’s make your next move</div>
              <h2>
                Let’s Grow Your Business{' '}
                <span style={{ color: 'var(--purple)' }}>Together.</span>
              </h2>
              <p>
                Tell us where you are and where you want to go. We’ll start with
                a conversation and help you find a clear way forward.
              </p>
              <div className="consult-points">
                <div>
                  <Check size={20} />
                  <span>A conversation focused on your business</span>
                </div>
                <div>
                  <Check size={20} />
                  <span>Practical ideas, explained simply</span>
                </div>
                <div>
                  <Check size={20} />
                  <span>A clear next step, without the pressure</span>
                </div>
              </div>
              <Image
                className="consult-art"
                src="/art/unique-feature-consult-scene.webp"
                alt=""
                width={1024}
                height={1024}
                sizes="(max-width: 760px) 90vw, 40vw"
              />
            </div>
            <Consultation />
          </div>
        </section>
      </main>
      <SiteFooter contact={contact} />
      <ContactDock profile={contact} />
    </>
  );
}
