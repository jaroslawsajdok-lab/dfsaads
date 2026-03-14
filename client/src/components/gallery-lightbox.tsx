import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type LightboxProps = {
  images: { id: number; url: string; title: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function GalleryLightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  const prefersReduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    },
    [currentIndex, images.length, onClose, onNavigate],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setLoaded(false);
  }, [currentIndex]);

  if (!images[currentIndex]) return null;
  const current = images[currentIndex];

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/90 ${prefersReduced ? "" : "animate-in fade-in duration-200"}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      data-testid="gallery-lightbox"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
        aria-label="Zamknij"
        data-testid="button-lightbox-close"
      >
        <X className="h-6 w-6" />
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
          aria-label="Poprzednie zdjęcie"
          data-testid="button-lightbox-prev"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
          aria-label="Następne zdjęcie"
          data-testid="button-lightbox-next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {!loaded && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        <img
          src={current.url}
          alt={current.title}
          className={`max-h-[85vh] max-w-[90vw] rounded-lg object-contain ${loaded ? "block" : "hidden"} ${prefersReduced ? "" : "animate-in zoom-in-95 duration-200"}`}
          onLoad={() => setLoaded(true)}
          data-testid="img-lightbox-current"
        />
        {current.title && loaded && (
          <p className="mt-3 text-center text-sm text-white/80" data-testid="text-lightbox-title">
            {current.title} — {currentIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}
