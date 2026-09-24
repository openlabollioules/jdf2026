"use client";

import { useState } from "react";
import { customPowerCard, powers, type PowerChoice } from "@/config/choices";
import { texts } from "@/config/texts";
import { ChoiceScreen } from "./ChoiceScreen";
import { CustomPowerForm } from "./CustomPowerForm";

/** Choix du super pouvoir : cartes proposées + champ libre « Invente ton pouvoir ». */
export function PowerScreen({ initialCustom, onChoose }: { initialCustom?: string; onChoose: (power: PowerChoice, customPower?: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <ChoiceScreen
        question={texts.questions.power}
        options={powers}
        onChoose={(id) => onChoose(id)}
        extra={{ option: customPowerCard, onPress: () => setEditing(true) }}
      />
      {editing && (
        <CustomPowerForm
          initial={initialCustom}
          onCancel={() => setEditing(false)}
          onSubmit={(text) => onChoose("custom", text)}
        />
      )}
    </>
  );
}
