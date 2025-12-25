'use client';

import { useEffect, useRef, createElement } from 'react';

export function PWAInstallPrompt() {
  const componentLoaded = useRef(false);

  useEffect(() => {
    // Charger le web component uniquement côté client
    if (typeof window !== 'undefined' && !componentLoaded.current) {
      import('@khmyznikov/pwa-install').then(() => {
        componentLoaded.current = true;
      });
    }
  }, []);

  // Utiliser createElement pour éviter les erreurs TypeScript avec les custom elements
  return createElement('pwa-install', {
    'manifest-url': '/manifest.json',
    name: 'Activscanio',
    description: 'Application de classement de courses avec système de paris',
    icon: '/icons/icon-512x512.png',
    'install-description': 'Installez Activscanio sur votre appareil pour un accès rapide et une expérience optimale !',
  });
}
