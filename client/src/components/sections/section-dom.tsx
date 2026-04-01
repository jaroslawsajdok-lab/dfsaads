import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { BookOpen, ChevronRight, Heart, ImagePlus, MapPin, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SiteTexts } from "@/lib/home-helpers";

type RemontBlock = { type: "text"; content: string } | { type: "image"; url: string };

const DEFAULT_REMONT_BLOCKS: RemontBlock[] = [
  { type: "text", content: "Tutaj pojawi się opis remontu Domu Gościnnego. Admin może edytować ten tekst w trybie edycji." }
];

function parseRemontBlocks(raw: string | null): RemontBlock[] {
  if (!raw) return DEFAULT_REMONT_BLOCKS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_REMONT_BLOCKS;
  } catch {
    // Legacy: treat as plain text
    if (raw.trim()) return [{ type: "text", content: raw }];
    return DEFAULT_REMONT_BLOCKS;
  }
}

function RemontModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: blocksData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "remont_content"],
    queryFn: () => apiFetch("/api/admin/settings/remont_content"),
  });
  const blocks = parseRemontBlocks(blocksData?.value ?? null);

  const saveBlocks = async (newBlocks: RemontBlock[]) => {
    await apiRequest("PUT", "/api/admin/settings/remont_content", { value: JSON.stringify(newBlocks) });
    qc.invalidateQueries({ queryKey: ["admin-setting", "remont_content"] });
  };

  const handleInsertImage = async (afterIdx: number, file: File) => {
    setUploadingIdx(afterIdx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      const newBlocks = [...blocks];
      newBlocks.splice(afterIdx + 1, 0, { type: "image", url });
      await saveBlocks(newBlocks);
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRemoveBlock = async (idx: number) => {
    const newBlocks = blocks.filter((_, i) => i !== idx);
    await saveBlocks(newBlocks.length > 0 ? newBlocks : DEFAULT_REMONT_BLOCKS);
  };

  const handleTextBlur = async (idx: number, newContent: string) => {
    const current = blocks[idx];
    if (current?.type === "text" && current.content === newContent) return;
    const newBlocks = blocks.map((b, i) => i === idx ? { ...b, content: newContent } as RemontBlock : b);
    await saveBlocks(newBlocks);
  };

  const handleAddTextBlock = async (afterIdx: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(afterIdx + 1, 0, { type: "text", content: "" });
    await saveBlocks(newBlocks);
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

        <div className="p-6">
          <div className="font-display text-2xl tracking-[-0.02em] mb-5" data-testid="remont-modal-title">
            <EditableStaticText textKey="afterband_cta_title" defaultValue="Remont Domu Gościnnego" />
          </div>

          <div className="space-y-4" data-testid="remont-modal-blocks">
            {blocks.map((block, idx) => (
              <div key={idx}>
                {block.type === "text" ? (
                  <div className="relative group">
                    {isEditMode ? (
                      <div className="relative">
                        <textarea
                          className="w-full min-h-[80px] text-base leading-relaxed text-foreground/80 bg-transparent border border-dashed border-muted-foreground/30 rounded-lg p-2 focus:outline-none focus:border-primary resize-none break-words"
                          defaultValue={block.content}
                          onBlur={(e) => handleTextBlur(idx, e.target.value)}
                          placeholder="Wpisz tekst…"
                          data-testid={`remont-block-text-${idx}`}
                        />
                        {blocks.length > 1 && (
                          <button
                            onClick={() => handleRemoveBlock(idx)}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                            aria-label="Usuń blok"
                            data-testid={`button-remove-block-${idx}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80 break-words [overflow-wrap:anywhere]" data-testid={`remont-block-text-${idx}`}>
                        {block.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={block.url}
                      alt="Zdjęcie remontu"
                      className="w-full rounded-xl object-cover max-h-[400px]"
                      data-testid={`remont-block-image-${idx}`}
                    />
                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveBlock(idx)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                        aria-label="Usuń zdjęcie"
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {isEditMode && (
                  <div className="flex justify-center gap-2 py-1.5" data-testid={`remont-insert-row-${idx}`}>
                    <input
                      ref={(el) => { fileRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleInsertImage(idx, file);
                        e.target.value = "";
                      }}
                      data-testid={`input-insert-image-${idx}`}
                    />
                    <button
                      onClick={() => fileRefs.current[idx]?.click()}
                      disabled={uploadingIdx !== null}
                      className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition"
                      data-testid={`button-insert-image-${idx}`}
                    >
                      <ImagePlus className="h-3 w-3" />
                      {uploadingIdx === idx ? "Wysyłanie…" : "Dodaj zdjęcie"}
                    </button>
                    <button
                      onClick={() => handleAddTextBlock(idx)}
                      className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition"
                      data-testid={`button-add-text-${idx}`}
                    >
                      + Akapit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function DomCardModal({ open, onClose, titleKey, defaultTitle, descKey, defaultDesc }: {
  open: boolean; onClose: () => void;
  titleKey: string; defaultTitle: string;
  descKey: string; defaultDesc: string;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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
          <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80 break-words [overflow-wrap:anywhere]" data-testid={`dom-card-modal-desc-${descKey}`}>
            <EditableStaticText textKey={descKey} defaultValue={defaultDesc} multiline />
          </div>
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
    icon: BookOpen,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    testId: "card-dom-wspomnienia",
  },
];

export function SectionDomGoscinny() {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [remontOpen, setRemontOpen] = useState(false);
  const { data: siteTexts = {} } = useQuery<SiteTexts>({ queryKey: ["site-texts"], queryFn: () => apiFetch("/api/site-texts") });

  const remontTitle = siteTexts["afterband_cta_title"] || "Remont Domu Gościnnego";
  const remontSubtitle = siteTexts["afterband_cta_subtitle"] || "Trwają prace remontowe. Kliknij, by dowiedzieć się więcej.";

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

      <Card
        id="remont"
        className="mt-4 min-w-0 rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 p-6 backdrop-blur cursor-pointer transition hover:shadow-lg hover:scale-[1.01]"
        onClick={() => setRemontOpen(true)}
        data-testid="card-dom-remont"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
            <ChevronRight className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg break-words [overflow-wrap:anywhere] text-amber-800 dark:text-amber-300">{remontTitle}</h3>
            <div className="mt-1 text-sm text-amber-700/70 dark:text-amber-400/70 break-words [overflow-wrap:anywhere] line-clamp-2">{remontSubtitle}</div>
          </div>
        </div>
      </Card>

      <RemontModal open={remontOpen} onClose={() => setRemontOpen(false)} />

      {CARDS.map((card) => (
        <DomCardModal
          key={card.id}
          open={openCard === card.id}
          onClose={() => setOpenCard(null)}
          titleKey={card.titleKey}
          defaultTitle={card.defaultTitle}
          descKey={card.descKey}
          defaultDesc={card.defaultDesc}
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
