import { useState, useRef, useEffect } from "react";
import type { Dictionary } from "./dictionary.types";
import penguin from "./assets/penguin.webp";
import astolfo from "./assets/astolfo_bday.webp";
import persona from "./assets/persona.webp";
import "./App.css";
import english5k from "./static/english_5k.json";
import * as speech from "./utils/speech.ts";

const preloadAstolfo = new Image();
preloadAstolfo.src = astolfo;
const preloadPersona = new Image();
preloadPersona.src = persona;

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

type DictionaryId = (typeof DICTIONARY_IDS)[keyof typeof DICTIONARY_IDS];

const DICTIONARIES = {
  "0": () => import("./static/english_5k.json"),
  "1": () => import("./static/english_10k.json"),
  "2": () => import("./static/english_25k.json"),
  "3": () => import("./static/english_shakespearean.json"),
  "4": () => import("./static/german_10k.json"),
};

const XP_MODIFIERS = {
  [DICTIONARY_IDS.ENGLISH_5K]: 1,
  [DICTIONARY_IDS.ENGLISH_10K]: 1.25,
  [DICTIONARY_IDS.ENGLISH_25K]: 2.0,
  [DICTIONARY_IDS.SHAKESPEAREAN]: 1.25,
  [DICTIONARY_IDS.GERMAN_10K]: 1,
} as const;

const MODES = {
  DEFAULT: "classic",
  XP: "XP",
} as const;

type Mode = (typeof MODES)[keyof typeof MODES];

const CORRECT_FEEDBACK = [
  "Good job!",
  "Nice!",
  "Well done!",
  "Excellent!",
  "Great work!",
  "Keep it up!",
  "Perfect!",
  "Nice one!",
];

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
    speech.PREFERRED_VOICES.map((name) => voices.find((voice) => voice.name === name)).find(
      (voice) => voice !== undefined,
    ) ?? voices[0]
  );
}

