'use client';
import { CardArt, processArt, partnerArt, faqArt } from './card-art';
import {
  ArrowUpRight,
  Search,
  Target,
  Settings2,
  BarChart3,
  Check,
  MessageCircle,
  Sparkles,
  Plus,
} from 'lucide-react';
export function Decor() {
  return (
    <div className="scene-decor" aria-hidden="true">
      <i className="orb orb-one" />
      <i className="orb orb-two" />
      <i className="orb orb-three" />
      <Sparkles className="scene-star star-one" />
      <Sparkles className="scene-star star-two" />
      <div className="scene-ring" />
    </div>
  );
}
const process = [
  [
    Search,
    'Understand your business',
    'We learn about your goals, your audience and what makes your business different.',
  ],
  [
    Target,
    'Create a strategy',
    'A focused plan brings your message, channels and customer journey together.',
  ],
  [
    Settings2,
    'Execute & optimize',
    'We create, launch and refine your campaigns with regular progress reviews.',
  ],
  [
    BarChart3,
    'Measure what matters',
    'Clear reporting helps you understand enquiries, engagement and the next opportunity.',
  ],
] as const;
export function Process() {
  return (
    <section className="section process-section" id="process">
      <Decor />
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">How it works</div>
          <h2>A simple 4-step process.</h2>
          <p>
            We keep it simple and transparent, so you always know what’s
            happening.
          </p>
        </div>
        <div className="process-cards">
          <div className="process-line" aria-hidden="true">
            <i />
          </div>
          {process.map(([Icon, title, description], i) => (
            <article className="process-card reveal" key={title}>
              <CardArt name={processArt[i]} />
              <span className="process-number">0{i + 1}</span>
              <div className="sculpt-icon">
                <Icon size={36} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Partnership() {
  return (
    <section className="section partnership-section">
      <div className="container">
        <div className="head-row">
          <div className="section-head reveal">
            <div className="eyebrow">A partnership that feels different</div>
            <h2>
              Less guesswork.
              <br />
              More clarity.
            </h2>
            <p>A great relationship starts with knowing what to expect.</p>
          </div>
          <a className="button secondary" href="#consultation">
            Meet your next growth partner <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="partnership-grid">
          {[
            [
              MessageCircle,
              'Real conversations',
              'Your business comes first. We explain the work clearly, listen to your priorities and keep you involved.',
            ],
            [
              BarChart3,
              'Reporting with context',
              'Understand what the numbers mean, which goals we are tracking and how the strategy is changing.',
            ],
            [
              Check,
              'A connected approach',
              'Your brand, content, website and campaigns work together toward a shared business goal.',
            ],
          ].map(([Icon, title, description], i) => {
            const I = Icon as typeof Check;
            return (
              <article
                className="card partnership-card reveal"
                key={String(title)}
              >
                <CardArt name={partnerArt[i]} />
                <I size={26} />
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
                <span className="partner-detail">
                  Built into every conversation <Check size={13} />
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export function FAQ() {
  return (
    <section className="section faq-section" id="faq">
      <div className="container faq-grid">
        <div className="reveal">
          <div className="eyebrow">Good questions. Clear answers.</div>
          <h2>
            Before your
            <br />
            next big move.
          </h2>
          <p>
            Have something else on your mind? Let’s talk about your business.
          </p>
          <a className="button primary" href="#consultation">
            Ask us a question <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="faq-list">
          {[
            [
              'Which service should I start with?',
              'We start with your goals, current online presence and audience. A consultation helps us recommend a focused starting point rather than a package you don’t need.',
            ],
            [
              'Do you work with local businesses?',
              'Yes. The approach can be tailored for restaurants, retailers, salons, fitness businesses, education, healthcare and other local services.',
            ],
            [
              'How long does it take to see progress?',
              'Timelines depend on your starting point, channel, budget and goals. Paid campaigns and organic growth work differently. We agree on expectations and review progress with you.',
            ],
            [
              'Is advertising spend included?',
              'We separate service fees and platform advertising budgets in the proposal so you can see where your money goes. Scope and fees are agreed before work begins.',
            ],
            [
              'What happens after the free consultation?',
              'We discuss your business, identify opportunities and agree on a useful next step. If there is a fit, we prepare a proposal with the scope, timeline and costs.',
            ],
          ].map(([question, answer], i) => (
            <details key={question}>
              <summary>
                <CardArt name={faqArt[i]} />
                <span>{question}</span>
                <Plus size={17} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
