'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for error in URL params
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError && status === 'idle' && !errorMessage) {
      setErrorMessage(urlError);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send login link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-rani-navy">
            Rani Beauty Clinic
          </h1>
          <p className="text-xs text-rani-muted uppercase tracking-[3px] mt-2">
            Patient Portal
          </p>
        </div>

        {status === 'sent' ? (
          /* Success state */
          <div className="bg-white rounded-2xl shadow-sm border border-rani-border p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="font-heading text-xl text-rani-navy mb-2">Check Your Email</h2>
            <p className="text-sm text-rani-muted leading-relaxed">
              We sent a secure login link to <strong className="text-rani-text">{email}</strong>.
              Click the link in the email to access your portal.
            </p>
            <p className="text-xs text-rani-muted mt-4">
              The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail(''); }}
              className="mt-6 text-sm text-rani-navy hover:text-rani-gold transition-colors font-medium"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Login form */
          <div className="bg-white rounded-2xl shadow-sm border border-rani-border p-8">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-rani-cream flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-rani-gold-accessible" />
              </div>
              <h2 className="font-heading text-xl text-rani-navy">Welcome Back</h2>
              <p className="text-sm text-rani-muted mt-1">
                Sign in to view your treatments, appointments, and rewards.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-rani-muted uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-rani-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded-xl border border-rani-border bg-rani-cream/30 pl-11 pr-4 py-3 text-sm text-rani-text placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rani-navy px-4 py-3.5 text-sm font-medium text-rani-gold hover:bg-rani-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === 'loading' ? (
                  <>
                    <div className="h-4 w-4 border-2 border-rani-gold/30 border-t-rani-gold rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Login Link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-rani-muted">
              No password needed. We&apos;ll email you a secure link.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-rani-muted mt-6">
          Need help?{' '}
          <a href="tel:+14258906395" className="text-rani-navy hover:text-rani-gold transition-colors">
            Call (425) 890-6395
          </a>
        </p>
      </div>
    </div>
  );
}
