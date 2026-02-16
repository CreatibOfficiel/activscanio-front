'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import FAQSection from '../../components/help/FAQSection';
import faqSections from '../../components/help/FAQData';

/**
 * Help/FAQ Page
 *
 * Central help page explaining how Mushroom Bet works.
 * Accessible from settings.
 */
const HelpPage: FC = () => {
  // Track which section is open (only one at a time)
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const handleToggleSection = (sectionId: string) => {
    setOpenSectionId((current) => (current === sectionId ? null : sectionId));
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
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
          <h1 className="text-heading text-white">Centre d&apos;aide</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Intro card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                Bienvenue dans le centre d&apos;aide !
              </h2>
              <p className="text-neutral-300 text-sm">
                Retrouvez ici toutes les explications sur le fonctionnement de
                Mushroom Bet. Tapez sur une section pour en savoir plus.
              </p>
            </div>
          </div>
        </div>

        {/* Quick tips */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-2xl mb-2">💡</div>
            <p className="text-sm text-neutral-300">
              Pariez <span className="text-primary-400 font-semibold">le lundi</span> avant
              minuit pour participer !
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-sm text-neutral-300">
              Votre <span className="text-warning-500 font-semibold">boost x2</span> se
              réinitialise le 1er de chaque mois
            </p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-3">
          {faqSections.map((section) => (
            <FAQSection
              key={section.id}
              section={section}
              isOpen={openSectionId === section.id}
              onToggle={() => handleToggleSection(section.id)}
            />
          ))}
        </div>

        {/* Contact/feedback section */}
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 text-center">
          <p className="text-neutral-400 text-sm mb-3">
            Une question ? Une suggestion ?
          </p>
          <a
            href="mailto:thibaud@auguste.io"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors"
          >
            <span>📬</span>
            <span>Nous contacter</span>
          </a>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
