export const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Male",
  "Google UK English Female",
  "Microsoft David - English (United Kingdom)",
  "Microsoft George - English (United Kingdom)",
  "Microsoft Mark - English (United States)",
];

/**
 * Select first available voice from preferred voices and falls back to first available voice if none is found.
 * @param availableVoices - available voices from browsers SpeechSynthesis API.
 * @returns the first matching voice from preferred voices or the the first available voice.
 */
export function initializeVoice(
  availableVoices: SpeechSynthesisVoice[],
  preferredVoiceName?: string | null,
) {
  if (preferredVoiceName != null) {
    const userChoice = availableVoices.find(
      (voice) => voice.name === preferredVoiceName,
    );

    if (userChoice !== undefined) {
      return userChoice;
    }
  }
  return (
    PREFERRED_VOICES.map((name) =>
      availableVoices.find((voice) => voice.name === name),
    ).find((voice) => voice !== undefined) ?? availableVoices[0]
  );
}
