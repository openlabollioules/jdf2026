"use client";

import type { CSSProperties } from "react";
import { describeChoices } from "@/config/choices";
import { fill, texts } from "@/config/texts";
import { sessionChoices, type DroneSession } from "@/lib/session/machine";
import { PrimaryButton } from "./PrimaryButton";

/** Met en valeur les mots en MAJUSCULES et le pouvoir inventé « … ». */
function highlight(sentence: string) {
  return sentence.split(/((?<!\p{L})\p{Lu}[\p{Lu}'’-]+(?:\s\p{Lu}[\p{Lu}'’-]+)*(?!\p{L})|«[^»]+»)/u).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="hl">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export function SummaryScreen({ session, onConfirm }: { session: DroneSession; onConfirm: () => void }) {
  const choices = sessionChoices(session);
  if (!choices) return null;
  const d = describeChoices(choices);
  const template = d.isCustomPower ? texts.summary.sentenceCustom : texts.summary.sentence;
  const sentence = fill(template, { animal: d.animal.summary, movement: d.movement.summary, power: d.power.summary });

  return (
    <section className="summary">
      <div className="summary-cards">
        {[d.animal, d.movement, d.power].map((o, i) => (
          <div key={i} className="summary-card" style={{ "--accent": o.color, "--i": i } as CSSProperties}>
            {o.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image} alt="" />
            ) : (
              <span className="choice-card-emoji">{o.emoji}</span>
            )}
            {i < 2 && (
              <span className="summary-plus" aria-hidden>
                +
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="summary-sentence">{highlight(sentence)}</p>
      <PrimaryButton onPress={onConfirm} className="pulse">
        {texts.summary.cta}
      </PrimaryButton>
    </section>
  );
}