function getDifferentFeedback(messages: string[], previous: string) {
  const available = messages.filter((message) => message !== previous);
  return available[Math.floor(Math.random() * available.length)];
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
  const [randomWord, setRandomWord] = useLocalStorage("randomWord", "start");
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
  const [mode, setMode] = useLocalStorage<Mode>("mode", MODES.DEFAULT);
  const [openSettings, setOpenSettings] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_SETTINGS.volume);
  const [pitch, setPitch] = useState(DEFAULT_SETTINGS.pitch);
  const [rate, setRate] = useState(DEFAULT_SETTINGS.rate);
  const [dictionary, setDictionary] = useState<Dictionary>(english5k);
  const [dictionaryId, setDictionaryId] = useLocalStorage<DictionaryId>("dictionaryId", DICTIONARY_IDS.ENGLISH_5K);
  const [definition, setDefinition] = useLocalStorage("definition", "");

  const [xp, setXp] = useLocalStorage("xp", 0);
  //<p>XP to next level: <b>{(50 - (xp % 50)).toFixed(1)}</b></p>
  const level = Math.floor((Math.sqrt(9025 + 40 * xp) - 95) / 10) + 1; // 50 -> 105 -> 165 -> 230 -> 300...
  const currentLevelXp = ((level - 1) * (5 * (level - 1) + 95)) / 2;
  const nextLevelXp = (level * (5 * level + 95)) / 2;
  const xpToNextLevel = nextLevelXp - xp;
  const progressPercent = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  const [feedback, setFeedback] = useState("");
  const [lastFalseWordInXp, setLastFalseWordInXp] = useLocalStorage("lastFalseWordInXp", "-");
  const [lastResult, setLastResult] = useState<"correct" | "false" | "">("");
  const [xpStreakCounter, setXpStreakCounter] = useLocalStorage("xpStreakStreakCounter", 0);

  const modeClass = mode === MODES.XP ? "xp-mode" : "classic-mode";

  function calculateXp() {
    const baseXp = 10;
    const xp = Math.round(baseXp * XP_MODIFIERS[dictionaryId]);

    return xp;
  }

  function reduceXp(amount: number) {
    setXp((currentXp) => Math.max(0, currentXp - amount));
  }

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
  function generateRandomWord(xpPenalty = true) {
    if (wordClass === "text-input-correct") {
      if (mode === MODES.DEFAULT) {
        const newStreak = streakCounter + 1;

        setStreakCounter(newStreak);
        setCorrectCounter((current) => current + 1);

        if (newStreak > bestStreakCounter) {
          setBestStreakCounter(newStreak);
        }
      } else if (mode === MODES.XP) {
        const wordXp = calculateXp();
        setXp((current) => current + wordXp);
        setFeedback((previous) => getDifferentFeedback(CORRECT_FEEDBACK, previous));
        setLastResult("correct");
        const newStreak = xpStreakCounter + 1;
        setXpStreakCounter(newStreak);
      }
    } else {
      if (mode === MODES.DEFAULT) {
        setStreakCounter(0);
        if (textInput.length > 0) {
          setFalseCounter((current) => current + 1);
          setLastFalseWord(randomWord);
        }
      } else if (mode === MODES.XP) {
        if (xpPenalty) {
          setXpStreakCounter(0);
          let wordXp = calculateXp();
          wordXp = wordXp * 0.3;
          reduceXp(wordXp);
          setFeedback("");

          if (textInput.length > 0) {
            setLastFalseWordInXp(randomWord);
          }
        }
        setLastResult("false");
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
  async function handleDictionaryChange(id: DictionaryId) {
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
      <div className="flex column main-content-container">
        <div className="top-content">
          <div className="top-content-left">
            <div className="definition-box">
              <p>{definition}</p>
            </div>
          </div>
          <div className="top-content-middle">
            <div className="hero flex column no-gap">
              <img src={logo} id="logo" className="logo" alt="anime peace sign" />
              <div className="main-heading-container">
                <h1 className="main-heading">Spelling Bee</h1>
                <img className="heading-bee" src={"bee.svg"} />
              </div>
            </div>
            <div className="flex column container">
              <p className={wordClass + " " + modeClass}>{randomWord}</p>
              <button type="button" className="generator" onClick={() => generateRandomWord()}>
                Generate random word
              </button>
              <input
                ref={inputRef}
                className={"text-input " + (matching ? "matching" : "not-matching") + " " + modeClass}
                value={textInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setTextInput(value);
                  const lowerCasedValue = value.toLowerCase();
                  if (lowerCasedValue === "astolfo") {
                    setLogo(astolfo);
                  } else if (lowerCasedValue === "persona") {
                    setLogo(persona);
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
            </div>
          </div>
          <div className="top-content-right">
            {mode === MODES.XP && (
              <div className="xp-box bottom">
                <p className="level">
                  Level: <b>{level}</b>
                </p>
                <p>
                  Total XP: <b>{xp.toFixed(1)}</b>
                </p>
                <p>XP to next level: {xpToNextLevel.toFixed(1)}</p>
                <div className="bar">
                  <div
                    className={
                      "main-bar " +
                      (lastResult === "correct" ? "last-correct" : lastResult === "false" ? "last-false" : "")
                    }
                    style={{ width: progressPercent + "%" }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="stats-container">
          {mode === MODES.DEFAULT && (
            <div className="stats">
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
          )}

          {mode === MODES.XP && (
            <div className="stats-xp">
              <div className="bottom-xp-box">
                <p className="level">
                  Level: <b>{level}</b>
                </p>
                <p>
                  Total XP: <b>{xp.toFixed(1)}</b>
                </p>
                <p>XP to next level: {xpToNextLevel.toFixed(1)}</p>
                <div className="bar">
                  <div
                    className={
                      "main-bar " +
                      (lastResult === "correct" ? "last-correct" : lastResult === "false" ? "last-false" : "")
                    }
                    style={{ width: progressPercent + "%" }}
                  ></div>
                </div>
              </div>
              <p>streak: {xpStreakCounter}</p>
              <p>
                last false word:
                <br />
                {lastFalseWordInXp}
              </p>
              <select
                className="select"
                id="difficulty"
                value={dictionaryId}
                onChange={(event) => {
                  const newDictionaryId = event.target.value as DictionaryId;
                  handleDictionaryChange(newDictionaryId);
                  generateRandomWord(false);
                  reduceXp(2 * XP_MODIFIERS[newDictionaryId]);
                }}
              >
                <option value={DICTIONARY_IDS.ENGLISH_5K}>Beginner (10 XP)</option>
                <option value={DICTIONARY_IDS.ENGLISH_10K}>Medium (12.5 XP)</option>
                <option value={DICTIONARY_IDS.ENGLISH_25K}>Advanced (20 XP)</option>
                <option value={DICTIONARY_IDS.SHAKESPEAREAN}>Old English (12.5 XP)</option>
              </select>
            </div>
          )}
        </div>
        <select
          className="select"
          id="select-mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
        >
          <option value={MODES.DEFAULT}>Classic Mode</option>
          <option value={MODES.XP}>XP Mode</option>
        </select>
        <p className="feedback">{feedback}</p>
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
                  onChange={(event) => handleDictionaryChange(event.target.value as DictionaryId)}
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
