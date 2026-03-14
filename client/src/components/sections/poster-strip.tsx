import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { cx, apiFetch } from "@/lib/home-helpers";
import { EditableStaticText } from "@/components/admin-tools";
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const isFilename = (t: string) => /\.\w{2,5}$/.test(t.trim());

function PosterLightbox({ poster, index, total, onClose, onPrev, onNext }: {
  poster: any; index: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(poster.description || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(poster.title || "");

  useEffect(() => {
    setDesc(poster.description || "");
    setTitle(poster.title || "");
    setEditingDesc(false);
    setEditingTitle(false);
  }, [poster]);

  const saveField = async (field: string, value: string) => {
    await apiRequest("PUT", `/api/posters/${poster.id}`, { [field]: value });
    qc.invalidateQueries({ queryKey: ["posters"] });
    if (field === "description") setEditingDesc(false);
    if (field === "title") setEditingTitle(false);
  };

  const realTitle = poster.title && !isFilename(poster.title) ? poster.title : "";
  const hasContent = isEditMode || realTitle || poster.description;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="poster-lightbox"
    >
      <button
        className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
        onClick={onClose}
        data-testid="button-close-lightbox"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        data-testid="button-lightbox-prev"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div className="flex flex-col items-center max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={poster.image_url}
          alt={realTitle || "Plakat"}
          className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
          data-testid="img-lightbox-poster"
        />
        {hasContent && (
          <div className="mt-3 w-full max-w-xl rounded-xl bg-card px-5 py-3 text-center shadow-lg">
            {isEditMode ? (
              <div className="space-y-2">
                {editingTitle ? (
                  <div className="flex items-center gap-1 justify-center">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-7 text-sm max-w-xs" autoFocus data-testid="input-poster-title" />
                    <button onClick={() => saveField("title", title)} className="rounded p-1 text-green-600 hover:bg-green-100"><Save className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setTitle(poster.title || ""); setEditingTitle(false); }} className="rounded p-1 text-red-500 hover:bg-red-100"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-foreground cursor-pointer hover:text-blue-600 transition" onClick={() => setEditingTitle(true)} data-testid="poster-lightbox-title">
                    {realTitle || "Kliknij, aby dodać tytuł"}
                    <Pencil className="ml-1 inline h-3 w-3 opacity-60" />
                  </p>
                )}
                {editingDesc ? (
                  <div className="flex items-start gap-1 justify-center">
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[60px] text-sm max-w-sm" autoFocus data-testid="input-poster-desc" />
                    <button onClick={() => saveField("description", desc)} className="rounded p-1 text-green-600 hover:bg-green-100"><Save className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setDesc(poster.description || ""); setEditingDesc(false); }} className="rounded p-1 text-red-500 hover:bg-red-100"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground cursor-pointer hover:text-blue-600 transition whitespace-pre-wrap" onClick={() => setEditingDesc(true)} data-testid="poster-lightbox-desc">
                    {poster.description || "Kliknij, aby dodać opis"}
                    <Pencil className="ml-1 inline h-3 w-3 opacity-60" />
                  </p>
                )}
              </div>
            ) : (
              <>
                {realTitle && <p className="text-sm font-semibold text-foreground" data-testid="poster-lightbox-title">{realTitle}</p>}
                {poster.description && <p className={cx("text-sm text-muted-foreground whitespace-pre-wrap", realTitle ? "mt-1" : "")} data-testid="poster-lightbox-desc">{poster.description}</p>}
              </>
            )}
          </div>
        )}
      </div>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        data-testid="button-lightbox-next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="absolute bottom-4 text-center text-sm text-white/70">
        {index + 1} / {total}
      </div>
    </div>
  );
}

export function PosterBannerStrip() {
  const { data: postersData = [] } = useQuery<any[]>({
    queryKey: ["posters"],
    queryFn: () => apiFetch("/api/posters"),
  });
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const needsCarousel = postersData.length > 3;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !needsCarousel) return;
    let pos = 0;
    const speed = 0.5;
    let raf: number;
    let paused = false;
    const step = () => {
      if (!paused) {
        pos += speed;
        if (pos >= el.scrollWidth / 2) pos = 0;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [postersData, needsCarousel]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("POST", "/api/posters", { title: file.name, image_url: url, sort_order: postersData.length });
      qc.invalidateQueries({ queryKey: ["posters"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Usunąć ten plakat?")) return;
    await apiRequest("DELETE", `/api/posters/${id}`);
    qc.invalidateQueries({ queryKey: ["posters"] });
  };

  if (postersData.length === 0 && !isEditMode) return null;

  const displayPosters = needsCarousel ? [...postersData, ...postersData] : postersData;

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full pb-6 pt-12" data-testid="poster-banner-strip">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
        {postersData.length > 0 && (
          <div
            ref={scrollRef}
            className={cx(
              "relative flex gap-4 px-4",
              needsCarousel ? "overflow-hidden" : "justify-center overflow-visible"
            )}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            data-testid="poster-scroll-container"
          >
            {displayPosters.map((p: any, i: number) => (
              <div
                key={`${p.id}-${i}`}
                className="relative flex-shrink-0 cursor-pointer transition hover:scale-105"
                onClick={() => setLightboxIdx(i % postersData.length)}
                data-testid={`poster-item-${p.id}-${i}`}
              >
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="h-48 w-auto rounded-xl object-cover shadow-lg ring-1 ring-white/20"
                  loading="lazy"
                />
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="absolute top-1 right-1 rounded-full bg-red-500/80 p-1 text-white backdrop-blur hover:bg-red-600"
                    data-testid={`button-delete-poster-${p.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {isEditMode && (
          <div className="relative mx-auto mt-2 flex max-w-6xl items-center justify-center gap-2 px-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-yellow-400 bg-white/80 dark:bg-card/80 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 transition hover:bg-yellow-50 dark:hover:bg-yellow-400/10"
              disabled={uploading}
              data-testid="button-add-poster"
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Wysyłanie…" : "Dodaj plakat"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        )}
      </div>

      {lightboxIdx !== null && postersData.length > 0 && (
        <PosterLightbox
          poster={postersData[lightboxIdx]}
          index={lightboxIdx}
          total={postersData.length}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((lightboxIdx - 1 + postersData.length) % postersData.length)}
          onNext={() => setLightboxIdx((lightboxIdx + 1) % postersData.length)}
        />
      )}
    </>
  );
}
