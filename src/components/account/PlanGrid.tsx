import { Card } from '@/components/ui/Card';
import { ButtonLink, Pill } from '@/components/ui/primitives';

export type PlanOption = {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  ai_credits: number;
  contact_limit: number;
  lead_limit: number;
  features: string[];
  checkout_url: string;
};

/**
 * The plan comparison the Blade "My Plan" screen owned.
 *
 * Purchase still runs through the existing payment flow — the checkout link
 * goes straight to it — because moving a working payment integration is the
 * riskiest thing on this list and buys nothing.
 *
 * Plans are listed cheapest first with the current one marked, rather than the
 * most expensive pushed to the top. The brief is explicit that upgrades are
 * offered where a meter blocks an action, not by making the screen a sales page.
 */
export function PlanGrid({
  plans,
  currentPlanName,
  role,
}: {
  plans: PlanOption[];
  currentPlanName: string;
  role: 'student' | 'tutor';
}) {
  if (plans.length === 0) return null;

  return (
    <Card label="Change your plan">
      <ul className="space-y-3">
        {plans.map((plan) => {
          const current = plan.name === currentPlanName;

          return (
            <li
              key={plan.id}
              className={`rounded-card border p-4 ${
                current ? 'border-accent bg-accent-soft/30' : 'border-line'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold text-navy">{plan.name}</span>
                  {current && <Pill tone="accent">Your plan</Pill>}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {plan.price > 0 ? `Rs ${plan.price} / ${plan.duration_days} days` : 'Free'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
                <span>{plan.ai_credits} AI credits</span>
                {role === 'tutor' ? (
                  <span>{plan.lead_limit} lead views</span>
                ) : (
                  <span>{plan.contact_limit} tutor contacts</span>
                )}
              </div>

              {plan.features.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="text-sm text-slate">
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {!current && plan.price > 0 && (
                <div className="mt-3">
                  <ButtonLink href={plan.checkout_url} tone="secondary" external>
                    Switch to {plan.name}
                  </ButtonLink>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-slate">
        A change takes effect at the end of your current period, and credits already granted for
        this period are not removed.
      </p>
    </Card>
  );
}
