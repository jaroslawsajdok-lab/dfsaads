import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Facebook, Youtube, MapPin, Phone, Mail, ArrowUp, Pencil, Save, X } from "lucide-react";
import { EditableStaticText } from "@/components/admin-tools";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch, scrollToId } from "@/lib/home-helpers";
import { Input } from "@/components/ui/input";

type ContactMap = Record<string, string>;

function EditableContactValue({ contactKey, icon, fallback }: { contactKey: string; icon: React.ReactNode; fallback: string }) {
  const { isEditMode } = useAuth();
  const { data: contactData = {} } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });
  const value = contactData[contactKey] || "";
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const qc = useQueryClient();

  useEffect(() => { setText(value); }, [value]);

  const mutation = useMutation({
    mutationFn: async (newVal: string) => {
      await apiRequest("PUT", `/api/contact/${contactKey}`, { value: newVal });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact"] });
      setEditing(false);
    },
  });

  if (!value && !isEditMode) return null;

  if (isEditMode && editing) {
    return (
      <li className="flex items-start gap-2" data-testid={`footer-edit-${contactKey}`}>
        {icon}
        <span className="inline-flex items-center gap-1 flex-1 min-w-0">
          <Input value={text} onChange={(e) => setText(e.target.value)} className="h-6 text-xs flex-1" autoFocus data-testid={`input-footer-${contactKey}`} />
          <button type="button" onClick={() => mutation.mutate(text)} className="rounded p-0.5 text-green-600 hover:bg-green-50" data-testid={`button-save-footer-${contactKey}`}>
            <Save className="h-3 w-3" />
          </button>
          <button type="button" onClick={() => { setText(value); setEditing(false); }} className="rounded p-0.5 text-red-500 hover:bg-red-50" data-testid={`button-cancel-footer-${contactKey}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2" data-testid={`footer-${contactKey}`}>
      {icon}
      {isEditMode ? (
        <span
          className="group/edit cursor-pointer border-b border-dashed border-transparent hover:border-yellow-400"
          onClick={() => setEditing(true)}
          data-testid={`footer-edit-trigger-${contactKey}`}
        >
          {value || fallback}
          <Pencil className="ml-1 inline h-2.5 w-2.5 text-yellow-500 opacity-0 group-hover/edit:opacity-100 transition" />
        </span>
      ) : (
        <span>{value}</span>
      )}
    </li>
  );
}

export function SiteFooter() {
  const { data: fbUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "facebook_url"],
    queryFn: () => apiFetch("/api/admin/settings/facebook_url"),
  });
  const { data: ytUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "youtube_url"],
    queryFn: () => apiFetch("/api/admin/settings/youtube_url"),
  });
  const fbUrl = fbUrlData?.value || "https://www.facebook.com/wislajawornik";
  const ytUrl = ytUrlData?.value || "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g";

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navItems = [
    { label: "Aktualności", id: "aktualnosci" },
    { label: "Kalendarz", id: "polecamy" },
    { label: "Nagrania", id: "nagrania" },
    { label: "Galeria", id: "galeria" },
    { label: "O nas", id: "onas" },
    { label: "Kontakt", id: "kontakt" },
  ];

  return (
    <footer className="border-t border-border bg-muted/40 px-6 py-10 text-sm text-muted-foreground" data-testid="footer" role="contentinfo">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/parish-cross.svg" alt="Logo parafii" className="h-10 w-10 opacity-70" loading="lazy" decoding="async" />
              <span className="font-display text-base text-foreground" data-testid="text-footer-name">
                <EditableStaticText textKey="footer_parish_name" defaultValue="Parafia Ewangelicko-Augsburska" />
              </span>
            </div>
            <p className="text-xs leading-relaxed" data-testid="text-footer-location">
              <EditableStaticText textKey="footer_location" defaultValue="w Wiśle Jaworniku" />
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60" data-testid="text-footer-contact-heading">
              <EditableStaticText textKey="footer_contact_heading" defaultValue="Kontakt" />
            </h4>
            <ul className="space-y-1.5">
              <EditableContactValue
                contactKey="address"
                icon={<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                fallback="(adres)"
              />
              <EditableContactValue
                contactKey="phone"
                icon={<Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                fallback="(telefon)"
              />
              <EditableContactValue
                contactKey="email"
                icon={<Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                fallback="(email)"
              />
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60" data-testid="text-footer-nav-heading">
              <EditableStaticText textKey="footer_nav_heading" defaultValue="Nawigacja" />
            </h4>
            <ul className="space-y-1.5">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(item.id)}
                    className="hover:text-foreground transition"
                    data-testid={`link-footer-${item.id}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60" data-testid="text-footer-bank-heading">
              <EditableStaticText textKey="footer_bank_heading" defaultValue="Numer konta" />
            </h4>
            <p className="font-mono text-xs leading-relaxed break-words [overflow-wrap:anywhere]" data-testid="text-footer-bank">
              <EditableStaticText textKey="contact_bank_account" defaultValue="(uzupełnij numer konta)" />
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a href={fbUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-primary" data-testid="link-footer-facebook" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={ytUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-primary" data-testid="link-footer-youtube" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div data-testid="text-footer-copyright">
            © {new Date().getFullYear()} <EditableStaticText textKey="footer_text" defaultValue="jawornik.eu" />
          </div>
          <button type="button" onClick={scrollTop} className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground" data-testid="button-footer-top">
            <ArrowUp className="h-3.5 w-3.5" />
            <EditableStaticText textKey="footer_top_label" defaultValue="Do góry" />
          </button>
        </div>
      </div>
    </footer>
  );
}
