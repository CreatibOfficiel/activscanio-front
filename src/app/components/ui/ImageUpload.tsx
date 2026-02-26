'use client';

import { FC, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { MdEdit } from 'react-icons/md';

interface ImageUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<string>;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ImageUpload: FC<ImageUploadProps> = ({
  currentImageUrl,
  onUpload,
  label,
  error,
  required = false,
  className = '',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || currentImageUrl;
  const displayError = localError || error;

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    setLocalError(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Format accepté : JPEG, PNG ou WebP');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError('La taille maximale est de 10 Mo');
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);

    // Upload
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setLocalError("Erreur lors de l'upload");
      // Revert preview on error
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-neutral-300 text-bold mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="relative w-24 h-24 group focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative w-full h-full rounded-full overflow-hidden ring-2 ring-neutral-700 group-hover:ring-primary-500/50 transition-all">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Photo de profil"
                fill
                className="object-cover"
                onError={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <span className="text-3xl text-neutral-500">👤</span>
              </div>
            )}

            {/* Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Edit badge — outside overflow-hidden */}
          {!uploading && (
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/90 border border-white/20 group-hover:bg-black/70 transition-colors">
              <MdEdit className="text-base" />
            </div>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {displayError && (
        <p className="text-error-500 text-xs mt-2 text-center" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
