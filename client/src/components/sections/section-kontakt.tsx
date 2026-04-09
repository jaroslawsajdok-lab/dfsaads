import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/home-helpers";
import { apiRequest } from "@/lib/queryClient";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { Banknote, Clock, Facebook, Heart, Mail, MapPin, Pencil, Phone, Smartphone, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ContactMap = { address?: string; phone?: string; email?: string; hours?: string };

const DEFAULT_REGULAMIN = `Parafia Ewangelicko-Augsburska Wisła Jawornik

§1. Postanowienia ogólne
1. Niniejszy regulamin określa zasady przekazywania darowizn na rzecz Parafii Ewangelicko-Augsburskiej Wisła Jawornik.
2. Parafia Ewangelicko-Augsburska Wisła Jawornik z siedzibą przy ul. Jodłowej 8A, 43-460 Wisła, jest odbiorcą darowizn.
3. Darowizny przekazywane są dobrowolnie przez osoby fizyczne lub prawne.

§2. Cel darowizn
1. Darowizny przeznaczane są na cele związane z działalnością statutową parafii, w szczególności: utrzymanie kaplicy i obiektów parafialnych, działalność duszpasterską i religijną, działalność charytatywną.

§3. Sposób dokonywania wpłat
1. Darowizny mogą być przekazywane drogą elektroniczną za pośrednictwem systemu płatności Przelewy24.
2. Dokonanie wpłaty oznacza akceptację niniejszego regulaminu.

§4. Charakter darowizny
1. Wszystkie wpłaty mają charakter darowizny w rozumieniu przepisów prawa.
2. Darowizny są dobrowolne i nie stanowią zapłaty za jakiekolwiek usługi lub towary.

§5. Zwroty i reklamacje
1. Darowizny co do zasady nie podlegają zwrotowi.
2. W wyjątkowych sytuacjach (np. błędna kwota) darczyńca może zgłosić prośbę o zwrot.
3. Zgłoszenia należy kierować na adres e-mail parafii lub telefonicznie.

§6. Dane osobowe (RODO)
1. Administratorem danych osobowych darczyńców jest Parafia Ewangelicko-Augsburska Wisła Jawornik.
2. Dane osobowe przetwarzane są wyłącznie w celu realizacji płatności oraz prowadzenia dokumentacji księgowej.
3. Podanie danych jest dobrowolne, ale niezbędne do dokonania wpłaty.
4. Każda osoba ma prawo dostępu do swoich danych oraz ich poprawiania.

§7. Postanowienia końcowe
1. Parafia zastrzega sobie prawo do wprowadzenia zmian w regulaminie.
2. Aktualna wersja regulaminu jest dostępna na stronie internetowej parafii.

Data obowiązywania regulaminu: 25.03.2026`;

export function SectionKontakt() {
  const { isEditMode } = useAuth();
  const queryClient = useQueryClient();
  const { data: contactData = {} as ContactMap } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });
  const { data: fbUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "facebook_url"],
    queryFn: () => apiFetch("/api/admin/settings/facebook_url"),
  });
  const { data: ytUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "youtube_url"],
    queryFn: () => apiFetch("/api/admin/settings/youtube_url"),
  });
  const { data: regulaminData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "p24_regulamin"],
    queryFn: () => apiFetch("/api/admin/settings/p24_regulamin"),
  });

  const fbUrl = fbUrlData?.value || "https://www.facebook.com/wislajawornik";
  const ytUrl = ytUrlData?.value || "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g";
  const regulaminText = regulaminData?.value || DEFAULT_REGULAMIN;

  const [regulaminOpen, setRegulaminOpen] = useState(false);
  const [editingRegulamin, setEditingRegulamin] = useState(false);
  const [regulaminDraft, setReguaminDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function openModal() {
    setReguaminDraft(regulaminText);
    setEditingRegulamin(false);
    setRegulaminOpen(true);
  }

  async function saveRegulamin() {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/settings/p24_regulamin", { value: regulaminDraft });
      await queryClient.invalidateQueries({ queryKey: ["admin-setting", "p24_regulamin"] });
      setEditingRegulamin(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="kontakt" className="relative" data-testid="section-kontakt" aria-label="Kontakt">
      <SectionReorderControls sectionId="kontakt" />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-contact-title">
            <EditableStaticText textKey="contact_title" defaultValue="Kontakt" />
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-contact-subtitle">
            <EditableStaticText textKey="contact_subtitle" defaultValue="Dane kontaktowe parafii." />
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border bg-white/80 dark:bg-card/80 p-6 backdrop-blur" data-testid="card-contact-details">
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
                <Clock className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-hours-title"><EditableStaticText textKey="contact_hours_label" defaultValue="Kancelaria czynna" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-hours">
                    <EditableStaticText textKey="contact_hours" defaultValue={contactData.hours || "(uzupełnij godziny)"} />
                  </div>
                  <div className="mt-1 text-sm font-medium" data-testid="text-contact-hours-sunday-title"><EditableStaticText textKey="contact_hours_sunday_label" defaultValue="Niedziela" /></div>
                  <div className="text-sm text-muted-foreground" data-testid="text-contact-hours-sunday">
                    <EditableStaticText textKey="contact_hours_sunday" defaultValue="(uzupełnij godziny niedzielne)" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3" data-testid="row-contact-bank">
                <Banknote className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-bank-title"><EditableStaticText textKey="contact_bank_label" defaultValue="Numer konta" /></div>
                  <div className="text-sm text-muted-foreground font-mono" data-testid="text-contact-bank">
                    <EditableStaticText textKey="contact_bank_account" defaultValue="(uzupełnij numer konta)" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="row-contact-blik">
                <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium" data-testid="text-contact-blik-title"><EditableStaticText textKey="contact_blik_label" defaultValue="Blik" /></div>
                  <div className="text-sm text-muted-foreground font-mono" data-testid="text-contact-blik">
                    <EditableStaticText textKey="contact_blik_phone" defaultValue="(uzupełnij numer telefonu na Blik)" />
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

          <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40 p-6 backdrop-blur lg:col-span-2" data-testid="card-p24-placeholder">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Heart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-amber-800 dark:text-amber-300" data-testid="text-p24-title">Przelewy24 — Ofiary online</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    <EditableStaticText textKey="p24_description" defaultValue="Wspieraj parafię przez bezpieczne płatności online." />
                  </div>
                </div>
              </div>

              <Separator className="my-4 bg-amber-200 dark:bg-amber-800/40" />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-amber-950/30 px-4 py-3" data-testid="field-p24-amount">
                  <div className="text-xs text-muted-foreground">Kwota</div>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-300" data-testid="value-p24-amount">
                    <EditableStaticText textKey="p24_amount_label" defaultValue="50 zł / dowolna kwota" />
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-amber-950/30 px-4 py-3" data-testid="field-p24-title">
                  <div className="text-xs text-muted-foreground">Tytuł wpłaty</div>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-300" data-testid="value-p24-title">
                    <EditableStaticText textKey="p24_payment_title" defaultValue="Ofiara na parafię" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
                <button
                  onClick={openModal}
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                  data-testid="button-p24-terms"
                >
                  Regulamin
                </button>
                <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled data-testid="button-p24-pay">
                  Wpłać ofiarę
                </Button>
              </div>
              {isEditMode && (
                <div className="mt-3 text-xs text-amber-600 dark:text-amber-500" data-testid="text-p24-note">
                  Wymaga: klucz P24_MERCHANT_ID + P24_CRC + P24_API_KEY
                </div>
              )}
            </Card>
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

      {regulaminOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRegulaminOpen(false); }}
          data-testid="modal-regulamin-backdrop"
        >
          <div className="flex min-h-full items-center justify-center">
            <div className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl" data-testid="modal-regulamin">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold" data-testid="text-regulamin-title">Regulamin przyjmowania darowizn online</h2>
                <div className="flex items-center gap-2">
                  {isEditMode && !editingRegulamin && (
                    <button
                      onClick={() => { setReguaminDraft(regulaminText); setEditingRegulamin(true); }}
                      className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      data-testid="button-edit-regulamin"
                      aria-label="Edytuj regulamin"
                      title="Edytuj regulamin"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setRegulaminOpen(false); setEditingRegulamin(false); }}
                    className="rounded-full p-1 hover:bg-muted transition-colors"
                    data-testid="button-close-regulamin"
                    aria-label="Zamknij"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {editingRegulamin ? (
                <div className="px-6 py-5 flex flex-col gap-3">
                  <textarea
                    className="w-full rounded-xl border bg-muted/40 px-4 py-3 text-sm leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ minHeight: "400px" }}
                    value={regulaminDraft}
                    onChange={(e) => setReguaminDraft(e.target.value)}
                    data-testid="textarea-regulamin"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingRegulamin(false)} data-testid="button-cancel-regulamin">
                      Anuluj
                    </Button>
                    <Button size="sm" onClick={saveRegulamin} disabled={saving} data-testid="button-save-regulamin">
                      {saving ? "Zapisuję…" : "Zapisz"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto px-6 py-5 max-h-[70vh]" data-testid="content-regulamin">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans" data-testid="text-regulamin-content">
                    {regulaminText}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
