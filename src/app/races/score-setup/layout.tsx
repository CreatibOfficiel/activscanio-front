import { Suspense } from "react";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-neutral-700 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}

export default function ScoreSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}
