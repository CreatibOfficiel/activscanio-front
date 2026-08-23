'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '@/app/utils/authenticated-fetch';
import type { Competitor } from '@/app/models/Competitor';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPlayersPage() {
  const { getToken } = useAuth();
  const [players, setPlayers] = useState<Competitor[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await authenticatedFetch(getToken, `${API}/admin/competitors`);
    if (!response.ok) throw new Error(response.status === 403 ? 'Accès administrateur requis' : 'Chargement impossible');
    setPlayers(await response.json());
  }, [getToken]);

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, [load]);

  async function update(id: string, patch: Record<string, unknown>) {
    const response = await authenticatedFetch(getToken, `${API}/admin/competitors/${id}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!response.ok) throw new Error('Mise à jour impossible');
    const updated = await response.json();
    setPlayers((current) => current.map((player) => player.id === id ? updated : player));
  }

  if (error) return <main className="mx-auto max-w-5xl p-6 text-red-400"><h1 className="text-3xl font-bold">Administration</h1><p className="mt-4">{error}</p></main>;
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-white">Départs des joueurs</h1>
      <p className="mt-2 text-neutral-400">Une date future ne prendra effet qu’à son échéance.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-700">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-neutral-800 text-sm text-neutral-300"><tr><th className="p-4">Joueur</th><th>Statut</th><th>Personnage</th><th>Date de départ</th><th>Rappel</th><th>Lien de contact</th></tr></thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-t border-neutral-800 align-top">
                <td className="p-4 font-medium">{player.firstName} {player.lastName}</td>
                <td className="py-4"><span className={`rounded-full px-2 py-1 text-xs ${player.status === 'alumni' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'}`}>{player.status === 'alumni' ? 'Ancien' : 'Actif'}</span></td>
                <td className="py-4">
                  {player.characterVariant
                    ? `${player.characterVariant.baseCharacter.name} · ${player.characterVariant.label}`
                    : '—'}
                </td>
                <td className="py-3 pr-4"><input aria-label={`Départ de ${player.firstName}`} type="date" defaultValue={player.leftAt ?? ''} onBlur={(event) => update(player.id, { leftAt: event.target.value || null }).catch((e) => setError(e.message))} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2" />{player.leftAt ? <button className="ml-2 text-sm text-amber-300" onClick={() => update(player.id, { leftAt: null })}>Annuler</button> : null}</td>
                <td className="py-4"><input type="checkbox" aria-label={`Rappel pour ${player.firstName}`} checked={player.keepAnniversaryReminder ?? false} onChange={(event) => update(player.id, { keepAnniversaryReminder: event.target.checked })} /></td>
                <td className="py-3 pr-4"><input type="url" aria-label={`Contact de ${player.firstName}`} placeholder="https://linkedin.com/…" defaultValue={player.contactUrl ?? ''} onBlur={(event) => update(player.id, { contactUrl: event.target.value || null }).catch((e) => setError(e.message))} className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
