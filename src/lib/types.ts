/**
 * The shapes the Laravel dashboard API returns.
 *
 * Mirrors the payloads built in app/Nxt/Dashboard/Services on the PHP side.
 * Money is always integer paise and times are always ISO 8601 strings; both are
 * converted at the edge by src/lib/format.ts and nowhere else.
 */

export type Role = 'student' | 'tutor';

export type Meter = {
  feature: string;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  reset_at: string | null;
};

export type Plan = {
  name: string;
  price: number;
  type: string;
  features: string[];
  status: string;
  started_on: string | null;
  renews_on: string | null;
  days_left: number | null;
};

export type Entitlements = {
  plan: Plan;
  meters: Meter[];
};

export type Profile = {
  user_id: string;
  role: Role;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  address: string | null;
  gender: string | null;
  dob: string | null;
  user_type: string | null;
  for_class: string | null;
  class_type: string | null;
  budget: string | null;
  experience: string | null;
  education: string | null;
  other_education: string | null;
  degree: string | null;
  profile: string | null;
  profile_desc: string | null;
  pro_desc: string | null;
  document_type: string | null;
  document_number: string | null;
  status: string | null;
  joined_on: string | null;
  /** Tutors only: the public profile families browse. Null without a city. */
  public_url: string | null;
  /** Tutors only: the form that asks a family for a review. */
  review_url: string | null;
  account: AccountState;
};

/** Hide profile and delete account. */
export type AccountState = {
  hidden: boolean;
  /** ISO time the profile comes back; null when visible or hidden indefinitely. */
  hidden_until: string | null;
  hidden_indefinitely: boolean;
  deletion_pending: boolean;
  /** ISO time the account is erased; null unless a deletion is pending. */
  delete_after: string | null;
  /** Accounts made on WhatsApp may have no password to confirm with. */
  has_password: boolean;
};

export type HideOption = '24h' | '3d' | '7d' | 'indefinite' | 'show';
export type DeleteOption = '24h' | '3d' | '7d';

export type Me = {
  user: Profile;
  role: Role;
  entitlements: Entitlements;
  unread_notifications: number;
  home_path: string;
};

export type TutorBrief = {
  user_id: string;
  name: string | null;
  avatar: string | null;
  city: string | null;
  verified: boolean;
};

export type StudentBrief = {
  user_id: string;
  name: string | null;
  avatar: string | null;
  class: string | null;
  board: string | null;
  city: string | null;
  locality: string | null;
};

export type SessionStatus =
  | 'scheduled'
  | 'checked_in'
  | 'checked_out'
  | 'confirmed'
  | 'disputed'
  | 'cancelled'
  | 'no_show';

export type SessionCard = {
  id: string;
  subject: string | null;
  type: 'demo' | 'regular' | 'doubt';
  mode: 'home' | 'online';
  address: string | null;
  meeting_url: string | null;
  starts_at: string | null;
  starts_in_minutes: number | null;
  planned_min: number;
  status: SessionStatus;
  tutor: TutorBrief | null;
  can_join: boolean;
};

export type SessionDetail = SessionCard & {
  topics: string[];
  actual_min: number | null;
  confidence: number | null;
  fee_paise: number;
  checked_in_at: string | null;
  checked_out_at: string | null;
  confirmed_at: string | null;
  can_confirm: boolean;
  auto_confirms_at: string | null;
  /** Manual check-in: never confirms on silence, only the family's answer settles it. */
  needs_your_confirmation?: boolean;
  events?: Array<{
    kind: string;
    method: string | null;
    at: string | null;
    device_time: string | null;
    offline: boolean;
    accuracy_m: number | null;
  }>;
};

export type HomeworkCard = {
  id: string;
  title: string;
  subject: string | null;
  instructions: string | null;
  due_at: string | null;
  due_label: string | null;
  status: 'open' | 'submitted' | 'marked' | 'cancelled';
  overdue: boolean;
  tutor: TutorBrief | null;
};

export type TrackerStep = {
  key: string;
  label: string;
  state: 'done' | 'current' | 'pending';
};

export type Requirement = {
  id: string;
  subject: string | null;
  class_level: string | null;
  board: string | null;
  mode: string;
  locality: string | null;
  city: string | null;
  slots: string[];
  budget_min_paise: number | null;
  budget_max_paise: number | null;
  note: string | null;
  status: string;
  match_count: number;
  created_at: string | null;
  steps: TrackerStep[];
  next_action: { label: string; href: string } | null;
};

