import { useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useSectionOrder } from "@/components/admin-tools";
import { scrollToId } from "@/lib/home-helpers";

export { EditableStaticText } from "@/components/admin-tools";

import { VideoHero } from "@/components/sections/video-hero";
import { TopNav, useStickyNavTrigger } from "@/components/sections/top-nav";
import { WeeklyVerseBanner } from "@/components/sections/weekly-verse";
import { AdminFloatingBar } from "@/components/sections/admin-bar";
import { SectionAktualnosci } from "@/components/sections/section-aktualnosci";
import { SectionKalendarz } from "@/components/sections/section-kalendarz";
import { SectionNagrania } from "@/components/sections/section-nagrania";
import { SectionGaleria } from "@/components/sections/section-galeria";
import { SectionONas } from "@/components/sections/section-onas";
import { SectionDomGoscinny } from "@/components/sections/section-dom";
import { SectionKontakt } from "@/components/sections/section-kontakt";
import { SectionGrupy } from "@/components/sections/section-grupy";
import { SiteFooter } from "@/components/sections/site-footer";

export default function HomePage() {
  const stickyShown = useStickyNavTrigger();
  const sectionOrder = useSectionOrder();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => scrollToId(hash), 800);
    return () => clearTimeout(timer);
  }, []);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "aktualnosci":
        return <SectionAktualnosci key="aktualnosci" />;
      case "polecamy":
        return <SectionKalendarz key="polecamy" />;
      case "nagrania":
        return <SectionNagrania key="nagrania" />;
      case "galeria":
        return <SectionGaleria key="galeria" />;
      case "onas":
        return <SectionONas key="onas" />;
      case "dom":
        return <SectionDomGoscinny key="dom" />;
      case "kontakt":
        return <SectionKontakt key="kontakt" />;
      case "grupy":
        return <SectionGrupy key="grupy" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col" data-testid="page-home">
      <main className="flex-1">
        <WeeklyVerseBanner />
        <TopNav shown={stickyShown} />
        <VideoHero />

        <MotionConfig transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}>
          <AnimatePresence mode="popLayout">
            {sectionOrder.map((id, i) => {
              const el = renderSection(id);
              if (!el) return null;
              return (
                <motion.div key={id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={i % 2 === 1 ? "bg-muted" : "bg-background"}>
                  {el}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </MotionConfig>

        <AdminFloatingBar />
      </main>

      <SiteFooter />
    </div>
  );
}
