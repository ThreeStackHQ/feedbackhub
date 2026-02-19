'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  tier: 'pro' | 'business';
  cta: string;
  highlighted?: boolean;
}

export function CheckoutButton({ tier, cta, highlighted = false }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (response.status === 401) {
        // Not logged in — redirect to signup
        window.location.href = '/signup';
        return;
      }

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        alert(error.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const data = await response.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        highlighted
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
    >
      {loading ? 'Redirecting...' : cta}
    </button>
  );
}
