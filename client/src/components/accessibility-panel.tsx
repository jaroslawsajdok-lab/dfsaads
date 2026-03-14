import { useState, useEffect } from "react";
import { Eye, Moon, Sun, Type, Underline, X } from "lucide-react";

type FontSize = "normal" | "large" | "largest";

interface A11yPrefs {
  fontSize: FontSize;
  highContrast: boolean;
  underlineLinks: boolean;
}

const STORAGE_KEY = "a11y_prefs";
const DARK_KEY = "dark_mode";

function loadPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { fontSize: "normal", highContrast: false, underlineLinks: false };
}

function savePrefs(prefs: A11yPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function applyPrefs(prefs: A11yPrefs) {
  const html = document.documentElement;
  html.classList.remove("a11y-large-text", "a11y-largest-text", "a11y-high-contrast", "a11y-underline-links");
  if (prefs.fontSize === "large") html.classList.add("a11y-large-text");
  if (prefs.fontSize === "largest") html.classList.add("a11y-largest-text");
  if (prefs.highContrast) html.classList.add("a11y-high-contrast");
  if (prefs.underlineLinks) html.classList.add("a11y-underline-links");
}

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(DARK_KEY);
    if (stored !== null) return stored === "true";
  } catch {}
  return false;
}

function applyDarkMode(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);
  const [dark, setDark] = useState(getInitialDarkMode);

  useEffect(() => {
    applyPrefs(prefs);
    applyDarkMode(dark);
  }, []);

  const update = (partial: Partial<A11yPrefs>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    savePrefs(next);
    applyPrefs(next);
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem(DARK_KEY, String(next));
    applyDarkMode(next);
  };

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: "normal", label: "A" },
    { value: "large", label: "A+" },
    { value: "largest", label: "A++" },
  ];

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDark}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={dark ? "Tryb jasny" : "Tryb ciemny"}
          data-testid="button-dark-mode"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Panel dostępności"
          aria-expanded={open}
          data-testid="button-accessibility"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div
          className="fixed bottom-20 left-4 z-[9998] w-64 rounded-xl border border-border bg-card p-4 shadow-xl"
          role="dialog"
          aria-label="Ustawienia dostępności"
          data-testid="panel-accessibility"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">Dostępność</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zamknij panel dostępności"
              data-testid="button-close-accessibility"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Type className="h-3.5 w-3.5" />
                Rozmiar czcionki
              </label>
              <div className="flex gap-1">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.value}
                    type="button"
                    onClick={() => update({ fontSize: fs.value })}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
                      prefs.fontSize === fs.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    aria-pressed={prefs.fontSize === fs.value}
                    data-testid={`button-fontsize-${fs.value}`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => update({ highContrast: !prefs.highContrast })}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                prefs.highContrast
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              aria-pressed={prefs.highContrast}
              data-testid="button-high-contrast"
            >
              <Eye className="h-4 w-4" />
              Wysoki kontrast
            </button>

            <button
              type="button"
              onClick={() => update({ underlineLinks: !prefs.underlineLinks })}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                prefs.underlineLinks
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              aria-pressed={prefs.underlineLinks}
              data-testid="button-underline-links"
            >
              <Underline className="h-4 w-4" />
              Podkreśl linki
            </button>
          </div>
        </div>
      )}
    </>
  );
}
