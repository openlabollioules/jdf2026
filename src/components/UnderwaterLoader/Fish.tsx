import { memo, type CSSProperties } from "react";

interface SchoolSpec {
  y: number;
  size: number;
  duration: number;
  delay: number;
  reverse?: boolean;
  count: number;
  /** Direction d'écartement pendant la remontée. */
  scatter: number;
}

const SCHOOLS: SchoolSpec[] = [
  { y: 560, size: 1, duration: 22, delay: -4, count: 7, scatter: -460 },
  { y: 900, size: 0.8, duration: 26, delay: -14, count: 5, reverse: true, scatter: 460 },
  { y: 1250, size: 1.2, duration: 24, delay: -8, count: 6, scatter: -460 },
  { y: 1700, size: 0.9, duration: 20, delay: -2, count: 8, reverse: true, scatter: 460 },
  { y: 1990, size: 0.7, duration: 18, delay: -11, count: 6, scatter: 460 },
];

const FISH_PATH = "M-18 0 C-10 -9 8 -10 18 0 C8 10 -10 9 -18 0 Z M-18 0 L-28 -8 L-26 0 L-28 8 Z";

/** Bancs de poissons en silhouettes et raie manta ; ils s'écartent pendant la remontée. */
export const Fish = memo(function Fish({ scatter }: { scatter: boolean }) {
  return (
    <g className={`fish-school${scatter ? " is-scattering" : ""}`}>
      {SCHOOLS.map((s, i) => (
        <g key={i} className="fish-scatter" style={{ "--scatter": `${s.scatter}px` } as CSSProperties}>
          <g transform={`translate(0 ${s.y})`}>
            <g className={`fish-swim${s.reverse ? " reverse" : ""}`} style={{ animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}>
              <g transform={`scale(${s.reverse ? -s.size : s.size} ${s.size})`}>
                {Array.from({ length: s.count }, (_, k) => (
                  <g key={k} transform={`translate(${-((k * 37) % 150)} ${((k * 29) % 70) - 35})`}>
                    <path className="fish-wiggle" d={FISH_PATH} fill="#bfeaff" opacity={0.55 + (k % 3) * 0.12} style={{ animationDelay: `${k * 0.08}s` }} />
                  </g>
                ))}
              </g>
            </g>
          </g>
        </g>
      ))}

      {/* Raie manta */}
      <g className="fish-scatter" style={{ "--scatter": "-520px" } as CSSProperties}>
        <g transform="translate(0 1480)">
          <g className="fish-swim manta" style={{ animationDuration: "34s", animationDelay: "-20s" }}>
            <g className="manta-flap">
              <path d="M40 0 C20 -8 0 -70 -40 -86 C-30 -40 -40 -12 -60 0 C-40 12 -30 40 -40 86 C0 70 20 8 40 0 Z" fill="#0b2f6e" opacity="0.85" />
              <path d="M-60 0 L-140 4" stroke="#0b2f6e" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
});
