import { useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { ChevronRight, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SectionGaleria() {
  const { data: galleries = [] } = useQuery<any[]>({
    queryKey: ["galleries"],
    queryFn: () => apiFetch("/api/galleries"),
  });
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const preview = galleries.slice(0, 8);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("POST", "/api/galleries", { title: file.name, image_url: url, sort_order: galleries.length });
      qc.invalidateQueries({ queryKey: ["galleries"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Usunąć to zdjęcie?")) return;
    await apiRequest("DELETE", `/api/galleries/${id}`);
    qc.invalidateQueries({ queryKey: ["galleries"] });
  };

  return (
    <section id="galeria" className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-galeria" aria-label="Galeria">
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
        {preview.map((g: any) => (
          <Link
            key={g.id}
            href="/galeria"
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted"
            data-testid={`tile-gallery-${g.id}`}
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
          </Link>
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
            className="flex items-center gap-1.5 rounded-full border border-dashed border-yellow-400 bg-white/80 px-4 py-2 text-sm text-yellow-600 transition hover:bg-yellow-50"
            disabled={uploading}
            data-testid="button-add-gallery-photo"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Wysyłanie…" : "Dodaj zdjęcie"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      )}

      {(preview.length > 0 || galleries.length > 0) && (
        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded-xl" asChild data-testid="button-more-gallery">
            <Link href="/galeria">
              <EditableStaticText textKey="btn_more_gallery" defaultValue="Więcej zdjęć" />
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
