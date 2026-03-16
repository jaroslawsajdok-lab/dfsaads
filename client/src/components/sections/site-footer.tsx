import { useQuery } from "@tanstack/react-query";
import { Facebook, Youtube, MapPin, Phone, Mail, ArrowUp } from "lucide-react";
import { EditableStaticText } from "@/components/admin-tools";
import { apiFetch, scrollToId } from "@/lib/home-helpers";

type ContactMap = { address?: string; phone?: string; email?: string; hours?: string };

export function SiteFooter() {
  const { data: contactData } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60">Kontakt</h4>
            <ul className="space-y-1.5">
              {contactData?.address && (
                <li className="flex items-start gap-2" data-testid="footer-address">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{contactData.address}</span>
                </li>
              )}
              {contactData?.phone && (
                <li className="flex items-start gap-2" data-testid="footer-phone">
                  <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{contactData.phone}</span>
                </li>
              )}
              {contactData?.email && (
                <li className="flex items-start gap-2" data-testid="footer-email">
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{contactData.email}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60">Nawigacja</h4>
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/60">Numer konta</h4>
            <p className="font-mono text-xs leading-relaxed" data-testid="text-footer-bank">
              <EditableStaticText textKey="footer_bank_account" defaultValue="(uzupełnij numer konta)" />
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
            Do góry
          </button>
        </div>
      </div>
    </footer>
  );
}
