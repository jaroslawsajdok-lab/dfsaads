export function formatDatePL(isoDate: string) {
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "short" });
  } catch { return isoDate; }
}
