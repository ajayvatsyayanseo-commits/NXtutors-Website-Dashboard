import { requireApi, tryApi } from '@/lib/api';
import type { AppNotification, Entitlements, Me, Profile, WalletPayload } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import {
  Avatar,
  ButtonLink,
  EmptyState,
  MeterBar,
  Pill,
  SectionHeading,
  Stat,
  StatusPill,
} from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { PasswordSection, ProfileSection } from '@/components/account/ProfileForm';
import { AvatarUpload } from '@/components/account/AvatarUpload';
import { PlanGrid, type PlanOption } from '@/components/account/PlanGrid';
import { MessageThreads, type Thread } from '@/components/account/MessageThreads';
import {
  ADDRESS_FIELDS,
  LEARNING_FIELDS,
  PERSONAL_FIELDS,
} from '@/components/account/sections';
import { ago, dateLabel, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Account: plan and credits, wallet, profile, notifications and help.
 *
 * The wallet is the screen families come here for, and it says in plain words
 * what every line of it means. "Held until each class is completed" is not
 * decoration — it is the difference between a parent trusting the platform with
 * a package and asking to pay the tutor in cash.
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'plan' } = await searchParams;

  const { data: me } = await requireApi<Me>('/me');

  return (
    <div>
      <SectionHeading title="Account" subtitle={me.user.name ?? undefined} />

      <Tabs
        base="/user/account"
        current={tab}
        items={[
          { key: 'plan', label: 'Plan & credits' },
          { key: 'wallet', label: 'Wallet' },
          { key: 'messages', label: 'Messages' },
          { key: 'profile', label: 'Profile' },
          { key: 'notifications', label: 'Notifications', badge: me.unread_notifications },
          { key: 'help', label: 'Help' },
        ]}
      />

      {tab === 'plan' && <PlanTab />}
      {tab === 'wallet' && <WalletTab />}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'profile' && <ProfileTab me={me} />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'help' && <HelpTab />}
    </div>
  );
}

