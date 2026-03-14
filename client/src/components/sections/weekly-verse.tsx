import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/home-helpers";
import type { WeeklyVerseData } from "@/lib/home-helpers";
import { BookOpen } from "lucide-react";

export function WeeklyVerseBanner() {
  const { data } = useQuery<{ verse: WeeklyVerseData | null }>({
    queryKey: ["weekly-verse"],
    queryFn: () => apiFetch("/api/weekly-verse"),
    refetchInterval: 60 * 60 * 1000,
  });

  const verse = data?.verse;
  if (!verse?.week_text) return null;

  return (
    <div
      className="w-full bg-[#0a63a3] text-white"
      data-testid="weekly-verse-banner"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2 sm:px-8">
        <BookOpen className="hidden h-4 w-4 shrink-0 opacity-80 sm:block" />
        <p className="text-center text-xs leading-snug sm:text-sm w-full">
          <span className="font-semibold">Hasło tygodnia:</span>{" "}
          <span className="italic">{verse.week_text}</span>
          {verse.week_source && (
            <span className="ml-1 opacity-70">— {verse.week_source}</span>
          )}
        </p>
      </div>
    </div>
  );
}
