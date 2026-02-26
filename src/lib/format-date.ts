import { format } from "date-fns";

/** Format date as DD/MM/YYYY (Indian format) */
export function formatDateDDMMYYYY(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return format(dt, "dd/MM/yyyy");
}
