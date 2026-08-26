/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect } from "react";

// logos
import penguin from "./assets/penguin.webp";
import astolfo from "./assets/astolfo_bday.webp";
import persona from "./assets/persona.webp";

// beehive images
import beehive from "./assets/beehive.svg";
import beehive_10 from "./assets/beehive_10.svg";
import beehive_20 from "./assets/beehive_20.svg";
import beehive_30 from "./assets/beehive_30.svg";
import beehive_40 from "./assets/beehive_40.svg";
import beehive_50 from "./assets/beehive_50.svg";
import beehive_60 from "./assets/beehive_60.svg";
import beehive_70 from "./assets/beehive_70.svg";
import beehive_80 from "./assets/beehive_80.svg";
import beehive_90 from "./assets/beehive_90.svg";
import beehive_100 from "./assets/beehive_100.svg";
import beehive_110 from "./assets/beehive_110.svg";

import soundSpeaker from "./assets/sound-speaker.svg";

import english5k from "./static/english_5k.json";

import type { Dictionary } from "./types/dictionary.types";

import type { ClassicStats, XpStats } from "./types/stats.types";
import { DEFAULT_CLASSIC_STATS, DEFAULT_XP_STATS } from "./types/stats.types";
import * as speech from "./utils/speech.ts";
import { migrateOldStats } from "./utils/stat.migration";
import { useLocalStorage } from "./utils/local.storage.ts";

import "./App.css";

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

const MODES = {
  DEFAULT: "classic",
  XP: "XP",
} as const;

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

const XP_MODIFIERS = {
  [DICTIONARY_IDS.ENGLISH_5K]: 1,
  [DICTIONARY_IDS.ENGLISH_10K]: 1.25,
  [DICTIONARY_IDS.ENGLISH_25K]: 2.0,
  [DICTIONARY_IDS.SHAKESPEAREAN]: 1.25,
  [DICTIONARY_IDS.GERMAN_10K]: 1,
} as const;

const BASE_XP = 10;

const BEEHIVE = {
  0: beehive,
  10: beehive_10,
  20: beehive_20,
  30: beehive_30,
  40: beehive_40,
  50: beehive_50,
  60: beehive_60,
  70: beehive_70,
  80: beehive_80,
  90: beehive_90,
  100: beehive_100,
  110: beehive_110,
};

const preloadAstolfo = new Image();
preloadAstolfo.src = astolfo;
const preloadPersona = new Image();
preloadPersona.src = persona;

type DictionaryId = (typeof DICTIONARY_IDS)[keyof typeof DICTIONARY_IDS];

type Mode = (typeof MODES)[keyof typeof MODES];

/**
 * Return random feedback different from last used one.
 * @param messages
 * @param previous
 * @returns
 */
