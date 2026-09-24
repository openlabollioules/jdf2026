"use client";

import { useState } from "react";
import type { ChoiceOption } from "@/config/types";
import { sound } from "@/lib/client/sound";
import { ChoiceCard } from "./ChoiceCard";

interface Props<Id extends string> {
  question: string;
  options: readonly ChoiceOption<Id>[];
  onChoose: (id: Id) => void;
  /** Carte supplémentaire (ex. « Invente ton pouvoir ») qui déclenche sa propre action. */
  extra?: { option: ChoiceOption; onPress: () => void };
}

/** Un seul choix important par écran. Petite animation de sélection avant de passer à la suite. */
export function ChoiceScreen<Id extends string>({ question, options, onChoose, extra }: Props<Id>) {
  const [chosen, setChosen] = useState<Id | null>(null);
  const count = options.length + (extra ? 1 : 0);

  return (
    <section className="choice-screen">
      <h1 className="question">{question}</h1>
      <div className={`choice-grid choice-grid-${count}`} data-chosen={chosen ? "true" : undefined}>
        {options.map((o, i) => (
          <ChoiceCard
            key={o.id}
            option={o}
            index={i}
            size={count <= 3 ? "xl" : "lg"}
            selected={chosen === o.id}
            onChoose={() => {
              if (chosen) return;
              setChosen(o.id);
              sound().play("tap");
              window.setTimeout(() => onChoose(o.id), 420);
            }}
          />
        ))}
        {extra && (
          <ChoiceCard
            option={extra.option}
            index={options.length}
            size={count <= 3 ? "xl" : "lg"}
            variant="special"
            onChoose={() => {
              if (chosen) return;
              sound().play("tap");
              extra.onPress();
            }}
          />
        )}
      </div>
    </section>
  );
}
