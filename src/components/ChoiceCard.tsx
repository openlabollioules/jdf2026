"use client";

import type { CSSProperties } from "react";
import type { ChoiceOption } from "@/config/types";

interface Props {
  option: ChoiceOption;
  index: number;
  selected?: boolean;
  onChoose: () => void;
  size?: "lg" | "xl";
  variant?: "default" | "special";
}

/** Grande carte illustrée : un appui = un choix. */
export function ChoiceCard({ option, index, selected, onChoose, size = "lg", variant = "default" }: Props) {
  return (
    <button
      type="button"
      className={`choice-card choice-card-${size} choice-card-${variant}${selected ? " is-selected" : ""}`}
      style={{ "--accent": option.color, "--i": index } as CSSProperties}
      onClick={onChoose}
      aria-label={option.label}
    >
      <span className="choice-card-art" aria-hidden>
        {option.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={option.image} alt="" draggable={false} />
        ) : (
          <span className="choice-card-emoji">{option.emoji}</span>
        )}
      </span>
      <span className="choice-card-label">
        {option.label}
        {option.hint && <small>{option.hint}</small>}
      </span>
    </button>
  );
}
