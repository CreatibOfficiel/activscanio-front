import "./globals.css";
import { AppProvider } from "./context/AppProvider";
import BottomNav from "./components/layout/BottomNav";
import { ReactNode } from "react";

export const metadata = {
  title: "Activscanio",
  description: "Activscanio est une application de classement de courses.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
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
}