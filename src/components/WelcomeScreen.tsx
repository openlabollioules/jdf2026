"use client";

import { texts } from "@/config/texts";
import { BrandMark } from "./BrandHeader";
import { NavalDroneBlueprint } from "./NavalDroneBlueprint";
import { PrimaryButton } from "./PrimaryButton";

export function WelcomeScreen({ onStart, eventName }: { onStart: () => void; eventName: string }) {
  return (
    <section className="welcome">
      <div className="welcome-text">
        <div className="brand-plate">
          <BrandMark eventName={eventName} size="lg" />
        </div>
        <h1 className="welcome-title">{texts.welcome.title}</h1>
        <span className="title-rule" aria-hidden />
        <p className="welcome-subtitle">{texts.welcome.subtitle}</p>
        <PrimaryButton onPress={onStart} className="pulse">
          {texts.welcome.cta}
        </PrimaryButton>
      </div>
      <NavalDroneBlueprint className="welcome-art" />
    </section>
  );
}
