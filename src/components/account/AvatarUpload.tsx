'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives';

/**
 * Profile photo upload.
 *
 * Posts through a Next route handler rather than a server action, because a
 * server action would have to buffer the whole file into the action payload;
 * a multipart stream forwarded to Laravel keeps memory flat and reuses the
 * upload validation the API already does.
 */
export function AvatarUpload() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const upload = (file: File) => {
    setError(null);

    const body = new FormData();
    body.append('avatar', file);

    startTransition(async () => {
      const response = await fetch('/api/profile-avatar', { method: 'POST', body });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.errors?.[0]?.message ?? 'That image could not be saved. Try another.');
        return;
      }

      router.refresh();
    });
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      <Button tone="secondary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? 'Uploading…' : 'Change photo'}
      </Button>

      <p className="mt-2 text-xs text-slate">JPG, PNG or WebP, up to 2 MB.</p>

      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
