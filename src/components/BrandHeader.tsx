import { branding } from "@/config/branding";
import type { SessionStatus } from "@/lib/session/machine";
import { ProgressDots } from "./ProgressDots";

/** Logo + mention de l'événement, séparés par un filet (version compacte ou grande). */
export function BrandMark({ eventName, size = "md" }: { eventName: string; size?: "md" | "lg" }) {
  const [label, year] = splitYear(eventName);
  return (
    <div className={`brand-mark brand-mark-${size}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-logo" src={branding.logo.src} alt={branding.logo.alt} width={branding.logo.width} height={branding.logo.height} draggable={false} />
      <span className="brand-divider" aria-hidden />
      <span className="brand-event">
        <span className="brand-event-label">{label}</span>
        {year && <span className="brand-event-year">{year}</span>}
      </span>
    </div>
  );
}

/** « Journée des Familles 2026 » → ["Journée des Familles", "2026"] pour une mise en page soignée. */
function splitYear(name: string): [string, string] {
  const m = /^(.*?)[\s-]*(\d{4})$/.exec(name.trim());
  return m ? [m[1]!, m[2]!] : [name, ""];
}

/** Bandeau blanc discret présent sur les écrans du parcours. */
export function BrandHeader({ eventName, status }: { eventName: string; status: SessionStatus }) {
  return (
    <header className="brand-header">
      <BrandMark eventName={eventName} />
      <ProgressDots status={status} />
    </header>
  );
}
