import { useQuery } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  sort_order: number;
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function GaleriaPage() {
  const { data: galleries = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["galleries"],
    queryFn: () => apiFetch("/api/galleries"),
  });

  return (
    <SubpageLayout title="Galeria" titleKey="subpage_galeria_title">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="galeria-loading">
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
              className="group overflow-hidden"
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
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4">
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
