import Link from 'next/link';
import Image from 'next/image';
export default function Terms() {
  return (
    <main className="legal" id="main">
      <Link className="logo" href="/">
        <Image className="brand-icon" src="/zyroz-mark.png" alt="" width={60} height={60} />
        <span>Zyroz Digital</span>
      </Link>
      <h1 style={{ marginTop: 35 }}>Terms & conditions</h1>
      <p>
        Draft terms — complete the agency’s legal identity, jurisdiction and
        contractual terms before production launch.
      </p>
      <h2>Consultations and services</h2>
      <p>
        Submitting an enquiry requests a consultation. It does not establish a
        paid service agreement. Scope, fees, timelines, approvals and
        cancellation terms must be agreed in a separate written contract.
      </p>
      <h2>Results and examples</h2>
      <p>
        Marketing outcomes depend on many factors. No sales, ranking or revenue
        outcome is guaranteed. Demonstration examples on this website illustrate
        possible approaches and do not represent verified client results.
      </p>
      <h2>Use of this website</h2>
      <p>
        Provide accurate information, respect intellectual property and avoid
        abusive or automated submissions. External services may have their own
        terms.
      </p>
      <Link href="/">← Return to Zyroz Digital</Link>
    </main>
  );
}
