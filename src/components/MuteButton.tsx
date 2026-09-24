"use client";

import { useEffect, useState } from "react";
import { sound } from "@/lib/client/sound";

export function MuteButton() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(sound().isMuted());
    return sound().subscribe(setMuted);
  }, []);
  return (
    <button
      type="button"
      className="corner-btn corner-right"
      aria-label={muted ? "Activer le son" : "Couper le son"}
      aria-pressed={muted}
      onClick={() => sound().setMuted(!muted)}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
