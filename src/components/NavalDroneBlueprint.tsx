import { branding } from "@/config/branding";

/**
 * Illustration d'accueil : plan technique animé d'un drone naval
 * (traits cyan sur fond marine, cotes, ondes sonar, hélices).
 */
export function NavalDroneBlueprint({ className = "" }: { className?: string }) {
  const e = branding.emblem;
  return (
    <svg className={`blueprint ${className}`} viewBox="0 0 640 480" role="img" aria-label="Plan d'un drone naval">
      <defs>
        <linearGradient id="bp-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9d6ec" />
        </linearGradient>
        <radialGradient id="bp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5fd4ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#5fd4ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cercle de plan + graduations */}
      <circle cx="320" cy="240" r="210" fill="url(#bp-glow)" />
      <circle cx="320" cy="240" r="210" className="bp-line bp-faint" />
      <circle cx="320" cy="240" r="150" className="bp-line bp-faint bp-dash" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * Math.PI) / 18;
        const r1 = i % 3 === 0 ? 196 : 202;
        const p = (v: number) => v.toFixed(2); // arrondi stable serveur/client (hydratation)
        return <line key={i} className="bp-line bp-faint" x1={p(320 + Math.cos(a) * r1)} y1={p(240 + Math.sin(a) * r1)} x2={p(320 + Math.cos(a) * 210)} y2={p(240 + Math.sin(a) * 210)} />;
      })}
      <g className="bp-sweep">
        <path d="M320 240 L530 240 A210 210 0 0 0 500 132 Z" fill="#5fd4ff" opacity="0.12" />
      </g>

      {/* Ondes sonar émises par l'avant */}
      {[0, 1, 2].map((i) => (
        <circle key={i} className="bp-ping" cx="488" cy="250" r="18" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}

      <g className="bp-float">
        {/* Rotors (drone hybride : vole et plonge) */}
        {[
          [205, 150],
          [415, 150],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <line className="bp-line" x1="0" y1="0" x2="0" y2="40" />
            <g className="bp-rotor" style={{ animationDelay: `${i * -0.1}s` }}>
              <ellipse rx="62" ry="7" fill="#5fd4ff" opacity="0.25" />
              <line className="bp-line" x1="-62" y1="0" x2="62" y2="0" />
            </g>
            <circle r="7" fill="#ffffff" />
          </g>
        ))}

        {/* Coque */}
        <path d="M150 250 C150 205 215 188 320 188 C420 188 486 212 500 250 C486 288 420 306 320 306 C215 306 150 292 150 250 Z" fill="url(#bp-hull)" stroke="#ffffff" strokeWidth="3" />
        <path d="M168 262 C230 284 410 286 492 258" stroke="#002A8F" strokeWidth="10" fill="none" opacity="0.9" />
        <path d="M172 272 C236 292 404 294 486 266" stroke="#EF002F" strokeWidth="4" fill="none" />
        {/* Kiosque avec l'emblème */}
        <path d="M270 190 L286 150 L352 150 L366 190 Z" fill="url(#bp-hull)" stroke="#ffffff" strokeWidth="3" />
        <image href={e.src} x="301" y="158" width="34" height={(34 * e.height) / e.width} />
        {/* Hublot / capteur avant */}
        <path d="M430 232 C452 232 474 240 484 250 C474 260 452 266 430 266 Z" fill="#0b2a6b" />
        <circle className="bp-eye" cx="452" cy="249" r="6" fill="#5fd4ff" />
        {/* Gouvernes + propulseur */}
        <path d="M168 238 L120 208 L132 246 Z M168 262 L120 292 L132 254 Z" fill="#c9d6ec" stroke="#ffffff" strokeWidth="2" />
        <rect x="112" y="238" width="22" height="24" rx="6" fill="#0b2a6b" stroke="#ffffff" strokeWidth="2" />
        <g transform="translate(112 250)">
          <g className="bp-prop">
            <line className="bp-line" x1="0" y1="-22" x2="0" y2="22" />
          </g>
        </g>
      </g>

      {/* Cotes */}
      <g className="bp-dims">
        <line className="bp-line bp-faint" x1="120" y1="350" x2="500" y2="350" />
        <line className="bp-line bp-faint" x1="120" y1="340" x2="120" y2="360" />
        <line className="bp-line bp-faint" x1="500" y1="340" x2="500" y2="360" />
        <line className="bp-line bp-faint" x1="540" y1="150" x2="540" y2="306" />
        <line className="bp-line bp-faint" x1="530" y1="150" x2="550" y2="150" />
        <line className="bp-line bp-faint" x1="530" y1="306" x2="550" y2="306" />
      </g>
    </svg>
  );
}
