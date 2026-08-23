import type { RaceEvent } from '@/app/models/RaceEvent';

export function LatestRacesView({ races }: { races: RaceEvent[] }) {
  return <div className="grid h-full content-center gap-5">{races.slice(0, 5).map((race) => { const podium = [...race.results].sort((a, b) => a.rank12 - b.rank12).slice(0, 3); return <article key={race.id} className="grid grid-cols-[240px_1fr] items-center rounded-2xl bg-slate-800/80 px-8 py-5"><time className="text-[30px] text-neutral-400">{new Date(race.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</time><div className="flex gap-12">{podium.map((result, index) => <p key={result.competitorId} className="text-[36px] font-bold"><span className="mr-3">{['🥇', '🥈', '🥉'][index]}</span>{result.competitorFirstName ?? 'Pilote'} <span className="text-primary-300">{result.score} pts</span></p>)}</div></article>; })}</div>;
}
