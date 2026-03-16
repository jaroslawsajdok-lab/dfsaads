import { useRef, useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { ChevronRight, ImagePlus, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function AllGalleryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: galleries = [] } = useQuery<any[]>({
    queryKey: ["galleries"],
    queryFn: () => apiFetch("/api/galleries"),
  });
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    let done = 0;
    setUploadProgress(`0 / ${files.length}`);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        if (!uploadRes.ok) { done++; continue; }
        const { url } = await uploadRes.json();
        await apiRequest("POST", "/api/galleries", {
          title: file.name.replace(/\.[^.]+$/, ""),
          image_url: url,
          sort_order: galleries.length + done,
        });
        done++;
        setUploadProgress(`${done} / ${files.length}`);
      }
      qc.invalidateQueries({ queryKey: ["galleries"] });
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Usunąć to zdjęcie?")) return;
    await apiRequest("DELETE", `/api/galleries/${id}`);
    qc.invalidateQueries({ queryKey: ["galleries"] });
  };

  const handleSaveEdit = async (id: number) => {
    await apiRequest("PUT", `/api/galleries/${id}`, { title: editTitle, description: editDesc });
    qc.invalidateQueries({ queryKey: ["galleries"] });
    setEditingId(null);
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setEditTitle(g.title || "");
    setEditDesc(g.description || "");
  };

  const lightboxImages = galleries.map((g: any) => ({ id: g.id, url: g.image_url, title: g.title || "" }));

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="all-gallery-modal-backdrop"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galeria"
          className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
          data-testid="all-gallery-modal"
        >
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Zamknij"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
            data-testid="all-gallery-modal-close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6">
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-4">Galeria</h2>

            {isEditMode && (
              <div className="mb-4 flex items-center gap-3">
                <Button
                  onClick={() => fileRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                  disabled={uploading}
                  data-testid="button-modal-multi-upload"
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? `Wgrywanie ${uploadProgress}` : "Wgraj zdjęcia"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiUpload} />
              </div>
            )}

            {galleries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Brak zdjęć w galerii.</p>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {galleries.map((g: any, idx: number) => (
                  <div
                    key={g.id}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border bg-muted"
                    onClick={() => { if (!isEditMode) setLightboxIndex(idx); }}
                    data-testid={`modal-gallery-tile-${g.id}`}
                  >
                    <img
                      src={g.image_url}
                      alt={g.title || "Zdjęcie z galerii"}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    {g.title && !isEditMode && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                        <p className="text-xs text-white truncate">{g.title}</p>
                      </div>
                    )}
                    {isEditMode && (
                      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => startEdit(g)}
                          className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white transition dark:bg-card"
                          data-testid={`button-edit-modal-gallery-${g.id}`}
                        >
                          <Pencil className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(g.id)}
                          className="rounded-full bg-red-500/80 p-1 text-white backdrop-blur hover:bg-red-600"
                          data-testid={`button-delete-modal-gallery-${g.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {editingId !== null && (
              <div className="mt-4 rounded-xl border bg-muted/50 p-4 space-y-2" data-testid="form-edit-gallery">
                <h3 className="text-sm font-semibold">Edytuj zdjęcie</h3>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Tytuł" className="text-sm" autoFocus data-testid="input-edit-gallery-title" />
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Opis (opcjonalny)" className="min-h-[60px] text-sm" data-testid="input-edit-gallery-desc" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(editingId)} data-testid="button-save-edit-gallery">
                    <Save className="h-3.5 w-3.5 mr-1" /> Zapisz
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} data-testid="button-cancel-edit-gallery">
                    Anuluj
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}

export function SectionGaleria() {
  const { data: galleries = [] } = useQuery<any[]>({
    queryKey: ["galleries"],
    queryFn: () => apiFetch("/api/galleries"),
  });
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const preview = galleries.slice(0, 8);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadCount(files.length);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        if (!uploadRes.ok) continue;
        const { url } = await uploadRes.json();
        await apiRequest("POST", "/api/galleries", { title: file.name.replace(/\.[^.]+$/, ""), image_url: url, sort_order: galleries.length });
      }
      qc.invalidateQueries({ queryKey: ["galleries"] });
    } finally {
      setUploading(false);
      setUploadCount(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Usunąć to zdjęcie?")) return;
    await apiRequest("DELETE", `/api/galleries/${id}`);
    qc.invalidateQueries({ queryKey: ["galleries"] });
  };

  const lightboxImages = preview.map((g: any) => ({ id: g.id, url: g.image_url, title: g.title || "" }));

  const openLightbox = useCallback((idx: number) => {
    if (!isEditMode) setLightboxIndex(idx);
  }, [isEditMode]);

  return (
    <section id="galeria" className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8" data-testid="section-galeria" aria-label="Galeria">
      <SectionReorderControls sectionId="galeria" />
      <div>
        <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-gallery-title">
          <EditableStaticText textKey="gallery_title" defaultValue="Galeria" />
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-gallery-subtitle">
          <EditableStaticText textKey="gallery_subtitle" defaultValue="Zdjęcia z życia parafii." />
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {preview.map((g: any, idx: number) => (
          <div
            key={g.id}
            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border bg-muted"
            data-testid={`tile-gallery-${g.id}`}
            onClick={() => openLightbox(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") openLightbox(idx); }}
          >
            <img
              src={g.image_url}
              alt={g.title || "Zdjęcie z galerii"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            {isEditMode && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(g.id); }}
                className="absolute top-1.5 right-1.5 rounded-full bg-red-500/80 p-1 text-white backdrop-blur hover:bg-red-600 z-10"
                data-testid={`button-delete-gallery-${g.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {preview.length === 0 && !isEditMode && (
          <div className="col-span-full text-center text-muted-foreground py-8" data-testid="text-gallery-empty">
            Brak zdjęć w galerii.
          </div>
        )}
      </div>

      {isEditMode && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-yellow-400 bg-white/80 px-4 py-2 text-sm text-yellow-600 transition hover:bg-yellow-50 dark:bg-card dark:hover:bg-card/80"
            disabled={uploading}
            data-testid="button-add-gallery-photo"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? `Wysyłanie (${uploadCount})…` : "Dodaj zdjęcia"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      )}

      {galleries.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded-xl" onClick={() => setShowAll(true)} data-testid="button-more-gallery">
            <EditableStaticText textKey="btn_more_gallery" defaultValue="Więcej zdjęć" />
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {showAll && (
        <AllGalleryModal open={true} onClose={() => setShowAll(false)} />
      )}
    </section>
  );
}
