import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Alumni { id: string; firstName: string; lastName: string; profilePictureUrl: string; leftAt: string; totalGames: number; totalWins: number; characterName: string | null; }

export default async function AlumniPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alumni/hall-of-fame`, { next: { revalidate: 60 } });
  const alumni: Alumni[] = response.ok ? await response.json() : [];
  return <main className="mx-auto max-w-6xl p-4 sm:p-8"><h1 className="text-4xl font-bold">Anciens · Hall of Fame</h1><p className="mt-2 text-neutral-400">Leurs parties et leurs exploits restent dans l’histoire.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{alumni.map((player) => <article key={player.id} className="rounded-2xl border border-neutral-700 bg-neutral-800 p-5"><div className="flex items-center gap-4">{player.profilePictureUrl ? <Image src={player.profilePictureUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" /> : null}<div><h2 className="text-xl font-semibold">{player.firstName} {player.lastName}</h2><p className="text-sm text-neutral-400">Parti·e le {new Date(`${player.leftAt}T12:00:00`).toLocaleDateString('fr-FR')}</p></div></div><dl className="mt-5 grid grid-cols-2 gap-3"><div><dt className="text-xs text-neutral-500">Parties</dt><dd className="text-2xl font-bold">{player.totalGames}</dd></div><div><dt className="text-xs text-neutral-500">Victoires</dt><dd className="text-2xl font-bold">{player.totalWins}</dd></div></dl>{player.characterName ? <p className="mt-4 text-sm text-neutral-300">Personnage fétiche : {player.characterName}</p> : null}</article>)}</div></main>;
}
