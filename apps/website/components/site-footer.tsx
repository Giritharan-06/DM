import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { serviceNames, type WebsiteSettings } from '@zyroz/validation';
import { BrandIcon, SocialLinks } from './premium-elements';
import { CardArt } from './card-art';

export function SiteFooter({ contact }: { contact: WebsiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-invitation">
          <div>
            <span className="eyebrow">
              YOUR NEXT CHAPTER
            </span>
            <h2>
              Big ideas.
              <br />
              <em>Brighter possibilities.</em>
            </h2>
            <p>
              Bring your ambition. We’ll bring the strategy, creativity and a
              clear way forward.
            </p>
            <a href="#consultation" className="button primary">
              Let’s build something great <ArrowUpRight size={18} />
            </a>
          </div>
          <CardArt name="unique-feature-footer" />
        </div>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <Image className="brand-icon" src="/zyroz-mark.png" alt="" width={80} height={80} />
              <span>Zyroz Digital</span>
            </Link>
            <p>
              A digital growth partner for ambitious businesses. We connect your
              brand, content, campaigns and website around the people you want
              to reach.
            </p>
            <span className="footer-social-heading">Stay connected</span>
            <SocialLinks profile={contact} compact showUnconfigured />
            <div className="footer-brand-note">
              Strategy. Creativity. Connection.
            </div>
          </div>
          <div>
            <h4>Our services</h4>
            {serviceNames.map((name, i) => (
              <a href={`#service-${i + 1}`} key={name}>
                {name}
              </a>
            ))}
          </div>
          <div>
            <h4>Discover Zyroz Digital</h4>
            <a href="#studio">The growth studio</a>
            <a href="#approach">Our approach</a>
            <a href="#process">How we work</a>
            <a href="#industries">Industry solutions</a>
            <a href="#work">Ideas in action</a>
            <a href="#plans">Find your growth plan</a>
            <a href="#faq">Frequently asked questions</a>
          </div>
          <div className="footer-contact">
            <h4>Let’s talk growth</h4>
            <p>
              Tell us about your business and the next move you have in mind.
            </p>
            <a href="#consultation">
              <ArrowUpRight size={17} /> Book a free consultation
            </a>
            {contact.email && (
              <a href={`mailto:${contact.email}`}>
                <Mail size={17} /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`}>
                <Phone size={17} /> {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BrandIcon brand="whatsapp" /> Chat on WhatsApp
              </a>
            )}
            {contact.bookingUrl && (
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowUpRight size={17} /> Schedule a conversation
              </a>
            )}
            <span className="footer-contact-note">
              A thoughtful first conversation.
              <br />
              No pressure. No obligation.
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Zyroz Digital. All rights reserved.</span>
          <div>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms & conditions</Link>
            <a
              href={process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001'}
            >
              Team workspace ↗
            </a>
            <a href="#main">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
