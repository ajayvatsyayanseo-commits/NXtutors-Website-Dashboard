'use client';

import { ErrorState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/primitives';

/**
 * A screen-level failure still offers the next action and the WhatsApp
 * fallback. "Blank white" is a bug, and so is an error that only apologises.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <ErrorState screen="your dashboard" />
      <div className="flex justify-center">
        <Button tone="secondary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
