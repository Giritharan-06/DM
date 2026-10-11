'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from 'better-auth/react';
import { Button } from '@zyroz/ui';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <a
          href={process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}
          className="logo"
        >
          <span className="logo-mark">z</span>zyroz.
        </a>
        <div>
          <div className="eyebrow">Your agency, connected</div>
          <h1>
            More clarity.
            <br />
            More momentum.
          </h1>
          <p>
            From the first conversation to the next big campaign. Bring your
            people, clients and possibilities together.
          </p>
        </div>
        <p style={{ fontSize: 11 }}>ZYROZ Agency Workspace</p>
      </div>
      <div className="auth-form-wrap">
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            const form = new FormData(e.currentTarget);
            try {
              const result = await createAuthClient().signIn.email({
                email: String(form.get('email')),
                password: String(form.get('password')),
              });
              if (result.error)
                throw new Error(result.error.message || 'Sign-in failed.');
              router.push('/');
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Unable to sign in.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="eyebrow">Welcome back</div>
          <h2>Your workspace awaits.</h2>
          <p>Sign in with your agency account.</p>
          <label className="field">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="you@your-agency.com"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowUpRight size={17} />
          </Button>
          <p style={{ fontSize: 11, marginTop: 25, textAlign: 'center' }}>
            Need access or a password reset? Contact your agency owner.
          </p>
          <p
            className="row"
            style={{ justifyContent: 'center', fontSize: 10, marginTop: 45 }}
          >
            <ShieldCheck size={14} /> Secure access for authorized team members
          </p>
        </form>
      </div>
    </div>
  );
}
