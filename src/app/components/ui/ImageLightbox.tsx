"use client";

import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImageLightbox: FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-neutral-800/80 text-neutral-100 hover:bg-neutral-700 transition-colors top-[calc(1rem+env(safe-area-inset-top))]"
      >
        <MdClose size={22} />
      </button>
    </div>,
    document.body,
  );
};

export default ImageLightbox;
