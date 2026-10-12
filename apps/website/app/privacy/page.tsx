import Link from 'next/link';
import Image from 'next/image';
export default function Privacy() {
  return (
    <main className="legal" id="main">
      <Link className="logo" href="/">
        <Image className="brand-icon" src="/zyroz-mark.png" alt="" width={60} height={60} />
        <span>Zyroz Digital</span>
      </Link>
      <h1 style={{ marginTop: 35 }}>Privacy policy</h1>
      <p>
        Draft policy — the agency owner must review and complete business
        identity, contact, retention periods and applicable legal requirements
        before accepting production enquiries.
      </p>
      <h2>Information you provide</h2>
      <p>
        The consultation form collects your name, business, contact details,
        marketing interests, budget, goals and message. We use these details to
        review and respond to your enquiry and manage the resulting customer
        relationship.
      </p>
      <h2>Processing and providers</h2>
      <p>
        Enquiries are stored in PostgreSQL and accessed by authorized agency
        staff. Hosting, bot protection, email and storage providers may process
        information when configured. Marketing messages require a separate
        appropriate permission.
      </p>
      <h2>Your choices</h2>
      <p>
        You can request access, correction or deletion using the agency contact
        details once configured. Do not include sensitive personal information
        in the enquiry form.
      </p>
      <h2>Retention and security</h2>
      <p>
        The agency must set an appropriate retention period and review archived
        records. Access controls, encrypted provider connections and server-side
        validation help protect information.
      </p>
      <Link href="/">← Return to Zyroz Digital</Link>
    </main>
  );
}
