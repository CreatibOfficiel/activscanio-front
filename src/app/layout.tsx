import "./globals.css";
import "./styles/animations.css";
import { AppProvider } from "./context/AppProvider";
import { SoundboardProvider } from "./context/SoundboardContext";
import { BottomNav, Sidebar } from "./components/layout";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import { PWAUpdateBanner } from "./components/ui/PWAUpdateBanner";
import { PWAInstallPrompt } from "./components/ui/PWAInstallPrompt";
import OfflineIndicator from "./components/ui/OfflineIndicator";
import { SoundboardModal, ShakeDetector } from "./components/soundboard";
import SocketProvider from "./components/layout/SocketProvider";
import { ReactNode } from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "MushroomBet",
  description: "MushroomBet est une application de classement de courses avec système de paris et statistiques en temps réel.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MushroomBet",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1d2a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-neutral-900 text-neutral-100">
        <ClerkProvider>
          <AppProvider>
            <SoundboardProvider>
            <OnboardingGuard>
              {/* Offline Indicator */}
              <OfflineIndicator />

              {/* PWA Update Banner */}
              <PWAUpdateBanner />

              {/* PWA Install Prompt */}
              <PWAInstallPrompt />

              {/* WebSocket real-time notifications */}
              <SocketProvider />

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                theme="dark"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: '#1e2d3b',
                    border: '1px solid #334455',
                    color: '#f1f5f9',
                  },
                }}
              />

              {/* Desktop Sidebar - only when signed in */}
              <SignedIn>
                <Sidebar />
              </SignedIn>

              {/* Main content with responsive margins - when signed in */}
              <SignedIn>
                <main className="pb-20 lg:pb-0 lg:pl-64">
                  {children}
                </main>
              </SignedIn>

              {/* Main content without margins - when signed out (sign-in/sign-up pages) */}
              <SignedOut>
                <main>
                  {children}
                </main>
              </SignedOut>

              {/* Mobile BottomNav - only when signed in */}
              <SignedIn>
                <BottomNav />
              </SignedIn>
            </OnboardingGuard>
            <SoundboardModal />
            <ShakeDetector />
            </SoundboardProvider>
          </AppProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}