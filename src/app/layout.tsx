import "./globals.css";
import { AppProvider } from "./context/AppProvider";
import BottomNav from "./components/layout/BottomNav";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

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
          {/* Wrapper so that BottomNav doesn't overlap content */}
          <div className="pb-20">{children}</div>

          {/* Persistent bottom navigation */}
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