export type StudentHome = {
  shape: 'today' | 'tracker';
  profile: Profile;
  entitlements: Entitlements;
  next_session: SessionCard | null;
  upcoming_sessions: SessionCard[];
  homework: { count: number; overdue_count: number; items: HomeworkCard[] };
  this_week: {
    week_start: string;
    attended: number;
    scheduled: number;
    tests_taken: number;
    test_average: number | null;
    homework_done: number;
  };
  requirements: Requirement[];
  renewal: {
    package_id: string;
    sessions_left: number;
    tutor: TutorBrief | null;
    subject: string | null;
    rate_paise: number;
    suggested_sessions: number;
    suggested_amount_paise: number;
  } | null;
  latest_summary: {
    id: string;
    week_start: string | null;
    week_end: string | null;
    counters: Record<string, number>;
    has_narrative: boolean;
    unread: boolean;
  } | null;
  wallet: { held_paise: number; active_packages: number };
  unread_notifications: number;
};

export type TutorCard = {
  ref: string;
  user_id: string;
  name: string;
  gender: string | null;
  city: string;
  area: string;
  pincode: string;
  subjects: string[];
  classes: string[];
  boards: string[];
  teaching_modes: string[];
  experience_years: number | null;
  education: string;
  fee_min: number | null;
  fee_max: number | null;
  fee_label: string | null;
  rating: number;
  review_count: number;
  description: string;
  image_url: string;
  profile_url: string;
  verified: boolean;
  reliability: Reliability | null;
};

export type Reliability = {
  score: number;
  punctuality: number;
  response: number;
  completion: number;
  window_start: string | null;
  window_end: string | null;
  top_events: Array<Record<string, unknown>>;
};

export type Match = {
  id: string;
  lead_id: string;
  fit_score: number;
  rank: number;
  status: string;
  reasons: string[];
  tutor: TutorCard;
};

export type MatchesPayload = {
  leads: Array<{
    id: string;
    subject: string | null;
    class_level: string | null;
    status: string;
    locality: string | null;
    city: string | null;
  }>;
  matches: Match[];
  saved: string[];
};

export type WalletPayload = {
  spent_paise: number;
  held_paise: number;
  balance_paise: number;
  packages: Array<{
    id: string;
    tutor_user_id: string;
    tutor: TutorBrief | null;
    subject: string | null;
    sessions_total: number;
    sessions_used: number;
    sessions_left: number;
    rate_paise: number;
    amount_paise: number;
    status: string;
    purchased_at: string | null;
  }>;
  entries: LedgerRow[];
};

export type LedgerRow = {
  id: string;
  account: string;
  kind: string;
  direction: 'debit' | 'credit';
  amount_paise: number;
  description: string;
  session_id: string | null;
  package_id: string | null;
  occurred_at: string | null;
};

export type StudyPlanPayload = {
  id: string;
  subject: string | null;
  week_start: string | null;
  generated_by: string;
  tutor: TutorBrief | null;
  items: Array<{
    id: string;
    title: string;
    subject: string | null;
    chapter: string | null;
    kind: 'in_class' | 'self_study';
    locked: boolean;
    due_at: string | null;
    done: boolean;
    edited_by: string | null;
  }>;
  progress: { done: number; total: number };
} | null;

export type ProgressPayload = {
  heatmap: Array<{
    subject: string;
    chapters: Array<{
      chapter: string | null;
      score: number | null;
      evidence: Record<string, string[]>;
      computed_for: string | null;
    }>;
  }>;
  summaries: Array<{
    id: string;
    week_start: string | null;
    week_end: string | null;
    counters: Record<string, number>;
    narrative: string | null;
    narrative_locked: boolean;
    read: boolean;
  }>;
};

// --------------------------------------------------------------------- tutor

export type LeadCard = {
  match_id: string;
  lead_id: string;
  class_level: string | null;
  board: string | null;
  subject: string | null;
  mode: string;
  locality: string | null;
  city: string | null;
  slots: string[];
  budget_min_paise: number | null;
  budget_max_paise: number | null;
  fit_score: number;
  status: string;
  received_at: string | null;
  expires_at: string | null;
  expires_in_minutes: number | null;
  viewed: boolean;
  opened?: boolean;
  note?: string | null;
  student_name?: string | null;
  reasons?: string[];
  start_by?: string | null;
  subjects?: string[];
  source?: string;
};

