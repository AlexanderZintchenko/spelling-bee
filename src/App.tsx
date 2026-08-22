import { useState, useRef, useEffect } from "react";
import type { Dictionary } from "./dictionary.types";
import penguin from "./assets/penguin.webp";
import astolfo from "./assets/astolfo_bday.webp";
import "./App.css";
import english5k from "./static/english_5k.json";
import * as speech from "./utils/speech.ts"

const preload = new Image();
preload.src = astolfo;

const DEFAULT_SETTINGS = {
  volume: 0.5,
  pitch: 1,
  rate: 0.75,
};

const DICTIONARY_IDS = {
  ENGLISH_5K: "0",
  ENGLISH_10K: "1",
  ENGLISH_25K: "2",
  SHAKESPEAREAN: "3",
  GERMAN_10K: "4",
} as const;

const DICTIONARIES = {
  "0": () => import("./static/english_5k.json"),
  "1": () => import("./static/english_10k.json"),
  "2": () => import("./static/english_25k.json"),
  "3": () => import("./static/english_shakespearean.json"),
  "4": () => import("./static/german_10k.json"),
};

/**
 * Store react state in localStorage so they persist across page reloads.
 * @param key - the localStorage key.
 * @param initialValue - the default value used if no stored value exists.
 * @returns state variable corresponding to the specified key with its setter function.
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue !== null ? JSON.parse(storedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

/**
 * Selects first available voice from preferred voices and falls back to first available voice if none is found.
 * @param voices - available voices from browsers SpeechSynthesis API.
 * @returns the first matching voice from preferred voices or the the first available voice.
 */
function initializeVoice(voices: SpeechSynthesisVoice[]) {
  console.log(voices);
  return (
    speech.PREFERRED_VOICES.map((name) => voices.find((voice) => voice.name === name)).find((voice) => voice !== undefined) ??
    voices[0]
  );
}

