/** Décor de fond : grille « plan technique », houle et particules, purement décoratif. */
export function Backdrop({ variant }: { variant: "ocean" | "result" | "none" }) {
  if (variant === "none") return null;
  return (
    <div className={`backdrop backdrop-${variant}`} aria-hidden>
      <div className="backdrop-grid" />
      <svg className="backdrop-waves" viewBox="0 0 1600 220" preserveAspectRatio="none">
        <path className="bw bw1" d="M-200 120 Q0 80 200 120 T600 120 T1000 120 T1400 120 T1800 120 V220 H-200 Z" />
        <path className="bw bw2" d="M-200 150 Q0 115 200 150 T600 150 T1000 150 T1400 150 T1800 150 V220 H-200 Z" />
        <path className="bw bw3" d="M-200 180 Q0 155 200 180 T600 180 T1000 180 T1400 180 T1800 180 V220 H-200 Z" />
      </svg>
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="particle"
          style={{ left: `${(i * 37 + 5) % 100}%`, animationDelay: `${(i * 1.3) % 12}s`, animationDuration: `${10 + (i % 5) * 3}s` }}
        />
      ))}
    </div>
  );
}
