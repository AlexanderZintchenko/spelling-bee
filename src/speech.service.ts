export const warmupSpeechEngine = () => {
  if (!('speechSynthesis' in window)) return;

  // Wait for voice list to load
  const loadVoices = () => {
    return new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Chrome needs to wait for voiceschanged event
      const handleVoicesChanged = () => {
        voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        }
      };

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true });

      // Timeout after 2 seconds to avoid infinite wait
      setTimeout(() => resolve(speechSynthesis.getVoices()), 2000);
    });
  };

  // After voices loaded, play silent utterance to complete warmup
  loadVoices().then(() => {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    warmup.rate = 10;
    speechSynthesis.speak(warmup);
  });
};

/**
 * Play text pronunciation
 */
export const playPronunciation = (text, lang = 'en-US') => {
  return new Promise((resolve, reject) => {
    if (!text) {
      reject(new Error('No text to play'));
      return;
    }

    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any current playback
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};