function getDifferentFeedback(messages: string[], previous: string) {
  const available = messages.filter((message) => message !== previous);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Calculate xp reward depending on the chosen dictionary.
 * @param dictionaryId
 * @returns
 */
function calculateXp(dictionaryId: DictionaryId) {
  return Math.round(BASE_XP * XP_MODIFIERS[dictionaryId]);
}

/**
 * Select random entry from given dictionary containing a word and its definition.
 * @param dictionary
 * @returns
 */
function getRandomWordAndDefinition(dictionary: Dictionary) {
  const randomIndex = Math.floor(Math.random() * dictionary.words.length);
  return dictionary.words[randomIndex];
}

/**
 * Returns whether the guess matches the answer. (case-insensitive)
 * @param guess - the player's input
 * @param answer - the random word
 * @returns true if guess equals answer (case-insensitive)
 */
function evaluateInput(guess: string, answer: string) {
  if (guess.toLowerCase() === answer.toLowerCase()) {
    return true;
  } else {
    return false;
  }
}

function App() {
  // speech
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>();

  // general game states
  const inputRef = useRef<HTMLInputElement>(null);
  const [randomWord, setRandomWord] = useLocalStorage("randomWord", "start");
  const [textInput, setTextInput] = useState("");
  const [definition, setDefinition] = useLocalStorage("definition", "");
  const [feedback, setFeedback] = useState("");

  // classic mode
  const [classicStats, setClassicStats] = useLocalStorage(
    "classicStats",
    DEFAULT_CLASSIC_STATS,
  );

  // xp mode
  const [xpStats, setXpStats] = useLocalStorage("xpStats", DEFAULT_XP_STATS);

  // UI
  const [lastResult, setLastResult] = useState<"correct" | "false" | "">("");
  const [logo, setLogo] = useState(penguin);
  const [openSettings, setOpenSettings] = useState(false);

  // configuration
  const [mode, setMode] = useLocalStorage<Mode>("mode", MODES.DEFAULT);
  const [dictionary, setDictionary] = useState<Dictionary>(english5k);
  const [dictionaryId, setDictionaryId] = useLocalStorage<DictionaryId>(
    "dictionaryId",
    DICTIONARY_IDS.ENGLISH_5K,
  );

  // settings
  const [preferredVoiceName, setPreferredVoiceName] = useLocalStorage<
    string | null
  >("preferredVoiceName", null);
  const [volume, setVolume] = useState(DEFAULT_SETTINGS.volume);
  const [pitch, setPitch] = useState(DEFAULT_SETTINGS.pitch);
  const [rate, setRate] = useState(DEFAULT_SETTINGS.rate);

  /* migrate old stats from localStorage */
  useEffect(() => {
    const { mergedClassicStats, mergedXpStats } = migrateOldStats(
      classicStats,
      xpStats,
    );
    setClassicStats(mergedClassicStats);
    setXpStats(mergedXpStats);
  }, []);

  /* initialize the voice with the preferred option once SpeechSynthesis API has loaded its available voices */
  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      setVoice(speech.initializeVoice(availableVoices, preferredVoiceName));
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices); // call updateVoice on voiceschanged (event from WEB speech API)

    //  clean up
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [preferredVoiceName]);

  // derived variables
  const matching = randomWord.toLowerCase().startsWith(textInput.toLowerCase()); // typed input matching so far
  const isCorrect = textInput.toLowerCase() === randomWord.toLowerCase(); // fully matching
  const targetWordClass = isCorrect ? "target-word is-correct" : "target-word";
  const modeClass = mode === MODES.XP ? "xp-mode" : "classic-mode";

  const level = Math.floor((Math.sqrt(9025 + 40 * xpStats.xp) - 95) / 10) + 1; // 50 -> 105 -> 165 -> 230 -> 300...
  const currentLevelXp = ((level - 1) * (5 * (level - 1) + 95)) / 2;
  const nextLevelXp = (level * (5 * level + 95)) / 2;
  const xpToNextLevel = nextLevelXp - xpStats.xp;
  const progressPercent =
    ((xpStats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const beehiveLevel = Math.min(Math.floor(level / 10) * 10, 110);
  const currentBeehive = BEEHIVE[beehiveLevel as keyof typeof BEEHIVE];

  function updateClassicStats(patch: Partial<ClassicStats>) {
    setClassicStats((current) => ({ ...current, ...patch }));
  }

  function updateXpStats(patch: Partial<XpStats>) {
    setXpStats((current) => ({ ...current, ...patch }));
  }

  /**
   * Speak the given word using the SpeechSynthesis API.
   * @param word
   */
  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    const sentence = word + ".";
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
   * Extract a random word from the current dictionary, update word and definition state, clear the text input, focus it and speak the word aloud.
   */
  function advanceToNextWord() {
    const newRandomWord = getRandomWordAndDefinition(dictionary);
    setRandomWord(newRandomWord.word);
    setDefinition(newRandomWord.definition);

    inputRef.current?.focus();
    setTextInput("");

    wordToSpeech(newRandomWord.word);
  }

  /**
   * Extract random entry from currently selected dictionary and update word and definition with its values.
   * Additionally, change false, correct and streakCounter depending on whether textInput matches the current randomWord.
   */
  function submitAnswer(
    guess: string,
    answer: string,
    mode: Mode,
    xpPenalty = true,
  ) {
    //const updatedStates = evaluateRound();

    const guessIsCorrect = evaluateInput(guess, answer);
    if (guessIsCorrect) {
      if (mode === MODES.DEFAULT) {
        const newStreak = classicStats.streakCounter + 1;
        const newBestStreak = Math.max(
          newStreak,
          classicStats.bestStreakCounter,
        );

        updateClassicStats({
          streakCounter: newStreak,
          correctCounter: classicStats.correctCounter + 1,
          bestStreakCounter: newBestStreak,
        });
      } else if (mode === MODES.XP) {
        const wordXp = calculateXp(dictionaryId);

        setFeedback((previous) =>
          getDifferentFeedback(CORRECT_FEEDBACK, previous),
        );
        setLastResult("correct");
        const newStreak = xpStats.streakCounter + 1;

        updateXpStats({
          streakCounter: newStreak,
          bestStreakCounter: Math.max(newStreak, xpStats.bestStreakCounter),
          correctCounter: xpStats.correctCounter + 1,
          xp: xpStats.xp + wordXp,
        });
      }
    } else {
      if (mode === MODES.DEFAULT) {
        let newFalseCounter = classicStats.falseCounter;
        let newLastFalseWord = classicStats.lastFalseWord;

        if (guess.length > 0) {
          newFalseCounter = classicStats.falseCounter + 1;
          newLastFalseWord = answer;
        }

        updateClassicStats({
          streakCounter: 0,
          falseCounter: newFalseCounter,
          lastFalseWord: newLastFalseWord,
        });
      } else if (mode === MODES.XP) {
        setFeedback("");
        setLastResult("false");

        let newFalseCounter = xpStats.falseCounter;
        let newLastFalseWord = xpStats.lastFalseWord;
        let newXp = xpStats.xp;

        if (xpPenalty) {
          newXp = Math.max(0, xpStats.xp - calculateXp(dictionaryId) * 0.3);
        }

        if (guess.length > 0) {
          newFalseCounter = xpStats.falseCounter + 1;
          newLastFalseWord = answer;
        }

        updateXpStats({
          streakCounter: 0,
          falseCounter: newFalseCounter,
          lastFalseWord: newLastFalseWord,
          xp: newXp,
        });
      }
    }

    advanceToNextWord();
  }

  /**
   * Import dictionary corresponding to given id
   * @param id
   * @returns
   */
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
      <header className="app-header">
        <div className="header-buttons">
          <button
            type="button"
            className="header-button"
            onClick={() => wordToSpeech(randomWord)}
          >
            info
          </button>
          <button
            type="button"
            className="header-button"
            onClick={() => setOpenSettings(!openSettings)}
          >
            settings
          </button>
        </div>
      </header>
      <div className="main-content">
        <div className="game-layout">
          <div className="definition-column">
            <div className="definition-box">
              <p>{definition}</p>
            </div>
          </div>
          <div className="center-column">
            <div className="game-column">
              <div className="hero">
                <img src={logo} className="logo" alt="anime peace sign" />
                <div className="main-heading-container">
                  <h1 className="main-heading">Spelling Bee</h1>
                  <img className="heading-bee" src={"bee.svg"} />
                </div>
              </div>
              <div className="word-panel">
                <p className={targetWordClass + " " + modeClass}>
                  {randomWord}
                </p>
                <button
                  type="button"
                  className="generate-button"
                  onClick={() => submitAnswer(textInput, randomWord, mode)}
                >
                  Generate random word
                </button>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAnswer(textInput, randomWord, mode);
                  }}
                >
                  <input
                    ref={inputRef}
                    enterKeyHint="enter"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className={
                      "text-input " +
                      (matching ? "matching" : "not-matching") +
                      " " +
                      modeClass
                    }
                    value={textInput}
                    onChange={(event) => {
                      const input = event.target.value;
                      setTextInput(input);

                      const lowerCaseInput = input.toLowerCase();

                      if (lowerCaseInput === "astolfo") {
                        setLogo(astolfo);
                      } else if (lowerCaseInput === "persona") {
                        setLogo(persona);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Control") {
                        wordToSpeech(randomWord);
                      }
                    }}
                  />
                </form>
                <button
                  type="button"
                  className="repeat-button"
                  onClick={() => {
                    wordToSpeech(randomWord);
                    inputRef.current?.focus();
                  }}
                >
                  <img src={soundSpeaker} alt="" />
                </button>
              </div>
            </div>
            <div className="stats-container">
              {mode === MODES.DEFAULT && (
                <div className="stats">
                  <p className="stat-line">
                    streak: {classicStats.streakCounter}
                  </p>
                  <p className="stat-line">
                    best streak: {classicStats.bestStreakCounter}
                  </p>
                  <p className="stat-line">
                    correct: {classicStats.correctCounter}
                  </p>
                  <p className="stat-line">
                    false: {classicStats.falseCounter}
                  </p>
                  <p className="stat-line">
                    last false word:
                    <br />
                    {classicStats.lastFalseWord}
                  </p>
                </div>
              )}

              {mode === MODES.XP && (
                <div className="stats-xp">
                  <div className="xp-panel-compact">
                    <p className="level">
                      Level: <b>{level}</b>
                    </p>
                    <div className="xp-bar">
                      <div
                        className={
                          "xp-bar-fill " +
                          (lastResult === "correct"
                            ? "last-correct"
                            : lastResult === "false"
                              ? "last-false"
                              : "")
                        }
                        style={{ width: progressPercent + "%" }}
                      ></div>
                    </div>
                    <p>
                      Total XP: <b>{xpStats.xp.toFixed(1)}</b>
                    </p>
                    <p>XP to next level: {xpToNextLevel.toFixed(1)}</p>
                  </div>
                  <p className="stat-line">streak: {xpStats.streakCounter}</p>
                  <p className="stat-line">
                    best streak: {xpStats.bestStreakCounter}
                  </p>
                  <p className="stat-line">correct: {xpStats.correctCounter}</p>
                  <p className="stat-line">false: {xpStats.falseCounter}</p>
                  <p className="stat-line">
                    last false word:
                    <br />
                    {xpStats.lastFalseWord}
                  </p>
                  <select
                    className="select"
                    id="difficulty"
                    value={dictionaryId}
                    onChange={async (event) => {
                      const newDictionaryId = event.target
                        .value as DictionaryId;
                      await handleDictionaryChange(newDictionaryId);
                      setLastResult("false");
                      advanceToNextWord();
                      updateXpStats({
                        xp: Math.max(
                          0,
                          xpStats.xp - 2 * XP_MODIFIERS[newDictionaryId],
                        ),
                      });
                    }}
                  >
                    <option value={DICTIONARY_IDS.ENGLISH_5K}>
                      Beginner (10 XP)
                    </option>
                    <option value={DICTIONARY_IDS.ENGLISH_10K}>
                      Medium (12.5 XP)
                    </option>
                    <option value={DICTIONARY_IDS.ENGLISH_25K}>
                      Advanced (20 XP)
                    </option>
                    <option value={DICTIONARY_IDS.SHAKESPEAREAN}>
                      Old English (12.5 XP)
                    </option>
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
          <div className="xp-column">
            {mode === MODES.XP && (
              <div className="xp-panel">
                <img className="beehive" src={currentBeehive}></img>
                <p className="level">
                  Level: <b>{level}</b>
                </p>
                <p>
                  Total XP: <b>{xpStats.xp.toFixed(1)}</b>
                </p>
                <p>XP to next level: {xpToNextLevel.toFixed(1)}</p>
                <div className="xp-bar">
                  <div
                    className={
                      "xp-bar-fill " +
                      (lastResult === "correct"
                        ? "last-correct"
                        : lastResult === "false"
                          ? "last-false"
                          : "")
                    }
                    style={{ width: progressPercent + "%" }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {openSettings && (
        <div
          className="overlay-backdrop"
          onClick={() => setOpenSettings(false)}
        >
          <div className="overlay" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h2>Settings</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setOpenSettings(false)}
              >
                ×
              </button>
            </div>
            <div className="settings-container">
              <div className="settings-option">
                <label htmlFor="volume">Volume: </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  className="slider"
                  id="volume"
                  onChange={(event) =>
                    setVolume(Number(event.target.value) / 100)
                  }
                />
                <button
                  type="button"
                  className="reset-button"
                  onClick={() => setVolume(DEFAULT_SETTINGS.volume)}
                >
                  reset to default
                </button>
              </div>
              <div className="settings-option">
                <label htmlFor="pitch">Pitch: </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={pitch * 100}
                  className="slider"
                  id="pitch"
                  onChange={(event) =>
                    setPitch(Number(event.target.value) / 100)
                  }
                />
                <button
                  type="button"
                  className="reset-button"
                  onClick={() => setPitch(DEFAULT_SETTINGS.pitch)}
                >
                  reset to default
                </button>
              </div>
              <div className="settings-option">
                <label htmlFor="rate">Rate: </label>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={rate * 100}
                  className="slider"
                  id="rate"
                  onChange={(event) =>
                    setRate(Number(event.target.value) / 100)
                  }
                />
                <button
                  type="button"
                  className="reset-button"
                  onClick={() => setRate(DEFAULT_SETTINGS.rate)}
                >
                  reset to default
                </button>
              </div>
              <div className="settings-option">
                <label htmlFor="voices">Voices:</label>
                <select
                  id="voices"
                  value={voice ? voices.indexOf(voice) : ""}
                  onChange={(event) => {
                    const selectedVoice = voices[Number(event.target.value)];

                    if (selectedVoice) {
                      setVoice(selectedVoice);
                      setPreferredVoiceName(selectedVoice.name);
                    }
                  }}
                >
                  {voices.map((v, index) => (
                    <option key={index} value={index}>
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
                  onChange={(event) =>
                    handleDictionaryChange(event.target.value as DictionaryId)
                  }
                >
                  <option value={DICTIONARY_IDS.ENGLISH_5K}>
                    English - 5k
                  </option>
                  <option value={DICTIONARY_IDS.ENGLISH_10K}>
                    English - 10k
                  </option>
                  <option value={DICTIONARY_IDS.ENGLISH_25K}>
                    English - 25k
                  </option>
                  <option value={DICTIONARY_IDS.SHAKESPEAREAN}>
                    English - Shakespearean
                  </option>
                  <option value={DICTIONARY_IDS.GERMAN_10K}>
                    German - 10k
                  </option>
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
