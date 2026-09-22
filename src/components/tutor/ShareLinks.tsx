'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/primitives';

/**
 * The two links a tutor sends to families, kept apart because they do
 * different jobs: the public profile is for someone choosing a tutor, the
 * review link is for a family the tutor already teaches.
 */
export function ShareLinks({
  name,
  publicUrl,
  reviewUrl,
}: {
  name: string | null;
  publicUrl: string | null;
  reviewUrl: string | null;
}) {
  const tutor = name ?? 'your tutor';

  return (
    <div className="space-y-4">
      <ShareRow
        title="Your public profile"
        hint="Send this to families looking for a tutor."
        url={publicUrl}
        missing="Add your city in Profile to get a public page."
        whatsappText={`Hi! Here is my tutor profile on NXTutors, with my subjects, experience and reviews: ${publicUrl ?? ''}`}
      />
      <ShareRow
        title="Ask for a review"
        hint="Send this to students and parents you teach. Reviews go live after our team checks them."
        url={reviewUrl}
        missing={null}
        whatsappText={`Hi! It would mean a lot if you could share your experience of classes with ${tutor}. It takes 2 minutes: ${reviewUrl ?? ''}`}
      />
    </div>
  );
}

function ShareRow({
  title,
  hint,
  url,
  missing,
  whatsappText,
}: {
  title: string;
  hint: string;
  url: string | null;
  missing: string | null;
  whatsappText: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!url) {
    return missing ? (
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm text-slate">{missing}</p>
      </div>
    ) : null;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url as string);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-slate">{hint}</p>
      <p className="mt-2 break-all rounded-card bg-canvas px-3 py-2 text-xs text-slate">{url}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button tone="secondary" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </Button>
        <ButtonLink href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} tone="secondary" external>
          Share on WhatsApp
        </ButtonLink>
        <ButtonLink href={url} tone="ghost" external>
          Open
        </ButtonLink>
      </div>
    </div>
  );
}
