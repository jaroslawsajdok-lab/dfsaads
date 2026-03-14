import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import type { FaqItem, GroupItem } from "@/lib/home-helpers";
import { EditableStaticText, EditableText, AdminItemActions, AdminAddButton, SectionReorderControls } from "@/components/admin-tools";
import { ChevronRight, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function ONasContentModal({ open, onClose, textKey, titleKey, defaultTitle, defaultDesc, imageSettingKey }: {
  open: boolean; onClose: () => void; textKey: string; titleKey: string; defaultTitle: string; defaultDesc: string; imageSettingKey: string;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: imgSetting } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", imageSettingKey],
    queryFn: () => apiFetch(`/api/admin/settings/${imageSettingKey}`),
  });
  const imageUrl = imgSetting?.value || null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("PUT", `/api/admin/settings/${imageSettingKey}`, { value: url });
      qc.invalidateQueries({ queryKey: ["admin-setting", imageSettingKey] });
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
      data-testid={`onas-modal-backdrop-${textKey}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={defaultTitle}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`onas-modal-${textKey}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
          data-testid={`onas-modal-close-${textKey}`}
        >
          <X className="h-4 w-4" />
        </button>

        {imageUrl && (
          <img src={imageUrl} alt={defaultTitle} className="w-full max-h-[400px] object-cover" />
        )}

        {isEditMode && (
          <div className="px-6 pt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-xs transition hover:bg-black/20"
              disabled={uploading}
              data-testid={`button-upload-onas-image-${textKey}`}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Wysyłanie…" : imageUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        )}

        <div className="p-6">
          <h2 className="font-display text-2xl tracking-[-0.02em]" data-testid={`onas-modal-title-${textKey}`}>
            <EditableStaticText textKey={titleKey} defaultValue={defaultTitle} />
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80" data-testid={`onas-modal-desc-${textKey}`}>
            <EditableStaticText textKey={textKey} defaultValue={defaultDesc} multiline />
          </p>
        </div>
      </div>
    </div>
  );
}

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

function GrupyListModal({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: GroupItem[] }) {
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
        data-testid="grupy-list-modal-backdrop"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Grupy i spotkania"
          className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
          data-testid="grupy-list-modal"
        >
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Zamknij"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
            data-testid="grupy-list-modal-close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6">
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Grupy i spotkania</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map(g => (
                <Card
                  key={g.id}
                  className="rounded-2xl border overflow-hidden cursor-pointer transition hover:shadow-md"
                  onClick={() => setSelectedGroup(g)}
                  data-testid={`grupy-modal-card-${g.id}`}
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

export function SectionONas() {
  const { isEditMode } = useAuth();
  const { data: faqData = [] } = useQuery<FaqItem[]>({ queryKey: ["faq"], queryFn: () => apiFetch("/api/faq") });
  const { data: groupsData = [] } = useQuery<GroupItem[]>({ queryKey: ["groups"], queryFn: () => apiFetch("/api/groups") });
  const [openModal, setOpenModal] = useState<"kim" | "naboz" | "grupy" | null>(null);

  return (
    <section id="onas" className="relative bg-[linear-gradient(180deg,hsl(var(--muted)),transparent)]" data-testid="section-onas" aria-label="O nas">
      <SectionReorderControls sectionId="onas" />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-onas-title">
            <EditableStaticText textKey="onas_title" defaultValue="O nas" />
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-onas-subtitle">
            <EditableStaticText textKey="onas_subtitle" defaultValue="Kim jesteśmy i co nas łączy." multiline />
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card
            className="rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur cursor-pointer transition hover:shadow-md group"
            onClick={() => setOpenModal("kim")}
            data-testid="card-onas-kim"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl"><EditableStaticText textKey="onas_kim_title" defaultValue="Kim jesteśmy" /></h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              Parafia Ewangelicko-Augsburska w Wiśle Jaworniku to wspólnota wiary…
            </p>
          </Card>

          <Card
            className="rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur cursor-pointer transition hover:shadow-md group"
            onClick={() => setOpenModal("naboz")}
            data-testid="card-onas-naboz"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl"><EditableStaticText textKey="onas_naboz_title" defaultValue="Nabożeństwa" /></h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              Nabożeństwa niedzielne o 9:00, tygodniowe wg kalendarza…
            </p>
          </Card>

          <Card
            className="rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur cursor-pointer transition hover:shadow-md group"
            onClick={() => setOpenModal("grupy")}
            data-testid="card-onas-grupy"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl"><EditableStaticText textKey="onas_grupy_title" defaultValue="Grupy i spotkania" /></h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
            <div className="mt-3 space-y-1.5">
              {groupsData.slice(0, 4).map(g => (
                <div key={g.id} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`onas-group-${g.id}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{g.name}</span>
                  <span className="ml-auto text-xs opacity-60">{g.when_text}</span>
                </div>
              ))}
              {groupsData.length > 4 && (
                <span className="text-xs text-primary">+{groupsData.length - 4} więcej…</span>
              )}
            </div>
          </Card>
        </div>

        <ONasContentModal
          open={openModal === "kim"}
          onClose={() => setOpenModal(null)}
          textKey="onas_kim_desc"
          titleKey="onas_kim_title"
          defaultTitle="Kim jesteśmy"
          defaultDesc="Parafia Ewangelicko-Augsburska w Wiśle Jaworniku to wspólnota wiary, otwarta na każdego. Jesteśmy częścią Kościoła Ewangelicko-Augsburskiego w RP."
          imageSettingKey="onas_kim_image"
        />
        <ONasContentModal
          open={openModal === "naboz"}
          onClose={() => setOpenModal(null)}
          textKey="onas_naboz_desc"
          titleKey="onas_naboz_title"
          defaultTitle="Nabożeństwa"
          defaultDesc="Nabożeństwa niedzielne o 9:00\nNabożeństwa tygodniowe wg kalendarza\nSpowiedź i Komunia Święta wg ogłoszeń"
          imageSettingKey="onas_naboz_image"
        />
        <GrupyListModal
          open={openModal === "grupy"}
          onClose={() => setOpenModal(null)}
          groups={groupsData}
        />

        {faqData.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-xl mb-4" data-testid="text-onas-faq-heading">
              <EditableStaticText textKey="onas_faq_heading" defaultValue="Najczęściej zadawane pytania" />
            </h3>
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-onas-faq">
              {faqData.slice(0, 4).map((item, idx) => (
                <AccordionItem key={item.id} value={`i-${item.id}`} data-testid={`onas-faq-item-${idx}`}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1" data-testid={`button-onas-faq-${idx}`}>
                      <EditableText value={item.question} field="question" entityType="faq" entityId={item.id} queryKey="faq" />
                    </AccordionTrigger>
                    <AdminItemActions entityType="faq" entityId={item.id} queryKey="faq" />
                  </div>
                  <AccordionContent data-testid={`text-onas-faq-${idx}`}>
                    <div className="whitespace-pre-wrap">
                      <EditableText value={item.answer} field="answer" entityType="faq" entityId={item.id} queryKey="faq" multiline />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {isEditMode && (
              <div className="mt-3">
                <AdminAddButton
                  entityType="faq"
                  queryKey="faq"
                  defaultValues={{ question: "", answer: "", sort_order: "0" }}
                  fields={[
                    { key: "question", label: "Pytanie" },
                    { key: "answer", label: "Odpowiedź", multiline: true },
                    { key: "sort_order", label: "Kolejność" },
                  ]}
                />
              </div>
            )}
            {faqData.length > 4 && (
              <div className="mt-4 text-center">
                <Button variant="outline" className="rounded-xl" asChild data-testid="button-more-faq">
                  <Link href="/faq">
                    <EditableStaticText textKey="btn_more_faq" defaultValue="Więcej pytań" />
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
