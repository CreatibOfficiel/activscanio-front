'use client';

import { useEffect, useRef, createElement } from 'react';

export function PWAInstallPrompt() {
  const componentLoaded = useRef(false);

  useEffect(() => {
    // Load the web component only on client side
    if (typeof window !== 'undefined' && !componentLoaded.current) {
      import('@khmyznikov/pwa-install').then(() => {
        componentLoaded.current = true;
      });
    }
  }, []);

  // Use createElement to avoid TypeScript errors with custom elements
  return createElement('pwa-install', {
    'manifest-url': '/manifest.json',
    name: 'Activscanio',
    description: 'Application de classement de courses avec système de paris',
    icon: '/icons/icon-512x512.png',
    'install-description': 'Installez Activscanio sur votre appareil pour un accès rapide et une expérience optimale !',
    // Remember if user dismissed the prompt
    'use-local-storage': true,
    // Custom styling with app's primary color (cyan/teal)
    styles: JSON.stringify({
      '--pwa-background': '#1e2d3b',
      '--pwa-color': '#ffffff',
      '--pwa-tint-color': '#40e4e4',
    }),
  });
}
