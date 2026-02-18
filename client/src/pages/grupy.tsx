import { useQuery } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import { Card } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";

type GroupItem = {
  id: number;
  name: string;
  lead: string;
  when_text: string;
  description: string;
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function GrupyPage() {
  const { data: groups = [], isLoading } = useQuery<GroupItem[]>({
    queryKey: ["groups"],
    queryFn: () => apiFetch("/api/groups"),
  });

  return (
    <SubpageLayout title="Grupy parafialne" titleKey="subpage_grupy_title">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="grupy-loading">
          Ładowanie grup…
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="grupy-empty">
          Brak grup parafialnych.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="grupy-grid">
          {groups.map((g) => (
            <Card
              key={g.id}
              className="flex flex-col gap-3 p-5"
              data-testid={`card-group-${g.id}`}
            >
              <h3
                className="font-display text-xl tracking-[-0.01em]"
                data-testid={`text-group-name-${g.id}`}
              >
                {g.name}
              </h3>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5" data-testid={`text-group-lead-${g.id}`}>
                  <Users className="h-4 w-4" />
                  {g.lead}
                </span>
                <span className="flex items-center gap-1.5" data-testid={`text-group-when-${g.id}`}>
                  <Clock className="h-4 w-4" />
                  {g.when_text}
                </span>
              </div>
              {g.description && (
                <p
                  className="text-sm leading-relaxed text-foreground/80"
                  data-testid={`text-group-desc-${g.id}`}
                >
                  {g.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
