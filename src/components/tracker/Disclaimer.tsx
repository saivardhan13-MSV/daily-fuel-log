export function FooterDisclaimer() {
  return (
    <p className="disclaimer-footer">
      Daily Fuel Log gives general nutrition estimates for personal tracking only —
      it isn&apos;t medical, dietary, or fitness advice. Talk to a doctor or
      registered dietitian before changing your diet, especially if you have any
      health condition.
    </p>
  );
}

export function TargetsDisclaimer() {
  return (
    <div className="disclaimer-box">
      <strong>Not medical advice.</strong> These targets come from a standard
      formula (Mifflin-St Jeor) and general activity/goal multipliers — they&apos;re
      rough estimates, not personalized guidance, and don&apos;t account for
      medical history, medications, or individual metabolic differences. If you
      have a medical condition, are pregnant or nursing, or have a history of
      disordered eating, please consult a doctor or registered dietitian before
      using these numbers to guide your diet.
    </div>
  );
}
