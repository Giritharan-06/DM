'use client';
import Link from 'next/link';
import { CardArt } from './card-art';
import { useState, useRef } from 'react';
import Script from 'next/script';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquirySchema, industries, serviceNames } from '@zyroz/validation';
import type { z } from 'zod';
import { Button } from '@zyroz/ui';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
  }
}
type Values = z.input<typeof enquirySchema>;
export function Consultation() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const widget = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { website: '' },
  });
  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      const utm = Object.fromEntries(
        [...new URLSearchParams(window.location.search)]
          .filter(([k]) => k.startsWith('utm_'))
          .slice(0, 8),
      );
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, utm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      setSent(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'We could not submit your enquiry.',
      );
      if (widgetId) window.turnstile?.reset(widgetId);
    }
  });
  if (sent)
    return (
      <div className="card success" role="status">
        <CardArt name="unique-feature-success" />
        <h3>Your next chapter starts here.</h3>
        <p>
          Your consultation enquiry has been received. The Zyroz Digital team can now
          review your business goals.
        </p>
      </div>
    );
  const field = (
    name: 'name' | 'businessName' | 'email' | 'phone',
    label: string,
    type = 'text',
  ) => (
    <label className="field">
      {label}
      <input
        type={type}
        {...register(name)}
        aria-invalid={!!errors[name]}
        required
      />
      {errors[name] && (
        <span className="error" role="alert">
          {errors[name]?.message}
        </span>
      )}
    </label>
  );
  return (
    <form className="card consult-form" onSubmit={submit} noValidate>
      <CardArt name="unique-feature-consultation" />
      <h3>Get your free consultation</h3>
      <p style={{ fontSize: 12, marginBottom: 25 }}>
        Tell us a little about your business. We’ll help you find a clear next
        step.
      </p>
      <div className="form-grid">
        {field('name', 'Your name')}
        {field('businessName', 'Business name')}
        {field('email', 'Email address', 'email')}
        {field('phone', 'Phone number', 'tel')}
        <label className="field">
          Business category
          <select {...register('industry')} defaultValue="">
            <option value="" disabled>
              Select your industry
            </option>
            {industries.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {errors.industry && (
            <span role="alert">{errors.industry.message}</span>
          )}
        </label>
        <label className="field">
          Interested service
          <select {...register('service')} defaultValue="">
            <option value="" disabled>
              What can we help with?
            </option>
            {serviceNames.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {errors.service && <span role="alert">{errors.service.message}</span>}
        </label>
        <label className="field span-2">
          Monthly marketing budget
          <select {...register('budget')} defaultValue="">
            <option value="" disabled>
              Select a budget range
            </option>
            {[
              'Under ₹15,000',
              '₹15,000–₹30,000',
              '₹30,000–₹75,000',
              '₹75,000+',
              'Let’s discuss',
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {errors.budget && <span role="alert">{errors.budget.message}</span>}
        </label>
        <label className="field span-2">
          What would you like to achieve?
          <textarea
            {...register('goal')}
            placeholder="Tell us a little about your business and goals."
          />
          {errors.goal && <span role="alert">{errors.goal.message}</span>}
        </label>
        <label className="field span-2">
          Anything else? <span className="muted">Optional</span>
          <textarea {...register('message')} rows={2} />
        </label>
      </div>
      <div className="sr-only" aria-hidden="true">
        <label>
          Website
          <input {...register('website')} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" {...register('consent')} />I agree to be
        contacted about my enquiry and have read the{' '}
        <Link href="/privacy" style={{ textDecoration: 'underline' }}>
          privacy policy
        </Link>
        .
      </label>
      {errors.consent && (
        <p className="error" role="alert">
          Please consent to being contacted.
        </p>
      )}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => {
              if (widget.current && !widgetId)
                setWidgetId(
                  window.turnstile?.render(widget.current, {
                    sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                    callback: (token: string) =>
                      setValue('turnstileToken', token),
                    'expired-callback': () => setValue('turnstileToken', ''),
                  }) || '',
                );
            }}
          />
          <div ref={widget} />
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
        {isSubmitting ? <LoaderCircle size={16} /> : null}
        {isSubmitting ? 'Sending your enquiry…' : 'Get My Free Consultation'}
        <ArrowUpRight size={17} />
      </Button>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '15px 0 0' }}>
        No pressure. Just a conversation about your next step.
      </p>
    </form>
  );
}
