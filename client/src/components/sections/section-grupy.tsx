import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import type { GroupItem } from "@/lib/home-helpers";
import { EditableStaticText, EditableText, AdminAddButton, SectionReorderControls } from "@/components/admin-tools";
import { ChevronRight, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function GroupModal({ group, open, onClose }: { group: GroupItem; open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("PUT", `/api/groups/${group.id}`, { image_url: url });
      qc.invalidateQueries({ queryKey: ["groups"] });
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid={`group-modal-backdrop-${group.id}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={group.name}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`group-modal-${group.id}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
          data-testid={`group-modal-close-${group.id}`}
        >
          <X className="h-4 w-4" />
        </button>

        {group.image_url && (
          <img src={group.image_url} alt={group.name} className="w-full object-cover max-h-[400px]" data-testid={`group-modal-image-${group.id}`} />
        )}

        {isEditMode && (
          <div className="px-6 pt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-xs transition hover:bg-black/20"
              disabled={uploading}
              data-testid={`button-upload-group-image-${group.id}`}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Wysyłanie…" : group.image_url ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid={`input-group-image-${group.id}`} />
          </div>
        )}

        <div className="p-6">
          <div className="font-display text-2xl tracking-[-0.02em]" data-testid={`group-modal-name-${group.id}`}>
            {group.name}
          </div>
          <div className="mt-1 text-sm text-muted-foreground" data-testid={`group-modal-lead-${group.id}`}>
            {group.lead}
          </div>
          <Badge variant="secondary" className="mt-2" data-testid={`group-modal-when-${group.id}`}>
            {group.when_text}
          </Badge>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80" data-testid={`group-modal-desc-${group.id}`}>
            {group.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function AllGroupsModal({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: GroupItem[] }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

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
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="all-groups-modal-backdrop"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wszystkie grupy"
          className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
          data-testid="all-groups-modal"
        >
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Zamknij"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
            data-testid="all-groups-modal-close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6">
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Wszystkie grupy</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map(g => (
                <Card
                  key={g.id}
                  className="rounded-2xl border overflow-hidden cursor-pointer transition hover:shadow-md"
                  onClick={() => setSelectedGroup(g)}
                  data-testid={`all-groups-card-${g.id}`}
                >
                  {g.image_url && (
                    <img src={g.image_url} alt={g.name} className="w-full h-36 object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <div className="font-display text-lg">{g.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{g.lead}</div>
                    <Badge variant="secondary" className="mt-2">{g.when_text}</Badge>
                    {g.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{g.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      {selectedGroup && (
        <GroupModal group={selectedGroup} open={true} onClose={() => setSelectedGroup(null)} />
      )}
    </>
  );
}

export function SectionGrupy() {
  const { isEditMode } = useAuth();
  const { data: groupsData = [] } = useQuery<GroupItem[]>({ queryKey: ["groups"], queryFn: () => apiFetch("/api/groups") });
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [showAll, setShowAll] = useState(false);

  return (
    <section id="grupy" className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8" data-testid="section-grupy" aria-label="Grupy parafialne">
      <SectionReorderControls sectionId="grupy" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-groups-title">
            <EditableStaticText textKey="groups_title" defaultValue="Grupy w parafii" />
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-groups-subtitle">
            <EditableStaticText textKey="groups_subtitle" defaultValue="Dołącz do wspólnoty — znajdź przestrzeń dla siebie." />
          </p>
        </div>
        {isEditMode && (
          <AdminAddButton
            entityType="groups"
            queryKey="groups"
            defaultValues={{ name: "", lead: "", when_text: "", description: "" }}
            fields={[
              { key: "name", label: "Nazwa grupy" },
              { key: "lead", label: "Prowadzący" },
              { key: "when_text", label: "Kiedy" },
              { key: "description", label: "Opis", multiline: true },
            ]}
          />
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {groupsData.slice(0, 3).map((g) => (
          <Card
            key={g.id}
            className="rounded-2xl border bg-white/80 dark:bg-card/80 p-5 shadow-[0_1px_0_hsl(220_20%_88%/.7)] backdrop-blur cursor-pointer transition hover:bg-white/95 dark:hover:bg-card/95 hover:shadow-md"
            onClick={() => setSelectedGroup(g)}
            data-testid={`card-group-${g.id}`}
          >
            {g.image_url && (
              <img src={g.image_url} alt={g.name} className="mb-3 h-32 w-full rounded-xl object-cover" data-testid={`img-group-${g.id}`} />
            )}
            <div className="flex items-center justify-between">
              <div className="font-display text-lg" data-testid={`text-group-name-${g.id}`}>
                <EditableText value={g.name} field="name" entityType="groups" entityId={g.id} queryKey="groups" />
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-group-lead-${g.id}`}>
              <EditableText value={g.lead} field="lead" entityType="groups" entityId={g.id} queryKey="groups" />
            </div>
            <Badge variant="secondary" className="mt-2" data-testid={`badge-group-when-${g.id}`}>
              <EditableText value={g.when_text} field="when_text" entityType="groups" entityId={g.id} queryKey="groups" />
            </Badge>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-group-desc-${g.id}`}>
              <EditableText value={g.description} field="description" entityType="groups" entityId={g.id} queryKey="groups" multiline />
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary" data-testid={`button-group-details-${g.id}`}>
              Zobacz więcej
              <ChevronRight className="h-4 w-4" />
            </span>
          </Card>
        ))}
      </div>
      {selectedGroup && (
        <GroupModal group={selectedGroup} open={true} onClose={() => setSelectedGroup(null)} />
      )}

      {groupsData.length > 3 && (
        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded-xl" onClick={() => setShowAll(true)} data-testid="button-more-groups">
            <EditableStaticText textKey="btn_more_groups" defaultValue="Więcej grup" />
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {showAll && (
        <AllGroupsModal open={true} onClose={() => setShowAll(false)} groups={groupsData} />
      )}
    </section>
  );
}
