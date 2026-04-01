import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { BookOpen, ChevronRight, Heart, ImagePlus, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SiteTexts } from "@/lib/home-helpers";
import type { ReactNode } from "react";

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function renderWithLinks(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m && isSafeUrl(m[2])) {
      return (
        <a
          key={idx}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-75 transition"
        >
          {m[1]}
        </a>
      );
    }
    return part;
  });
}

function parseDomImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === "string");
    return [];
  } catch {
    return [];
  }
}

function DomCardModal({ open, onClose, titleKey, defaultTitle, descKey, defaultDesc, imagesKey }: {
  open: boolean; onClose: () => void;
  titleKey: string; defaultTitle: string;
  descKey: string; defaultDesc: string;
  imagesKey: string;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: imagesData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", imagesKey],
    queryFn: () => apiFetch(`/api/admin/settings/${imagesKey}`),
    enabled: open,
  });
  const images = parseDomImages(imagesData?.value ?? null);

  const saveImages = async (newImages: string[]) => {
    await apiRequest("PUT", `/api/admin/settings/${imagesKey}`, { value: JSON.stringify(newImages) });
    qc.invalidateQueries({ queryKey: ["admin-setting", imagesKey] });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await saveImages([...images, url]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = async (url: string) => {
    await saveImages(images.filter((u) => u !== url));
  };

  const { data: siteTexts = {} } = useQuery<SiteTexts>({
    queryKey: ["site-texts"],
    queryFn: () => apiFetch("/api/site-texts"),
    enabled: open,
  });
  const descText = siteTexts[descKey] || defaultDesc;

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
      data-testid={`dom-card-modal-backdrop-${descKey}`}
    >
      <div className="flex min-h-full items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={defaultTitle}
        className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`dom-card-modal-${descKey}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
          data-testid={`dom-card-modal-close-${descKey}`}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h2 className="font-display text-2xl tracking-[-0.02em]" data-testid={`dom-card-modal-title-${descKey}`}>
            <EditableStaticText textKey={titleKey} defaultValue={defaultTitle} />
          </h2>

          <div className="mt-4 text-base leading-relaxed text-foreground/80 break-words [overflow-wrap:anywhere]" data-testid={`dom-card-modal-desc-${descKey}`}>
            {isEditMode ? (
              <EditableStaticText textKey={descKey} defaultValue={defaultDesc} multiline />
            ) : (
              <div className="whitespace-pre-wrap">
                {renderWithLinks(descText)}
              </div>
            )}
          </div>

          {(images.length > 0 || isEditMode) && (
            <div className="mt-6" data-testid={`dom-card-modal-images-${descKey}`}>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((url, idx) => (
                    <div key={url} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={url}
                        alt={`Zdjęcie ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        data-testid={`dom-card-image-${descKey}-${idx}`}
                      />
                      {isEditMode && (
                        <button
                          onClick={() => handleRemoveImage(url)}
                          className="absolute right-1 top-1 rounded-full bg-red-500/80 p-1 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                          aria-label="Usuń zdjęcie"
                          data-testid={`button-remove-dom-image-${descKey}-${idx}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditMode && (
                <div className="mt-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    data-testid={`input-dom-upload-${descKey}`}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/5 transition"
                    data-testid={`button-dom-upload-${descKey}`}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {uploading ? "Wysyłanie…" : "Dodaj zdjęcie"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

const CARDS = [
  {
    id: "pokoje",
    titleKey: "dom_pokoje_title",
    defaultTitle: "Pokoje gościnne",
    descKey: "dom_pokoje_desc",
    defaultDesc: "Komfortowe pokoje w otoczeniu gór. Idealne na wypoczynek i rekolekcje.",
    imagesKey: "dom_pokoje_images",
    icon: MapPin,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    testId: "card-dom-pokoje",
  },
  {
    id: "kuchnia",
    titleKey: "dom_kuchnia_title",
    defaultTitle: "Kuchnia parafialna",
    descKey: "dom_kuchnia_desc",
    defaultDesc: "Ciasteczka świąteczne, catering na wydarzenia. Zamówienia w kancelarii.",
    imagesKey: "dom_kuchnia_images",
    icon: Heart,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    testId: "card-dom-kuchnia",
  },
  {
    id: "wspomnienia",
    titleKey: "dom_wspomnienia_title",
    defaultTitle: "Wspomnienia",
    descKey: "dom_wspomnienia_desc",
    defaultDesc: "Gości i odwiedzających zapraszamy do dzielenia się wspomnieniami z pobytów.",
    imagesKey: "dom_wspomnienia_images",
    icon: BookOpen,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    testId: "card-dom-wspomnienia",
  },
];

export function SectionDomGoscinny() {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const { data: siteTexts = {} } = useQuery<SiteTexts>({ queryKey: ["site-texts"], queryFn: () => apiFetch("/api/site-texts") });

  return (
    <section id="dom" className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8" data-testid="section-dom" aria-label="Dom gościnny">
      <SectionReorderControls sectionId="dom" />
      <div>
        <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-dom-title">
          <EditableStaticText textKey="guesthouse_title" defaultValue="Dom Gościnny" />
        </h2>
        <div className="mt-2 max-w-2xl text-muted-foreground break-words [overflow-wrap:anywhere]" data-testid="text-dom-subtitle">
          <EditableStaticText textKey="guesthouse_subtitle" defaultValue="Ośrodek wypoczynkowy i miejsce spotkań w sercu Wisły Jawornika." multiline />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const descText = siteTexts[card.descKey] || card.defaultDesc;
          return (
            <Card
              key={card.id}
              className="min-w-0 rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
              onClick={() => setOpenCard(card.id)}
              data-testid={card.testId}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} mb-4`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <h3 className="font-display text-lg break-words [overflow-wrap:anywhere]">
                {siteTexts[card.titleKey] || card.defaultTitle}
              </h3>
              <div className="mt-2 text-sm text-muted-foreground break-words [overflow-wrap:anywhere] line-clamp-[7]">
                {descText}
              </div>
              {descText.length > 150 && (
                <span className="mt-2 inline-block text-xs font-medium text-primary">Czytaj więcej →</span>
              )}
            </Card>
          );
        })}
      </div>

      {CARDS.map((card) => (
        <DomCardModal
          key={card.id}
          open={openCard === card.id}
          onClose={() => setOpenCard(null)}
          titleKey={card.titleKey}
          defaultTitle={card.defaultTitle}
          descKey={card.descKey}
          defaultDesc={card.defaultDesc}
          imagesKey={card.imagesKey}
        />
      ))}

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
