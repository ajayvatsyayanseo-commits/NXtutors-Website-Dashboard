import { ButtonLink } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xl font-semibold text-navy">We could not find that.</p>
      <p className="mt-2 text-sm text-slate">
        The link may be old, or it may belong to a different account. Your dashboard is still here.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/user/dashboard">Go to my dashboard</ButtonLink>
      </div>
    </div>
  );
}
