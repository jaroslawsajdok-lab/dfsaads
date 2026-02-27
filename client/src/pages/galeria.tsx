import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef } from "react";

type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  sort_order: number;
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function GaleriaPage() {
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const { data: galleries = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["galleries"],
    queryFn: () => apiFetch("/api/galleries"),
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/galleries/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["galleries"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: number; title: string; description: string }) => {
      await apiRequest("PUT", `/api/galleries/${id}`, { title, description });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["galleries"] });
      setEditingId(null);
    },
  });

  const handleAddPhoto = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !newTitle.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      await apiRequest("POST", "/api/galleries", {
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        image_url: url,
        sort_order: galleries.length,
      });

      qc.invalidateQueries({ queryKey: ["galleries"] });
      setNewTitle("");
      setNewDesc("");
      setShowAddForm(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      console.error("Failed to add photo:", e);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (g: GalleryItem) => {
    setEditingId(g.id);
    setEditTitle(g.title);
    setEditDesc(g.description || "");
  };

  return (
    <SubpageLayout title="Galeria" titleKey="subpage_galeria_title">
      {isEditMode && (
        <div className="mb-6">
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="gap-2"
              data-testid="button-add-gallery"
            >
              <Plus className="h-4 w-4" />
              Dodaj zdjęcie
            </Button>
          ) : (
            <Card className="p-4 space-y-3" data-testid="form-add-gallery">
              <h3 className="font-semibold text-sm">Dodaj nowe zdjęcie</h3>
              <Input
                placeholder="Tytuł zdjęcia"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-gallery-title"
              />
              <Textarea
                placeholder="Opis (opcjonalny)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="min-h-[60px]"
                data-testid="input-gallery-desc"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                data-testid="input-gallery-file"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddPhoto}
                  disabled={uploading || !newTitle.trim()}
                  size="sm"
                  data-testid="button-save-gallery"
                >
                  {uploading ? "Wgrywanie…" : "Zapisz"}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="ghost"
                  size="sm"
                  data-testid="button-cancel-gallery"
                >
                  Anuluj
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="galeria-loading" role="status">
          Ładowanie galerii…
        </div>
      ) : galleries.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="galeria-empty">
          Brak zdjęć w galerii.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="galeria-grid">
          {galleries.map((g) => (
            <Card
              key={g.id}
              className="group overflow-hidden relative"
              data-testid={`card-gallery-${g.id}`}
            >
              {g.image_url ? (
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={g.image_url}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    data-testid={`img-gallery-${g.id}`}
                  />
                </div>
              ) : (
                <div
                  className="flex aspect-[4/3] w-full items-center justify-center bg-muted"
                  data-testid={`placeholder-gallery-${g.id}`}
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                {editingId === g.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-sm"
                      autoFocus
                      data-testid={`input-edit-title-${g.id}`}
                    />
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="min-h-[40px] text-sm"
                      placeholder="Opis"
                      data-testid={`input-edit-desc-${g.id}`}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateMutation.mutate({ id: g.id, title: editTitle, description: editDesc })}
                        className="rounded p-1 text-green-600 hover:bg-green-50"
                        data-testid={`button-save-edit-${g.id}`}
                        aria-label="Zapisz zmiany"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        data-testid={`button-cancel-edit-${g.id}`}
                        aria-label="Anuluj edycję"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3
                      className="font-display text-lg tracking-[-0.01em]"
                      data-testid={`text-gallery-title-${g.id}`}
                    >
                      {g.title}
                    </h3>
                    {g.description && (
                      <p
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid={`text-gallery-desc-${g.id}`}
                      >
                        {g.description}
                      </p>
                    )}
                  </>
                )}
              </div>
              {isEditMode && editingId !== g.id && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white transition"
                    data-testid={`button-edit-gallery-${g.id}`}
                    aria-label={`Edytuj ${g.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
                        deleteMutation.mutate(g.id);
                      }
                    }}
                    className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-red-50 transition"
                    data-testid={`button-delete-gallery-${g.id}`}
                    aria-label={`Usuń ${g.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