function App() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>();

  /* Initialize the voice once SpeechSynthesis API has loaded its available voices */
  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      setVoice(initializeVoice(availableVoices));
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices); // call updateVoice on voiceschanged (event from WEB speech API)

    //  clean up
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  // randomWord, textInput and comparisons
  const inputRef = useRef<HTMLInputElement>(null);
  const [randomWord, setRandomWord] = useState("start");
  const [textInput, setTextInput] = useState("");
  const isCorrect = textInput.toLowerCase() === randomWord.toLowerCase();
  const wordClass = isCorrect ? "text-input-correct" : "text-input-not-correct";
  const matching = randomWord.toLowerCase().startsWith(textInput.toLowerCase());

  const [streakCounter, setStreakCounter] = useLocalStorage("streakCounter", 0);
  const [bestStreakCounter, setBestStreakCounter] = useLocalStorage("bestStreakCounter", 0);
  const [correctCounter, setCorrectCounter] = useLocalStorage("correctCounter", 0);
  const [falseCounter, setFalseCounter] = useLocalStorage("falseCounter", 0);
  const [lastFalseWord, setLastFalseWord] = useLocalStorage("lastFalseWord", "-");
  const [logo, setLogo] = useState(penguin);
  const [openSettings, setOpenSettings] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_SETTINGS.volume);
  const [pitch, setPitch] = useState(DEFAULT_SETTINGS.pitch);
  const [rate, setRate] = useState(DEFAULT_SETTINGS.rate);
  const [dictionary, setDictionary] = useState<Dictionary>(english5k);
  const [dictionaryId, setDictionaryId] = useState<string>(DICTIONARY_IDS.ENGLISH_5K);
  const [definition, setDefinition] = useState("");

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * dictionary.words.length);
    return dictionary.words[randomIndex];
  }

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    // eslint-disable-next-line no-useless-assignment
    let sentence = "";

    // maybe remove, was initially used to add "spell" or "buchstabiere" before word
    if (dictionaryId === DICTIONARY_IDS.GERMAN_10K) {
      sentence = "" + word + "!";
    } else {
      sentence = "" + word + "!";
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    if (voice != null) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Extract random entry from currently selected dictionary and update word and definition with its values.
   * Additionally, change false, correct and streakCounter depending on whether textInput matches the current randomWord.
   */
  function generateRandomWord() {
    if (wordClass === "text-input-correct") {
      const newStreak = streakCounter + 1;

      setStreakCounter(newStreak);
      setCorrectCounter((current) => current + 1);

      if (newStreak > bestStreakCounter) {
        setBestStreakCounter(newStreak);
      }
    } else {
      setStreakCounter(0);

      if (textInput.length > 0) {
        setFalseCounter((current) => current + 1);
        setLastFalseWord(randomWord);
      }
    }

    const newRandomWord = getRandomWord();
    setRandomWord(newRandomWord.word);
    setDefinition(newRandomWord.definition);

    inputRef.current?.focus();
    setTextInput("");

    wordToSpeech(newRandomWord.word);
  }

  /* Import DICTIONARY corresponding to given DICTIONARY_ID */
  async function handleDictionaryChange(id: string) {
    setDictionaryId(id);

    const loadDictionary = DICTIONARIES[id as keyof typeof DICTIONARIES];

    if (!loadDictionary) {
      return;
    }

    const module = await loadDictionary();
    setDictionary(module.default);
  }

  return (
    <>
      <header className="flex row-right">
        <div className="flex container row">
          <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>
            info
          </button>
          <button type="button" className="header-button" onClick={() => setOpenSettings(!openSettings)}>
            settings
          </button>
        </div>
      </header>
      <div className="flex row">
        <div className="left">
          <div className="definition-box">
            <p>{definition}</p>
          </div>
        </div>
        <div className="main-content">
          <div className="hero flex column less-gap">
            <img src={logo} id="logo" className="logo" alt="anime peace sign" />
            <h1 >Spelling Bee</h1>
          </div>
          <div className="flex column container">
            <p className={wordClass}>{randomWord}</p>
            <button type="button" className="generator" onClick={() => generateRandomWord()}>
              Generate random word
            </button>
            <input
              ref={inputRef}
              className={"text-input " + (matching ? "matching" : "not-matching")}
              value={textInput}
              onChange={(event) => {
                const value = event.target.value;
                setTextInput(value);
                const lowerCasedValue = value.toLowerCase();
                if (lowerCasedValue === "astolfo") {
                  setLogo(astolfo);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  generateRandomWord();
                } else if (event.key === "Control") {
                  wordToSpeech(randomWord);
                }
              }}
            />
            <button type="button" className="repeat-button" onClick={() => wordToSpeech(randomWord)}>
              🕪
            </button>
            <p className="streakCounter">streak: {streakCounter}</p>
            <p className="streakCounter">best streak: {bestStreakCounter}</p>
            <p className="streakCounter">correct: {correctCounter}</p>
            <p className="streakCounter">false: {falseCounter}</p>
            <p>
              last false word:
              <br />
              {lastFalseWord}
            </p>
          </div>
        </div>
        <div className="right"></div>
      </div>
      {openSettings && (
        <div className="overlay-backdrop" onClick={() => setOpenSettings(false)}>
          <div className="overlay" onClick={(event) => event.stopPropagation()}>
            <div className="container settings-header">
              <h2>Settings</h2>
              <button type="button" className="close-button" onClick={() => setOpenSettings(false)}>
                ×
              </button>
            </div>
            <div className="flex column settings-container">
              <div className="settings-option slider-option">
                <label htmlFor="volume">Volume: </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  className="slider"
                  id="volume"
                  onChange={(event) => setVolume(Number(event.target.value) / 100)}
                />
                <button className="button" onClick={() => setVolume(DEFAULT_SETTINGS.volume)}>
                  reset to default
                </button>
              </div>
              <div className="settings-option slider-option">
                <label htmlFor="pitch">Pitch: </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={pitch * 100}
                  className="slider"
                  id="pitch"
                  onChange={(event) => setPitch(Number(event.target.value) / 100)}
                />
                <button className="button" onClick={() => setPitch(DEFAULT_SETTINGS.pitch)}>
                  reset to default
                </button>
              </div>
              <div className="settings-option slider-option">
                <label htmlFor="rate">Rate: </label>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={rate * 100}
                  className="slider"
                  id="rate"
                  onChange={(event) => setRate(Number(event.target.value) / 100)}
                />
                <button className="button" onClick={() => setRate(DEFAULT_SETTINGS.rate)}>
                  reset to default
                </button>
              </div>
              <div className="settings-option">
                <label htmlFor="voices">Voices:</label>
                <select
                  id="voices"
                  value={voice?.name ?? ""}
                  onChange={(event) => {
                    const selectedVoice = voices.find((v) => v.name === event.target.value);

                    if (selectedVoice) {
                      setVoice(selectedVoice);
                    }
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="settings-option">
                <label htmlFor="dictionaries">Dictionary:</label>
                <select
                  id="dictionaries"
                  value={dictionaryId}
                  onChange={(event) => handleDictionaryChange(event.target.value)}
                >
                  <option value={DICTIONARY_IDS.ENGLISH_5K}>English - 5k</option>
                  <option value={DICTIONARY_IDS.ENGLISH_10K}>English - 10k</option>
                  <option value={DICTIONARY_IDS.ENGLISH_25K}>English - 25k</option>
                  <option value={DICTIONARY_IDS.SHAKESPEAREAN}>English - Shakespearean</option>
                  <option value={DICTIONARY_IDS.GERMAN_10K}>German - 10k</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
