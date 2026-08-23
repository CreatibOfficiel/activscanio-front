'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/app/utils/authenticated-fetch';

interface Reminder {
  id: string;
  firstName: string;
  years: number;
  contactUrl: string | null;
  totalGames: number;
  characterName: string | null;
}

export default function AlumniReminderBanner() {
  const { getToken, isSignedIn } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    authenticatedFetch(
      getToken,
      `${process.env.NEXT_PUBLIC_API_URL}/alumni/reminders/claim`,
    )
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Reminder[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  if (dismissed || items.length === 0) return null;
  const names = items.map((item) => item.firstName).join(', ');
  const years = items.length === 1 ? items[0].years : null;
  return (
    <aside className="fixed left-4 right-4 top-4 z-[70] mx-auto max-w-3xl rounded-2xl border border-amber-400/40 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🤝</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">
            {items.length === 1
              ? `Ça fait ${years} an${years === 1 ? '' : 's'} que ${names} est parti·e.`
              : `Aujourd’hui, on pense à ${names}.`}
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Tu as pris de {items.length === 1 ? 'ses' : 'leurs'} nouvelles depuis ? Sinon, c’est peut-être le moment.
            {items.length === 1 && items[0].totalGames > 0
              ? ` Souvenir : ${items[0].totalGames} partie${items[0].totalGames > 1 ? 's' : ''} jouée${items[0].totalGames > 1 ? 's' : ''}${items[0].characterName ? ` avec ${items[0].characterName}` : ''}.`
              : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {items.filter((item) => item.contactUrl).map((item) => (
              <a key={item.id} href={item.contactUrl!} target="_blank" rel="noreferrer" className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-neutral-950">
                Contacter {item.firstName}
              </a>
            ))}
            <button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