async function PlanTab() {
  const { data } = await requireApi<
    Entitlements & { history: Array<{ id: string; label: string; delta: number; reason: string; at: string | null }> }
  >('/account/plan');

  const plans = (await tryApi<PlanOption[]>('/plans')) ?? [];

  return (
    <div className="space-y-3">
      <Card label="Your plan">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-navy">{data.plan.name}</p>
            <p className="mt-0.5 text-sm text-slate">
              {data.plan.price > 0 ? `Rs ${data.plan.price} every 30 days` : 'Free plan'}
              {data.plan.renews_on && ` · renews ${dateLabel(data.plan.renews_on)}`}
            </p>
          </div>
        </div>

        {data.plan.features.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
            {data.plan.features.map((feature) => (
              <li key={feature} className="text-sm text-slate">
                {feature}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="Credits">
        <div className="space-y-4">
          {data.meters.map((meter) => (
            <MeterBar
              key={meter.feature}
              label={meter.label}
              used={meter.used}
              limit={meter.limit}
              remaining={meter.remaining}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-slate">
          Unused credits do not roll over. They reset at the start of each cycle.
        </p>
      </Card>

      <PlanGrid plans={plans} currentPlanName={data.plan.name} role="student" />

      <Card label="Where your credits went">
        {data.history.length === 0 ? (
          <p className="text-sm text-slate">Nothing used yet this cycle.</p>
        ) : (
          <ul>
            {data.history.map((row) => (
              <li key={row.id}>
                <CardRow>
                  <div>
                    <p className="text-sm font-medium text-ink">{row.label}</p>
                    <p className="mt-0.5 text-sm text-slate">
                      {row.reason === 'refund' ? 'Refunded automatically' : 'Used'} · {ago(row.at)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${row.delta > 0 ? 'text-ok' : 'text-ink'}`}
                  >
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </span>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function WalletTab() {
  const { data } = await requireApi<WalletPayload>('/account/wallet');

  return (
    <div className="space-y-3">
      <Card label="Your money">
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Held for classes"
            value={money(data.held_paise)}
            hint="released as each class is confirmed"
            tone="warn"
          />
          <Stat label="Spent on packages" value={money(data.spent_paise)} />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-sm text-slate">
          When you buy a package the full amount is taken, and each class&rsquo;s fee is held until
          that class is completed and you confirm it. Unused classes are refunded as credit.
        </p>
      </Card>

      <Card label="Packages">
        {data.packages.length === 0 ? (
          <EmptyState
            title="No packages yet."
            body="After a free demo you can buy a package to start regular classes."
          />
        ) : (
          <ul>
            {data.packages.map((pack) => (
              <li key={pack.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {pack.subject} with {pack.tutor?.name ?? 'your tutor'}
                    </p>
                    <p className="mt-0.5 text-sm text-slate">
                      {pack.sessions_left} of {pack.sessions_total} classes left ·{' '}
                      {money(pack.rate_paise)} each
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Bought {dateLabel(pack.purchased_at)} · {money(pack.amount_paise)} total
                    </p>
                  </div>
                  <StatusPill status={pack.status} />
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="Every transaction">
        {data.entries.length === 0 ? (
          <p className="text-sm text-slate">Nothing yet.</p>
        ) : (
          <ul>
            {data.entries.map((entry) => (
              <li key={entry.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{entry.description}</p>
                    <p className="mt-0.5 text-sm text-slate">{dateLabel(entry.occurred_at)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {entry.direction === 'debit' ? '−' : '+'}
                    {money(entry.amount_paise).replace('Rs ', 'Rs ')}
                  </span>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/**
 * The editable profile, replacing the Blade form section for section.
 */
async function ProfileTab({ me }: { me: Me }) {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';
  const { data } = await requireApi<{ profile: Profile; avatar_url: string | null }>('/profile');
  const values = data.profile as unknown as Record<string, string | null>;

  return (
    <div className="space-y-3">
      <Card label="Photo">
        <div className="flex items-center gap-4">
          <Avatar src={data.avatar_url} name={data.profile.name} size={64} />
          <AvatarUpload />
        </div>
      </Card>

      <ProfileSection
        section="personal"
        title="Personal information"
        description="Your name, how we reach you, and your date of birth."
        fields={PERSONAL_FIELDS}
        values={values}
      />

      <ProfileSection
        section="learning"
        title="What you are looking for"
        description="Class, board and budget. Matching reads all three."
        fields={LEARNING_FIELDS}
        values={values}
      />

      <ProfileSection
        section="address"
        title="Address"
        description="Where home tuition would happen."
        fields={ADDRESS_FIELDS}
        values={values}
      />

      <PasswordSection />

      <Card label="Your account">
        <p className="text-sm text-slate">
          Member since {data.profile.joined_on ?? 'your first sign-in'}. Phone:{' '}
          {data.profile.phone ?? 'not set'}. You use the same NXTutors account here and on the main
          site, so signing out here signs you out everywhere.
        </p>
        <div className="mt-3">
          <ButtonLink href={`${site}/logout`} tone="secondary" external>
            Sign out
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

/** The message list the Blade sidebar linked to javascript:void(0). */
async function MessagesTab() {
  const threads = (await tryApi<Thread[]>('/messages')) ?? [];
  return <MessageThreads threads={threads} />;
}

async function NotificationsTab() {
  const rows = await tryApi<AppNotification[]>('/notifications');

  if (!rows || rows.length === 0) {
    return <EmptyState title="Nothing yet." body="Class reminders and updates will appear here." />;
  }

  return (
    <Card label="Notifications">
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <CardRow>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{row.title}</p>
                {row.body && <p className="mt-0.5 text-sm text-slate">{row.body}</p>}
                <p className="mt-1 text-xs text-muted">{ago(row.created_at)}</p>
              </div>
              {!row.read && <Pill tone="accent">New</Pill>}
            </CardRow>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HelpTab() {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="space-y-3">
      <Card label="Talk to a person">
        <p className="text-sm text-slate">
          Message us on WhatsApp and we reply fast. Tell us what screen you were on and we will pick
          it up from there.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink
            href={`https://wa.me/?text=${encodeURIComponent('Hello, I need help with my NXTutors dashboard')}`}
            external
          >
            Chat on WhatsApp
          </ButtonLink>
          <ButtonLink href={`${site}/contact`} tone="secondary" external>
            Other ways to reach us
          </ButtonLink>
        </div>
      </Card>

      <Card label="Common questions">
        <ul className="space-y-3 text-sm">
          <li>
            <p className="font-medium text-ink">When am I charged for a class?</p>
            <p className="mt-0.5 text-slate">
              The package is paid up front. Each class&rsquo;s fee is held and released to your tutor
              once the class is completed and confirmed.
            </p>
          </li>
          <li>
            <p className="font-medium text-ink">What if a class did not happen?</p>
            <p className="mt-0.5 text-slate">
              Open the class in Learn and raise an issue within 24 hours. Payment is held until our
              team resolves it.
            </p>
          </li>
          <li>
            <p className="font-medium text-ink">Can I change tutor?</p>
            <p className="mt-0.5 text-slate">
              Yes, at any time. Classes you have already paid for transfer across, and you see the
              exact conversion before confirming.
            </p>
          </li>
        </ul>
      </Card>
    </div>
  );
}