export type LeadDetail = LeadCard & {
  charged: boolean;
  reply_draft: string;
  suggested_rate_paise: number | null;
  existing_quote: { rate_paise: number; packages: Array<{ sessions: number; amount_paise: number }> } | null;
  replies: Array<{ id: string; body: string; delivery_status: string; sent_at: string | null }>;
  schedule_conflicts: Array<{ session_id: string; starts_at: string | null; subject: string | null }>;
  entitlements: Entitlements;
};

export type VerificationSummary = {
  verified: boolean;
  documents: Array<{
    doc_type: string;
    label: string;
    required: boolean;
    status: 'missing' | 'pending' | 'approved' | 'rejected';
    comment: string | null;
    reviewed_at: string | null;
  }>;
  missing: string[];
};

export type Completeness = {
  percent: number;
  checks: Array<{ field: string; done: boolean; label: string; weight: number; why: string }>;
  next_step: { label: string; why: string; field: string } | null;
};

export type TutorSessionRow = {
  id: string;
  student: StudentBrief | null;
  subject: string | null;
  type: string;
  mode: 'home' | 'online';
  address: string | null;
  meeting_url: string | null;
  starts_at: string | null;
  starts_in_minutes: number | null;
  planned_min: number;
  status: SessionStatus;
  fee_paise: number;
  can_check_in: boolean;
  can_check_out: boolean;
  late_by_minutes: number | null;
};

export type TutorHome = {
  profile: Profile;
  entitlements: Entitlements;
  verification: VerificationSummary;
  can_receive_leads: boolean;
  today: { count: number; sessions: TutorSessionRow[] };
  next_session: TutorSessionRow | null;
  leads: {
    new_count: number;
    total_open?: number;
    expiring_soon: number;
    avg_reply_minutes: number | null;
    first: LeadCard | null;
    blocked: boolean;
  };
  this_month: {
    earned_this_month_paise: number;
    pending_paise: number;
    payable_paise: number;
    commission_this_month_paise: number;
    sessions_done_this_month: number;
    sessions_awaiting_confirmation: number;
    lead_views_used: number;
    next_payout_on: string;
    entries: LedgerRow[];
  };
  completeness: Completeness;
  reliability: Reliability | null;
  rating: { average: number; count: number; breakdown: Record<string, number> };
  students: { active: number; total: number; packages_ending: number };
  unmarked_homework: { count: number; overdue_count: number };
  unread_notifications: number;
};

export type RosterRow = {
  student: StudentBrief | null;
  subjects: string[];
  sessions_left: number;
  package_status: 'active' | 'ended';
  next_session_at: string | null;
  homework_pending: number;
  can_request_renewal: boolean;
};

export type EarningsPayload = TutorHome['this_month'] & {
  payouts: Array<{
    id: string;
    amount_paise: number;
    status: string;
    period_start: string | null;
    period_end: string | null;
    paid_at: string | null;
  }>;
};

export type GrowthPayload = {
  reliability: Reliability | null;
  verification: VerificationSummary;
  completeness: Completeness;
  reviews: {
    count: number;
    average: number;
    breakdown: Record<string, number>;
    items: Array<{
      id: number;
      name: string | null;
      rating: number;
      expertise: number;
      patience: number;
      reliability: number;
      communication: number;
      message: string | null;
      date: string | null;
      photo_url: string | null;
      email_verified: boolean;
      /** "Parent · Class 12 · ISC · Physics · Home tuition" */
      context: string | null;
      tags: string[];
    }>;
  };
  plan: Entitlements;
  analytics: {
    leads_received: number;
    leads_replied: number;
    leads_won: number;
    reply_rate: number | null;
    win_rate: number | null;
    sessions_completed: number;
    sessions_cancelled: number;
    lead_views_used: number;
  };
};

export type AppNotification = {
  id: string;
  event: string;
  title: string;
  body: string | null;
  deep_link: string | null;
  channel: string;
  read: boolean;
  created_at: string | null;
};
