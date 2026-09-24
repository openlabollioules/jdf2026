"use client";

import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { sound } from "@/lib/client/sound";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "xl" | "lg" | "md";
  /** Délai minimal entre deux appuis (anti double-clic). */
  cooldownMs?: number;
}

/** Gros bouton tactile. Ignore les appuis répétés pendant `cooldownMs`. */
export function PrimaryButton({ children, onPress, variant = "primary", size = "xl", cooldownMs = 800, className = "", ...rest }: Props) {
  const last = useRef(0);
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={() => {
        const now = performance.now();
        if (now - last.current < cooldownMs) return;
        last.current = now;
        sound().play("tap");
        onPress();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
