import { progressIndex, PROGRESS_STEPS, type SessionStatus } from "@/lib/session/machine";

/** Indication très légère des étapes. */
export function ProgressDots({ status }: { status: SessionStatus }) {
  const current = progressIndex(status);
  if (current < 0) return null;
  return (
    <ol className="progress-dots" aria-label={`Étape ${current + 1} sur ${PROGRESS_STEPS.length}`}>
      {PROGRESS_STEPS.map((step, i) => (
        <li key={step} className={i < current ? "done" : i === current ? "current" : ""} />
      ))}
    </ol>
  );
}
