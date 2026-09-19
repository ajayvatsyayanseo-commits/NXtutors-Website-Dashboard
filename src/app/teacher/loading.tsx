import { CardSkeleton } from '@/components/ui/primitives';

/**
 * Skeletons, not spinners. The layout is already correct while the data is in
 * flight, so nothing jumps when it lands — which is what keeps CLS under 0.1.
 */
export default function Loading() {
  return (
    <div className="space-y-3">
      <CardSkeleton lines={4} />
      <CardSkeleton lines={2} />
      <CardSkeleton lines={3} />
    </div>
  );
}
