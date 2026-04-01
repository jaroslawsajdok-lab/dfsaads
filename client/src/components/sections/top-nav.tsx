import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { cx, scrollToId, PARISH_LOGO_SRC, CROSS_H_DESKTOP } from "@/lib/home-helpers";
import { EditableStaticText, useNavItems, useSectionOrder } from "@/components/admin-tools";
import { ChevronDown, ChevronUp, LogIn, LogOut, Settings, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function useStickyNavTrigger() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let shownOnce = false;
    const startedAt = performance.now();

    const maybeShow = () => {
      if (shownOnce) return;
      const elapsed = performance.now() - startedAt;
      const scrolled = window.scrollY > 24;
      if (elapsed >= 3000 || scrolled) {
        shownOnce = true;
        setShown(true);
      }
    };

    const onScroll = () => {
      maybeShow();
    };

    const t = window.setInterval(maybeShow, 120);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearInterval(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return shown;
}

function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      resetForm();
      onOpenChange(false);
    } else {
      setError(result.error || "Błąd logowania");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" data-testid="dialog-login-backdrop" onClick={() => { resetForm(); onOpenChange(false); }}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} data-testid="dialog-login">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-display text-xl" data-testid="text-login-title">Panel administracyjny</h3>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="text-login-subtitle">Zaloguj się, aby edytować treści.</p>
        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <Input
            type="email"
            placeholder="Adres email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            data-testid="input-login-email"
          />
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-login-password"
          />
          {error && <p className="text-sm text-red-500" data-testid="text-login-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-xl" disabled={loading} data-testid="button-login-submit">
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? "Logowanie..." : "Zaloguj"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => { resetForm(); onOpenChange(false); }} data-testid="button-login-cancel">
              Anuluj
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NavReorderButtons({ sectionId, index, total }: { sectionId: string; index: number; total: number }) {
  const order = useSectionOrder();
  const qc = useQueryClient();

  const move = async (dir: -1 | 1) => {
    const newOrder = [...order];
    const idx = newOrder.indexOf(sectionId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    await apiRequest("PUT", "/api/admin/settings/section_order", { value: JSON.stringify(newOrder) });
    await qc.invalidateQueries({ queryKey: ["admin-setting", "section_order"] });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  return (
    <div className="flex flex-col mr-2 gap-0.5" data-testid={`nav-reorder-${sectionId}`}>
      <button
        onClick={(e) => { e.stopPropagation(); move(-1); }}
        disabled={index === 0}
        className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition"
        data-testid={`button-nav-up-${sectionId}`}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); move(1); }}
        disabled={index === total - 1}
        className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition"
        data-testid={`button-nav-down-${sectionId}`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TopNav({ shown }: { shown: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAdmin, isEditMode, setEditMode, logout } = useAuth();
  const [, setLocation] = useLocation();
  const NAV_ITEMS = useNavItems();

  const desktopBarH = Math.round(CROSS_H_DESKTOP * 0.2752);
  const desktopBarTop = Math.round(CROSS_H_DESKTOP * 0.1632);
  const desktopCrossW = Math.round(CROSS_H_DESKTOP * (53.97 / 87.72));
  const desktopLogoAreaW = desktopCrossW + 12;

  return (
    <>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <nav
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700",
          shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
        )}
        data-testid="nav-wrap"
        data-sticky-nav
        role="navigation"
        aria-label="Nawigacja główna"
      >
        <div className="md:hidden flex items-center h-14 bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-sm px-4">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 cursor-pointer"
            data-testid="button-nav-logo"
            aria-label="Otwórz menu nawigacyjne"
            aria-expanded={menuOpen}
          >
            <img
              src={PARISH_LOGO_SRC}
              alt="Logo Parafii Ewangelickiej w Wiśle Jaworniku"
              className="h-10 w-auto object-contain"
              loading="eager"
              decoding="async"
              data-testid="img-cross-nav"
            />
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Menu</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                data-testid="button-nav-login-mobile"
                aria-label="Zaloguj się"
              >
                <LogIn className="h-4 w-4" />
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode(!isEditMode)}
                  className={cx(
                    "rounded-lg px-2 py-1 text-xs font-semibold tracking-wide uppercase transition",
                    isEditMode ? "bg-yellow-400 text-yellow-900" : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                  data-testid="button-nav-editmode-mobile"
                >
                  <Settings className="mr-1 inline h-3 w-3" />
                  {isEditMode ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/bezpieczenstwo")}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  data-testid="button-nav-security-mobile"
                  aria-label="Bezpieczeństwo"
                >
                  <Shield className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  data-testid="button-nav-logout-mobile"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="absolute inset-x-0 top-0 bg-white dark:bg-card" style={{ height: desktopBarTop + desktopBarH + 4 }} />
          <div
            className="absolute right-0"
            style={{ top: desktopBarTop, height: desktopBarH, background: "#b0b0b0", left: desktopLogoAreaW + 3 }}
            data-testid="nav-bar-full"
          />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="absolute left-0 top-0 z-10 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            style={{ width: desktopCrossW, height: CROSS_H_DESKTOP, marginLeft: 3 }}
            data-testid="button-nav-logo-desktop"
            aria-label="Menu"
          >
            <img
              src={PARISH_LOGO_SRC}
              alt="Logo Parafii Ewangelickiej w Wiśle Jaworniku"
              className="h-full w-full object-contain"
              loading="eager"
              decoding="async"
            />
          </button>
          <div
            className="absolute flex items-center gap-8 px-10"
            style={{ top: desktopBarTop, height: desktopBarH, left: desktopLogoAreaW + 3, right: 0 }}
            data-testid="nav-desktop-items"
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="text-[16px] font-semibold tracking-widest text-white uppercase transition-opacity hover:opacity-70"
                data-testid={`link-nav-${item.id}`}
              >
                <EditableStaticText textKey={`nav_${item.id}`} defaultValue={item.label} />
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
                  data-testid="button-nav-login"
                  aria-label="Zaloguj się"
                >
                  <LogIn className="h-4 w-4" />
                </button>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMode(!isEditMode)}
                    className={cx(
                      "rounded-lg px-2 py-1 text-xs font-semibold tracking-wide uppercase transition",
                      isEditMode ? "bg-yellow-400 text-yellow-900" : "bg-white/20 text-white hover:bg-white/30",
                    )}
                    data-testid="button-nav-editmode"
                  >
                    <Settings className="mr-1 inline h-3 w-3" />
                    {isEditMode ? "Edycja ON" : "Edycja OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation("/bezpieczenstwo")}
                    className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
                    data-testid="button-nav-security"
                    aria-label="Bezpieczeństwo"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
                    data-testid="button-nav-logout"
                    aria-label="Wyloguj"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              data-testid="nav-dropdown-backdrop"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 rounded-b-xl bg-card shadow-lg left-0 right-0 top-14 md:left-[3px] md:right-auto md:w-[280px] md:top-[197px]"
              data-testid="nav-dropdown"
            >
              <div className="flex flex-col py-2">
                {NAV_ITEMS.map((item, idx) => (
                  <div key={item.id} className="flex items-center group">
                    <button
                      type="button"
                      onClick={() => { scrollToId(item.id); setMenuOpen(false); }}
                      className="flex-1 px-5 py-3 text-left text-[15px] font-semibold tracking-widest text-foreground/80 uppercase transition-colors hover:bg-muted hover:text-foreground"
                      data-testid={`link-dropdown-${item.id}`}
                    >
                      <EditableStaticText textKey={`nav_${item.id}`} defaultValue={item.label} />
                    </button>
                    {isEditMode && (
                      <NavReorderButtons sectionId={item.id} index={idx} total={NAV_ITEMS.length} />
                    )}
                  </div>
                ))}
                <Separator className="my-1" />
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                    className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    data-testid="link-dropdown-login"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Zaloguj
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditMode(!isEditMode); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted"
                      data-testid="link-dropdown-editmode"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      {isEditMode ? "Wyłącz edycję" : "Włącz edycję"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLocation("/bezpieczenstwo"); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted"
                      data-testid="link-dropdown-security"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Bezpieczeństwo
                    </button>
                    <button
                      type="button"
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted"
                      data-testid="link-dropdown-logout"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Wyloguj
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </nav>
    </>
  );
}
