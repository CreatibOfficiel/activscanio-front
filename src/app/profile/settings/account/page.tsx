'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import SportChoiceCards, {
  SportChoice,
  toSportPreference,
} from '../../../components/sport/SportChoiceCards';
import { useSportPreference } from '../../../hooks/useSportPreference';

const AccountSettingsPage: FC = () => {
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const { showsMarioKart, showsPingpong, saving, change } =
    useSportPreference();
  const [emptyChoice, setEmptyChoice] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  /**
   * Save the new choice, unless it is empty.
   *
   * Onboarding can let someone hold "neither" for as long as they like,
   * because its Continue button stays disabled until the answer is valid.
   * This screen saves on change, so there is no later moment to validate at
   * and the guard has to sit on the write.
   *
   * The refusal is shown rather than swallowed: a box that unticks and then
   * quietly does nothing reads as a save that failed. Because the boxes are
   * driven straight off the hook, not writing also means the box stays
   * ticked, which is what makes the message accurate.
   */
  const handleSportChange = async (next: SportChoice) => {
    const preference = toSportPreference(next);

    if (!preference) {
      setEmptyChoice(true);
      return;
    }

    setEmptyChoice(false);
    await change(preference);
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile/settings"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Retour aux paramètres"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <h1 className="text-heading text-white">Compte</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
        {/* User Profile Card */}
        <button
          onClick={() => openUserProfile()}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750 active:bg-neutral-700 transition-colors text-left min-h-[72px]"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-neutral-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-bold text-white">
              {user?.firstName || user?.username || 'Profil'}
            </h3>
            <p className="text-sub text-neutral-400 truncate">
              {user?.primaryEmailAddress?.emailAddress || 'Modifier votre profil'}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-neutral-500 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>

        {/* Sport preference */}
        <section
          aria-labelledby="sport-preference-heading"
          className="p-4 rounded-xl bg-neutral-800 border border-neutral-700 space-y-3"
        >
          <div>
            <h2
              id="sport-preference-heading"
              className="text-bold text-white"
            >
              Sports suivis
            </h2>
            <p className="text-sub text-neutral-400">
              Choisis ce que tu veux voir dans l&apos;app
            </p>
          </div>

          <SportChoiceCards
            marioKart={showsMarioKart}
            pingpong={showsPingpong}
            onChange={handleSportChange}
            className={saving ? 'opacity-60' : ''}
          />

          {emptyChoice && (
            <p role="alert" className="text-sub text-warning-400">
              Garde au moins un sport : sans ça, il n&apos;y a plus rien à
              afficher.
            </p>
          )}
        </section>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-error-500/50 hover:bg-error-500/5 active:bg-error-500/10 transition-colors min-h-[64px]"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl" aria-hidden="true">
              🚪
            </span>
            <div className="text-left">
              <h3 className="text-bold text-error-400">Se déconnecter</h3>
              <p className="text-sub text-neutral-400">
                Retour à la page d&apos;accueil
              </p>
            </div>
          </div>
        </button>
      </main>
    </div>
  );
};

export default AccountSettingsPage;
