import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { BookOpen, ChevronRight, Heart, ImagePlus, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function RemontModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: imgData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "remont_image"],
    queryFn: () => apiFetch("/api/admin/settings/remont_image"),
  });
  const remontImage = imgData?.value || null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("PUT", "/api/admin/settings/remont_image", { value: url });
      qc.invalidateQueries({ queryKey: ["admin-setting", "remont_image"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="remont-modal-backdrop"
    >
      <div className="flex min-h-full items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Remont Domu Gościnnego"
        className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="remont-modal"
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
          data-testid="remont-modal-close"
        >
          <X className="h-4 w-4" />
        </button>

        {remontImage && (
          <img src={remontImage} alt="Remont Domu Gościnnego" className="w-full object-cover max-h-[400px]" data-testid="remont-modal-image" />
        )}

        {isEditMode && (
          <div className="px-6 pt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-xs transition hover:bg-black/20"
              disabled={uploading}
              data-testid="button-upload-remont-image"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Wysyłanie…" : remontImage ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="input-remont-image" />
          </div>
        )}

        <div className="p-6">
          <div className="font-display text-2xl tracking-[-0.02em]" data-testid="remont-modal-title">
            <EditableStaticText textKey="afterband_cta_title" defaultValue="Remont Domu Gościnnego" />
          </div>
          <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80" data-testid="remont-modal-desc">
            <EditableStaticText textKey="remont_description" defaultValue="Tutaj pojawi się opis remontu Domu Gościnnego. Admin może edytować ten tekst w trybie edycji." multiline />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export function SectionDomGoscinny() {
  return (
    <section id="dom" className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8" data-testid="section-dom" aria-label="Dom gościnny">
      <SectionReorderControls sectionId="dom" />
      <div>
        <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-dom-title">
          <EditableStaticText textKey="guesthouse_title" defaultValue="Dom Gościnny" />
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-dom-subtitle">
          <EditableStaticText textKey="guesthouse_subtitle" defaultValue="Ośrodek wypoczynkowy i miejsce spotkań w sercu Wisły Jawornika." multiline />
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="min-w-0 rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur" data-testid="card-dom-pokoje">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-4">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-display text-lg break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_pokoje_title" defaultValue="Pokoje gościnne" />
          </h3>
          <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_pokoje_desc" defaultValue="Komfortowe pokoje w otoczeniu gór. Idealne na wypoczynek i rekolekcje." multiline />
          </div>
        </Card>

        <Card className="min-w-0 rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur" data-testid="card-dom-kuchnia">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 mb-4">
            <Heart className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="font-display text-lg break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_kuchnia_title" defaultValue="Kuchnia parafialna" />
          </h3>
          <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_kuchnia_desc" defaultValue="Ciasteczka świąteczne, catering na wydarzenia. Zamówienia w kancelarii." multiline />
          </div>
        </Card>

        <Card className="min-w-0 rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur" data-testid="card-dom-wspomnienia">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 mb-4">
            <BookOpen className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-display text-lg break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_wspomnienia_title" defaultValue="Wspomnienia" />
          </h3>
          <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            <EditableStaticText textKey="dom_wspomnienia_desc" defaultValue="Gości i odwiedzających zapraszamy do dzielenia się wspomnieniami z pobytów." multiline />
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button
          size="lg"
          className="rounded-2xl"
          onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
          data-testid="button-guesthouse-open"
        >
          Przejdź do strony ośrodka
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
        <div className="text-xs text-muted-foreground">osrodek.jawornik.eu</div>
      </div>
    </section>
  );
}
