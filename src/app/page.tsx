import { requireApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * The bare root is not a screen. Whoever lands here is sent to the home of
 * whichever app their account belongs to.
 */
export default async function RootPage() {
  const { data: me } = await requireApi<Me>('/me');
  redirect(me.home_path);
}
