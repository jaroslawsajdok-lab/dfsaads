import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { Facebook, Heart, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SectionKontakt({ contactData }: { contactData: { address: string; phone: string; email: string; hours: string } }) {
  const { isEditMode } = useAuth();
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
  return (
    <section id="kontakt" className="relative bg-[linear-gradient(180deg,transparent,hsl(214_25%_96%))]" data-testid="section-kontakt" aria-label="Kontakt">
      <SectionReorderControls sectionId="kontakt" />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-contact-title">
            <EditableStaticText textKey="contact_title" defaultValue="Kontakt" />
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-contact-subtitle">
            <EditableStaticText textKey="contact_subtitle" defaultValue="Dane kontaktowe parafii." />
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border bg-white/80 p-6 backdrop-blur" data-testid="card-contact-details">
            <div className="space-y-4">
              <div className="flex items-start gap-3" data-testid="row-contact-address">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-address-title"><EditableStaticText textKey="contact_address_label" defaultValue="Adres" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-address">
                    <EditableStaticText textKey="contact_address" defaultValue={contactData.address || "(uzupełnij adres)"} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="row-contact-phone">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-phone-title"><EditableStaticText textKey="contact_phone_label" defaultValue="Telefon" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-phone">
                    <EditableStaticText textKey="contact_phone" defaultValue={contactData.phone || "(uzupełnij telefon)"} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="row-contact-mail">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-mail-title"><EditableStaticText textKey="contact_email_label" defaultValue="E-mail" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-mail">
                    <EditableStaticText textKey="contact_email" defaultValue={contactData.email || "(uzupełnij e-mail)"} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3" data-testid="row-contact-hours">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-hours-title"><EditableStaticText textKey="contact_hours_label" defaultValue="Godziny" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-hours">
                    <EditableStaticText textKey="contact_hours" defaultValue={contactData.hours || "(uzupełnij godziny)"} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2" data-testid="row-contact-links">
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  asChild
                  data-testid="button-contact-facebook"
                >
                  <a href={fbUrl} target="_blank" rel="noreferrer">
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  asChild
                  data-testid="button-contact-youtube"
                >
                  <a href={ytUrl} target="_blank" rel="noreferrer">
                    <Youtube className="mr-2 h-4 w-4" />
                    YouTube
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          {isEditMode && (
            <Card className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 backdrop-blur lg:col-span-2" data-testid="card-p24-placeholder">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <Heart className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-amber-800" data-testid="text-p24-title">Przelewy24 — Ofiary online</div>
                  <div className="text-xs text-amber-600">Sekcja ukryta dla odwiedzających. Do aktywacji po skonfigurowaniu P24.</div>
                </div>
              </div>

              <Separator className="my-4 bg-amber-200" />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3" data-testid="field-p24-amount">
                  <div className="text-xs text-muted-foreground">Kwota</div>
                  <div className="mt-1 text-sm text-amber-700" data-testid="value-p24-amount">50 zł / dowolna kwota</div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3" data-testid="field-p24-title">
                  <div className="text-xs text-muted-foreground">Tytuł wpłaty</div>
                  <div className="mt-1 text-sm text-amber-700" data-testid="value-p24-title">Ofiara na parafię</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-amber-600" data-testid="text-p24-note">
                  Wymaga: klucz P24_MERCHANT_ID + P24_CRC + P24_API_KEY
                </div>
                <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled data-testid="button-p24-pay">
                  Wpłać ofiarę
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-primary/10 shadow-sm" data-testid="map-wrap">
          <div className="bg-gradient-to-r from-primary/5 to-transparent px-5 py-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Znajdź nas na mapie</span>
          </div>
          <iframe
            src="https://www.google.com/maps?q=Parafia+Ewangelicko-Augsburska+Wisła+Jawornik&output=embed"
            className="w-full border-0"
            style={{ height: "350px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa — Parafia Ewangelicka w Wiśle Jaworniku"
            data-testid="iframe-google-map"
          />
        </div>

      </div>
    </section>
  );
}
