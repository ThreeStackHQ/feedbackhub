import Link from 'next/link';
import { CheckoutButton } from '@/components/checkout-button';

export const metadata = {
  title: 'Pricing — FeedbackHub',
  description: 'Simple, honest pricing. Start free, upgrade when you need more.',
};

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    tier: 'free' as const,
    features: [
      '1 feedback board',
      'Up to 100 feature requests',
      'Public voting board',
      'Comment threads',
      'Status updates',
    ],
    cta: 'Start Free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 9,
    description: 'For growing products',
    tier: 'pro' as const,
    features: [
      'Unlimited feedback boards',
      'Unlimited feature requests',
      'Embeddable widget',
      'Email notifications',
      'Priority support',
      'CSV export',
    ],
    cta: 'Get Pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: 29,
    description: 'For teams and enterprises',
    tier: 'business' as const,
    features: [
      'Everything in Pro',
      'White-label (remove branding)',
      'API access',
      'Custom domain',
      'SSO (coming soon)',
      'SLA guarantee',
    ],
    cta: 'Get Business',
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            FeedbackHub
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free. Upgrade when your product grows. No hidden fees, no surprises.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-600 shadow-lg shadow-indigo-100'
                  : 'border-gray-200'
              }`}
            >
              {'badge' in plan && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.tier === 'free' ? (
                <Link
                  href={plan.ctaHref}
                  className="block text-center py-3 px-6 rounded-xl font-semibold text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {plan.cta}
                </Link>
              ) : (
                <CheckoutButton
                  tier={plan.tier}
                  cta={plan.cta}
                  highlighted={plan.highlighted}
                />
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. You can cancel your subscription at any time. Your plan stays active until the end of the billing period.',
              },
              {
                q: 'Do you offer a free trial?',
                a: 'The Free plan is forever free — no credit card required. You can upgrade whenever you need more boards or features.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit and debit cards via Stripe. Invoicing available on Business plan.',
              },
              {
                q: 'Can I change plans later?',
                a: 'Absolutely. You can upgrade or downgrade your plan at any time from your dashboard.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <dt className="font-semibold text-gray-900">{q}</dt>
                <dd className="mt-1 text-gray-600 text-sm">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
