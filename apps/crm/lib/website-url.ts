// The public site is a separate Vercel project, so a missing build variable
// must never send production CRM visitors to localhost.
export const websiteUrl =
  process.env.NEXT_PUBLIC_WEBSITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://zyrozdigital.vercel.app'
    : 'http://localhost:3000');
