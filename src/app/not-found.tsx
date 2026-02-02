import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
      {/* Mushroom Icon */}
      <div className="text-8xl mb-6 animate-bounce">
        🍄
      </div>

      {/* Error Code */}
      <h1 className="text-6xl font-bold text-primary-500 mb-4">
        404
      </h1>

      {/* Message */}
      <h2 className="text-2xl font-bold text-white mb-2">
        Page introuvable
      </h2>
      <p className="text-neutral-400 mb-8 max-w-md">
        Oups ! Cette page semble avoir disparu dans un tuyau vert.
        Retournez au classement pour continuer la course.
      </p>

      {/* Action Button */}
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold rounded-lg transition-colors duration-200"
      >
        <span>🏠</span>
        Retour au classement
      </Link>

      {/* Decorative elements */}
      <div className="mt-12 flex gap-4 text-4xl opacity-50">
        <span>🏎️</span>
        <span>💨</span>
        <span>🏁</span>
      </div>
    </div>
  );
}
