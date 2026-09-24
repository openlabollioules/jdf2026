import { memo } from "react";
import { SEABED_Y, SURFACE_Y, WORLD } from "./geometry";

/** Ciel, surface, colonne d'eau, rayons lumineux, fond marin en silhouettes. */
export const Ocean = memo(function Ocean() {
  return (
    <g className="ocean">
      {/* Ciel + soleil + nuages fins */}
      <rect x="0" y="-200" width={WORLD.w} height={SURFACE_Y + 240} fill="url(#sky)" />
      <circle cx="1330" cy="120" r="140" fill="#ffffff" opacity="0.35" />
      <circle cx="1330" cy="120" r="62" fill="#fff8e1" />
      <g fill="#ffffff" className="sky-clouds">
        <g className="drift-slow" opacity="0.9">
          <rect x="150" y="96" width="260" height="22" rx="11" />
          <rect x="210" y="76" width="140" height="22" rx="11" />
        </g>
        <g className="drift-slower" opacity="0.75">
          <rect x="880" y="150" width="200" height="16" rx="8" />
          <rect x="930" y="134" width="110" height="16" rx="8" />
        </g>
      </g>
      {/* Navire de recherche à l'horizon */}
      <g transform={`translate(1110 ${SURFACE_Y - 6})`} fill="#16307a" opacity="0.55">
        <path d="M0 0 L150 0 L138 -16 L8 -16 Z" />
        <rect x="46" y="-40" width="54" height="24" rx="3" />
        <rect x="64" y="-60" width="6" height="20" />
        <rect x="80" y="-52" width="16" height="12" rx="2" />
      </g>

      {/* Eau */}
      <rect x="0" y={SURFACE_Y} width={WORLD.w} height={WORLD.h - SURFACE_Y} fill="url(#water)" />

      {/* Rayons lumineux (s'estompent avec la profondeur) */}
      <g className="rays" fill="url(#ray-fade)">
        {[180, 520, 860, 1200, 1480].map((x, i) => (
          <polygon
            key={x}
            className="ray"
            style={{ animationDelay: `${i * 0.7}s` }}
            points={`${x - 40},${SURFACE_Y} ${x + 40},${SURFACE_Y} ${x + 260},${SURFACE_Y + 1300} ${x - 60},${SURFACE_Y + 1300}`}
          />
        ))}
      </g>

      {/* Surface ondulée */}
      <g className="waves">
        <path className="wave wave-back" d={wavePath(SURFACE_Y - 4, 30, 16)} fill="#8fd6f7" opacity="0.85" />
        <path className="wave wave-front" d={wavePath(SURFACE_Y + 4, 40, 12)} fill="#3fb3ea" />
      </g>

      {/* Particules en suspension */}
      <g fill="#ffffff" opacity="0.3">
        {Array.from({ length: 46 }, (_, i) => (
          <circle key={i} cx={(i * 211) % WORLD.w} cy={SURFACE_Y + 120 + ((i * 397) % 1950)} r={1.5 + (i % 3)} />
        ))}
      </g>

      {/* Relief lointain */}
      <path
        d={`M0 ${SEABED_Y - 60} L120 ${SEABED_Y - 140} L260 ${SEABED_Y - 90} L380 ${SEABED_Y - 170} L520 ${SEABED_Y - 80} L640 ${SEABED_Y - 60} L1600 ${SEABED_Y - 70} V${WORLD.h} H0 Z`}
        fill="#0a2a66"
        opacity="0.8"
      />

      {/* Fond marin */}
      <path
        d={`M0 ${SEABED_Y} Q200 ${SEABED_Y - 30} 400 ${SEABED_Y} T800 ${SEABED_Y} T1200 ${SEABED_Y} T1600 ${SEABED_Y} V${WORLD.h} H0 Z`}
        fill="url(#sand)"
      />
      {[120, 330, 700, 1250, 1540].map((x, i) => (
        <ellipse key={x} cx={x} cy={SEABED_Y + 80 + (i % 2) * 40} rx="26" ry="10" fill="#0a2a66" opacity="0.35" />
      ))}

      {/* Algues en silhouettes */}
      {[
        [60, 1],
        [110, 0.8],
        [420, 1.1],
        [760, 0.7],
        [1560, 1],
      ].map(([x, s], i) => (
        <g key={i} transform={`translate(${x} ${SEABED_Y + 8}) scale(${s})`}>
          <path
            className="seaweed"
            style={{ animationDelay: `${i * -0.8}s` }}
            d="M0 0 C-16 -60 16 -110 0 -170 C-12 -210 8 -240 0 -270 C20 -230 24 -200 11 -160 C28 -110 -2 -60 10 0 Z"
            fill="#0f6f7a"
          />
        </g>
      ))}
      {/* Rochers */}
      <path d={`M220 ${SEABED_Y + 12} C230 ${SEABED_Y - 50} 330 ${SEABED_Y - 60} 350 ${SEABED_Y + 12} Z`} fill="#0b2f6e" />
      <path d={`M600 ${SEABED_Y + 20} C610 ${SEABED_Y - 26} 680 ${SEABED_Y - 30} 700 ${SEABED_Y + 20} Z`} fill="#0b2f6e" />

      {/* Bulles ambiantes près du fond */}
      <g className="ambient-bubbles">
        {Array.from({ length: 10 }, (_, i) => (
          <circle
            key={i}
            className="ambient-bubble"
            cx={100 + ((i * 157) % 1400)}
            cy={SEABED_Y - 10}
            r={4 + (i % 3) * 3}
            style={{ animationDelay: `${(i * 0.9) % 6}s`, animationDuration: `${5 + (i % 4)}s` }}
          />
        ))}
      </g>
    </g>
  );
});

function wavePath(y: number, amplitude: number, count: number): string {
  // Chemin plus large que la scène pour pouvoir dériver horizontalement.
  const w = (WORLD.w + 400) / count;
  let d = `M-200 ${y}`;
  for (let i = 0; i < count; i++) {
    const x0 = -200 + i * w;
    d += ` Q${x0 + w / 4} ${y - amplitude / 3} ${x0 + w / 2} ${y} T${x0 + w} ${y}`;
  }
  d += ` V${y + 80} H-200 Z`;
  return d;
}
