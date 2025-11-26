import "./globals.css";
import { AppProvider } from "./context/AppProvider";
import { BottomNav, Sidebar } from "./components/layout";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export const metadata = {
  title: "Activscanio",
  description: "Activscanio est une application de classement de courses.",
};

// Check if Clerk keys are properly configured (not placeholders)
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = clerkPublishableKey &&
  clerkPublishableKey.startsWith('pk_') &&
  !clerkPublishableKey.includes('placeholder');

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const content = (
    <html lang="en">
      <body className="bg-neutral-900 text-neutral-100">
        <AppProvider>
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

          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main content with responsive margins */}
          <main className="pb-20 lg:pb-0 lg:pl-64">
            {children}
          </main>

          {/* Mobile BottomNav (hidden on desktop) */}
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if properly configured
  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}