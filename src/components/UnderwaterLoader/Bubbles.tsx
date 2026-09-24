import type { CSSProperties } from "react";
import { memo } from "react";

/** Gerbe d'éclaboussures à l'arrivée en surface. */
export const Splash = memo(function Splash({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="splash">
      <ellipse className="splash-ring" rx="160" ry="30" fill="none" stroke="#fff" strokeWidth="10" />
      <ellipse className="splash-ring r2" rx="160" ry="30" fill="none" stroke="#bdefff" strokeWidth="8" />
      {Array.from({ length: 16 }, (_, i) => {
        const angle = -Math.PI + (i / 15) * Math.PI;
        const dist = 170 + (i % 3) * 60;
        return (
          <circle
            key={i}
            className="droplet"
            r={10 + (i % 4) * 5}
            fill={i % 3 ? "#bdefff" : "#fff"}
            style={{ "--dx": `${Math.cos(angle) * dist}px`, "--dy": `${Math.sin(angle) * dist}px`, animationDelay: `${(i % 5) * 0.03}s` } as CSSProperties}
          />
        );
      })}
    </g>
  );
});
