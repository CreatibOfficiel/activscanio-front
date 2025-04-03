import { Suspense } from "react";

export default function ScoreSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="text-neutral-100 text-regular">Chargement...</div>
      }
    >
      {children}
    </Suspense>
  );
}
