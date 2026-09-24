import { memo } from "react";
import { branding } from "@/config/branding";
import type { ScenePhase } from "@/lib/scene/sceneMachine";
import { LAB_HATCH, SEABED_Y } from "./geometry";

const E = branding.emblem;
const DOME = { cx: 1185, cy: SEABED_Y - 70, rx: 245, ry: 230 };

/** Centre d'essais sous-marin : dôme, hologramme du drone, modules, emblème, bras robotisés. */
export const Laboratory = memo(function Laboratory({ phase }: { phase: ScenePhase }) {
  const working = phase === "laboratory" || phase === "waiting";
  const handoff = phase === "result-ready";
  const base = SEABED_Y - 70;
  return (
    <g className={`lab${working ? " is-working" : ""}${handoff ? " is-handoff" : ""}`}>
      {/* Câble / conduite vers la surface */}
      <path d={`M1440 ${base - 90} C1500 1900 1470 1720 1520 1500`} stroke="#0b2a6b" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d={`M1440 ${base - 90} C1500 1900 1470 1720 1520 1500`} stroke="#3d64b8" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Mât + feu à éclats */}
      <path d={`M${DOME.cx} ${DOME.cy - DOME.ry + 4} L${DOME.cx} ${DOME.cy - DOME.ry - 70}`} stroke="#c9d6ec" strokeWidth="8" strokeLinecap="round" />
      <path d={`M${DOME.cx - 26} ${DOME.cy - DOME.ry - 40} L${DOME.cx + 26} ${DOME.cy - DOME.ry - 40}`} stroke="#c9d6ec" strokeWidth="5" strokeLinecap="round" />
      <circle className="lab-beacon-halo" cx={DOME.cx} cy={DOME.cy - DOME.ry - 78} r="36" fill="#EF002F" />
      <circle className="lab-beacon" cx={DOME.cx} cy={DOME.cy - DOME.ry - 78} r="11" fill="#EF002F" />

      {/* Module droit */}
      <rect x="1380" y={base - 120} width="110" height="124" rx="22" fill="url(#lab-steel)" stroke="#0b1b3f" strokeWidth="4" />
      {[0, 1].map((i) => (
        <circle key={i} className="porthole" cx="1435" cy={base - 88 + i * 50} r="15" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}

      {/* Dôme vitré */}
      <path d={`M${DOME.cx - DOME.rx} ${DOME.cy} A${DOME.rx} ${DOME.ry} 0 0 1 ${DOME.cx + DOME.rx} ${DOME.cy} Z`} fill="url(#dome)" stroke="#e8eef8" strokeWidth="6" />
      {[-0.55, 0, 0.55].map((k) => (
        <path key={k} d={`M${DOME.cx + k * DOME.rx} ${DOME.cy} Q${DOME.cx + k * DOME.rx * 0.85} ${DOME.cy - DOME.ry * 0.8} ${DOME.cx} ${DOME.cy - DOME.ry}`} stroke="#e8eef8" strokeOpacity="0.35" strokeWidth="3" fill="none" />
      ))}
      <path d={`M${DOME.cx - DOME.rx * 0.88} ${DOME.cy - DOME.ry * 0.35} A${DOME.rx * 0.88} ${DOME.ry * 0.88} 0 0 1 ${DOME.cx - DOME.rx * 0.2} ${DOME.cy - DOME.ry * 0.86}`} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Hologramme du drone en construction */}
      <g className="hologram" transform={`translate(${DOME.cx} ${DOME.cy - 190})`}>
        <ellipse cx="0" cy="62" rx="70" ry="12" fill="#5FD4FF" opacity="0.35" />
        <path d="M-40 62 L-70 -30 M40 62 L70 -30" stroke="#5FD4FF" strokeOpacity="0.25" strokeWidth="2" />
        <g className="holo-spin">
          <path d="M-70 0 C-70 -22 -30 -30 0 -30 C34 -30 64 -20 72 0 C64 20 34 28 0 28 C-30 28 -70 22 -70 0 Z" fill="#5FD4FF" fillOpacity="0.15" stroke="#9fe6ff" strokeWidth="3" />
          <path d="M-18 -30 L-10 -52 L22 -52 L28 -30" fill="none" stroke="#9fe6ff" strokeWidth="3" />
          <path d="M-70 -6 L-92 -24 M-70 6 L-92 24" stroke="#9fe6ff" strokeWidth="3" strokeLinecap="round" />
          <line className="holo-scan" x1="-80" y1="0" x2="80" y2="0" stroke="#ffffff" strokeWidth="2" />
        </g>
      </g>

      {/* Plateforme + feux de navigation */}
      <rect x="840" y={base - 6} width="680" height="84" rx="16" fill="url(#lab-deck)" stroke="#0b1b3f" strokeWidth="4" />
      <rect x="840" y={base - 6} width="680" height="10" rx="5" fill="#e8eef8" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} className="lab-light" cx={880 + i * 75} cy={base + 36} r="7" fill={["#EF002F", "#ffffff", "#5FD4FF"][i % 3]} style={{ animationDelay: `${(i % 3) * 0.3}s` }} />
      ))}

      {/* Panneau emblème en façade */}
      <g transform={`translate(${DOME.cx} ${base - 62})`}>
        <rect x="-74" y="-52" width="148" height="104" rx="14" fill="#ffffff" stroke="#0b1b3f" strokeWidth="4" />
        <image href={E.src} x={-50} y={-41} width={100} height={(100 * E.height) / E.width} />
      </g>

      {/* Module gauche (sas de sortie de la capsule) */}
      <rect x="872" y={base - 150} width="150" height="154" rx="26" fill="url(#lab-steel)" stroke="#0b1b3f" strokeWidth="4" />
      <rect x="872" y={base - 22} width="150" height="10" fill="#EF002F" />
      <circle className="porthole" cx="975" cy={base - 110} r="16" />
      <g transform={`translate(${LAB_HATCH.x} ${LAB_HATCH.y})`}>
        <circle r="40" fill="#061A4A" stroke="#0b1b3f" strokeWidth="4" />
        <g className="hatch-door">
          <circle r="34" fill="#c9d6ec" stroke="#0b1b3f" strokeWidth="4" />
          <circle r="22" fill="none" stroke="#0b1b3f" strokeOpacity="0.4" strokeWidth="3" />
          <circle r="6" fill="#0b1b3f" />
        </g>
        <circle className="hatch-light" r="46" fill="none" stroke="#5FD4FF" strokeWidth="3" />
      </g>

      {/* Bras robotisé 1 (pince) */}
      <g transform={`translate(962 ${base - 150})`}>
        <g className="arm-seg arm1-a">
          <rect x="-178" y="-12" width="184" height="24" rx="12" fill="url(#arm)" stroke="#0b1b3f" strokeWidth="4" transform="rotate(20)" />
          <g transform="translate(-169 -62)">
            <g className="arm-seg arm1-b">
              <rect x="-132" y="-10" width="138" height="20" rx="10" fill="url(#arm)" stroke="#0b1b3f" strokeWidth="4" transform="rotate(-8)" />
              <g transform="translate(-130 18)">
                <g className="gripper">
                  <path d="M0 0 L-24 -14 L-30 -4 M0 0 L-24 14 L-30 4" stroke="#0b1b3f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle r="9" fill="#EF002F" stroke="#0b1b3f" strokeWidth="3" />
                </g>
              </g>
            </g>
            <circle r="15" fill="#0b2a6b" stroke="#e8eef8" strokeWidth="4" />
          </g>
        </g>
        <circle r="20" fill="#0b2a6b" stroke="#e8eef8" strokeWidth="4" />
      </g>

      {/* Bras robotisé 2 (soudure), orienté vers le ventre du sous-marin */}
      <g transform={`translate(895 ${SEABED_Y - 60})`}>
        <g className="arm-seg arm2-a">
          <rect x="-150" y="-12" width="155" height="24" rx="12" fill="url(#arm)" stroke="#0b1b3f" strokeWidth="4" transform="rotate(8)" />
          <g transform="translate(-145 -20)">
            <g className="arm-seg arm2-b">
              <rect x="-110" y="-10" width="115" height="20" rx="10" fill="url(#arm)" stroke="#0b1b3f" strokeWidth="4" transform="rotate(25)" />
              <g transform="translate(-100 -46)">
                <path d="M4 0 L-16 -10 L-16 10 Z" fill="#0b1b3f" transform="rotate(25)" />
                <g className="sparks">
                  {[0, 60, 120, 180, 240, 300].map((a, i) => (
                    <path
                      key={a}
                      className="spark"
                      style={{ animationDelay: `${i * 0.07}s` }}
                      transform={`translate(-24 -11) rotate(${a})`}
                      d="M0 0 L20 0"
                      stroke={i % 2 ? "#5FD4FF" : "#ffffff"}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  ))}
                  <circle cx="-24" cy="-11" r="9" fill="#e6f9ff" className="spark-core" />
                </g>
              </g>
            </g>
            <circle r="14" fill="#0b2a6b" stroke="#e8eef8" strokeWidth="4" />
          </g>
        </g>
        <circle r="20" fill="#0b2a6b" stroke="#e8eef8" strokeWidth="4" />
      </g>
    </g>
  );
});
