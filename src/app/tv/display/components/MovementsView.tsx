import type { Competitor } from '@/app/models/Competitor';

export function MovementsView({ players }: { players: Competitor[] }) {
  const ranked = [...players].filter((player) => player.previousDayRank != null).sort((a, b) => (b.conservativeScore ?? 0) - (a.conservativeScore ?? 0)).map((player, index) => ({ player, movement: player.previousDayRank! - (index + 1) })).filter(({ movement }) => movement !== 0).sort((a, b) => Math.abs(b.movement) - Math.abs(a.movement)).slice(0, 8);
  return <div className="grid h-full grid-cols-2 content-center gap-6">{ranked.map(({ player, movement }) => <article key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-800/80 p-8"><p className="text-[40px] font-bold">{player.firstName} {player.lastName.slice(0, 1)}.</p><p className={`text-[48px] font-black ${movement > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{movement > 0 ? '↗' : '↘'} {Math.abs(movement)}</p></article>)}</div>;
}
