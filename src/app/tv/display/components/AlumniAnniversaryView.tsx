import Image from 'next/image';
import type { AlumniAnniversary } from '../active-views';
import { ContactQrCode } from './ContactQrCode';

export function AlumniAnniversaryView({ items }: { items: AlumniAnniversary[] }) {
  return <div className="flex h-full items-center justify-center"><div className="grid w-full gap-10 lg:grid-cols-2">{items.map((item) => <article key={item.id} className="flex items-center gap-10 rounded-[2rem] border border-primary-400/30 bg-slate-800/80 p-10"><div className="relative h-56 w-56 shrink-0">{item.profilePictureUrl ? <Image src={item.profilePictureUrl} alt={item.firstName} fill className="rounded-full object-cover" /> : <div className="h-full w-full rounded-full bg-primary-500" />}{item.characterImageUrl ? <Image src={item.characterImageUrl} alt="" width={96} height={96} className="absolute -bottom-4 -right-4 h-24 w-24 object-contain" /> : null}</div><div><p className="text-[64px] font-black leading-none text-white">{item.firstName}</p><p className="mt-5 text-[42px] font-bold text-primary-300">parti·e il y a {item.years} an{item.years > 1 ? 's' : ''} 🎉</p><p className="mt-5 text-[32px] text-neutral-200">{item.totalGames} parties au compteur{item.characterName ? ` · fan de ${item.characterName}` : ''}</p>{item.contactUrl ? <ContactQrCode url={item.contactUrl} name={item.firstName} /> : null}</div></article>)}</div></div>;
}
