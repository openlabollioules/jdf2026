"use client";

import { useState } from "react";
import type { ChoiceOption } from "@/config/choices";
import { texts } from "@/config/texts";
import { ChoiceScreen } from "./ChoiceScreen";
import { CustomChoiceForm } from "./CustomChoiceForm";

export function CustomChoiceScreen<Id extends string>({ kind, options, customCard, initialCustom, onChoose }: {
  kind: "animal" | "movement" | "power";
  options: readonly ChoiceOption<Id>[];
  customCard: ChoiceOption<"custom">;
  initialCustom?: string;
  onChoose: (id: Id | "custom", custom?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <ChoiceScreen
        question={texts.questions[kind]}
        options={options}
        onChoose={(id) => onChoose(id)}
        extra={{ option: customCard, onPress: () => setEditing(true) }}
      />
      {editing && (
        <CustomChoiceForm
          kind={kind}
          initial={initialCustom}
          onCancel={() => setEditing(false)}
          onSubmit={(text) => onChoose("custom", text)}
        />
      )}
    </>
  );
}
