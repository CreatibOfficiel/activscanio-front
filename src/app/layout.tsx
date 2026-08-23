import "./globals.css";
import "./styles/animations.css";
import { AppProvider } from "./context/AppProvider";
import { QueryProvider } from "./query/QueryProvider";
import { SoundboardProvider } from "./context/SoundboardContext";
import { ResultModalsProvider } from "./context/ResultModalsContext";
import { AddActivitySlotProvider } from "./context/AddActivitySlotContext";
import { BottomNav, Sidebar } from "./components/layout";
import MainContent from "./components/layout/MainContent";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import { OnboardingProvider } from "./context/OnboardingContext";

import { PWAInstallPrompt } from "./components/ui/PWAInstallPrompt";
import OfflineIndicator from "./components/ui/OfflineIndicator";
import { SoundboardModal, ShakeDetector } from "./components/soundboard";
import SocketProvider from "./components/layout/SocketProvider";
import SeasonRecapAutoShow from "./components/layout/SeasonRecapAutoShow";
import StreakLostModalRenderer from "./components/achievements/StreakLostModalRenderer";
import StreakLossInitializer from "./components/layout/StreakLossInitializer";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthLayout, PublicLayout } from "./components/layout/AuthLayoutSwitch";
import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";
import AlumniReminderBanner from "./components/alumni/AlumniReminderBanner";

export const metadata: Metadata = {
  title: "MushroomBet",
  description: "MushroomBet est une application de classement de courses avec classements Mario Kart",
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
  viewportFit: "cover",
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
          {/* Outside AppProvider: AppProvider now sources its competitors
              from a React Query cache, so the client must already exist. */}
          <QueryProvider>
          <AppProvider>
            <SoundboardProvider>
            <ResultModalsProvider>
            <OnboardingProvider>
            {/* Wraps both the pages and the bottom nav: a board fills the
                bar's centre add slot from inside its own tree, and the nav is
                what offers that slot. Both ends need the same provider. */}
            <AddActivitySlotProvider>
            <OnboardingGuard>
              {/* Offline Indicator */}
              <OfflineIndicator />
              <AlumniReminderBanner />

              {/* PWA Install Prompt */}
              <PWAInstallPrompt />

              {/* WebSocket real-time notifications */}
              <SocketProvider />

              {/* Season recap auto-show (Wrapped-style modal) */}
              <SeasonRecapAutoShow />

              {/* Result modals (bet results + streak losses) */}
              <StreakLostModalRenderer />
              <StreakLossInitializer />

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

              {/* Desktop Sidebar - hidden on auth pages */}
              <AuthLayout>
                <Sidebar />
              </AuthLayout>

              {/* Main content with responsive margins - authenticated pages */}
              <AuthLayout>
                <MainContent>
                  {children}
                </MainContent>
              </AuthLayout>

              {/* Main content without margins - sign-in/sign-up pages */}
              <PublicLayout>
                <main>
                  {children}
                </main>
              </PublicLayout>

              {/* Mobile BottomNav - hidden on auth pages */}
              <AuthLayout>
                <BottomNav />
              </AuthLayout>
            </OnboardingGuard>
            </AddActivitySlotProvider>
            </OnboardingProvider>
            </ResultModalsProvider>
            <SoundboardModal />
            <ShakeDetector />
            </SoundboardProvider>
          </AppProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
