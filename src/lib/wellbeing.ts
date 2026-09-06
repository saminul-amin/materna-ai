export interface WellbeingEntry {
  mood: number;
  stress: number;
  sleep: number;
  recordedAt: string | Date;
}

/** Gentle, non-diagnostic pattern check on recent check-ins. */
export function wellbeingPattern(entries: WellbeingEntry[]) {
  const sorted = [...entries].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const recent = sorted.slice(-3);
  if (recent.length < 3) return { concern: false, message: "Keep checking in regularly so the wellbeing view can show you a trend." };
  const avg = (k: keyof WellbeingEntry) => recent.reduce((s, e) => s + (e[k] as number), 0) / recent.length;
  const lowMood = avg("mood") <= 2.5;
  const highStress = avg("stress") >= 3.7;
  const poorSleep = avg("sleep") <= 2.5;
  if (lowMood || highStress || poorSleep) {
    const parts = [lowMood && "lower mood", highStress && "higher stress", poorSleep && "poorer sleep"].filter(Boolean).join(", ");
    return {
      concern: true,
      message: `Your recent wellbeing responses (${parts}) suggest that it may be helpful to discuss how you are feeling with a qualified healthcare professional or a trusted person.`,
    };
  }
  return { concern: false, message: "Your recent check-ins look steady. Keep looking after yourself and reach out to someone you trust whenever you need to." };
}
