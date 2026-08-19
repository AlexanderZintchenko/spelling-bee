import { useState, useRef, useEffect } from "react";
import type { Dictionary } from "./dictionary.types";
//import logo from "./assets/anime_peace.png";
import penguin from "./assets/penguin.png";
import astolfo from "./assets/louie.png";
import "./App.css";
import english5k from "./static/english_5k.json";
//import english10k from "./static/english_10k.json";
//import english25k from "./static/english_25k.json";
//import englishShakespearean from "./static/english_shakespearean.json";
//import german10k from "./static/german_10k.json"

const preload = new Image();
preload.src = astolfo;

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);

    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function initializeVoices(voices: SpeechSynthesisVoice[]) {
  console.log(voices);
  let voice = voices.find((voice) => voice.name === "Google UK English Male");

  if (voice == null) {
    voice = voices.find((voice) => voice.name === "Microsoft David - English (United Kingdom)");
  }

  if (voice == null) {
    voice = voices.find((voice) => voice.name === "Microsoft George - English (United Kingdom)");
  }

  if (voice == null) {
    voice = voices.find((voice) => voice.name === "Microsoft Mark - English (United States)");
  }

  if (voice == null) {
    voice = voices[0];
  }

  return voice;
}

function App() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(speechSynthesis.getVoices());

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();

      setVoices(availableVoices);
      setVoice(initializeVoices(availableVoices));
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const [randomWord, setRandomWord] = useState("start");
  const [textInput, setTextInput] = useState("");
  let wordclass = "random-word-default";
  const inputRef = useRef<HTMLInputElement>(null);
  const [streakCounter, setStreakCounter] = useLocalStorage("streakCounter", 0);
  const [bestStreakCounter, setBestStreakCounter] = useLocalStorage("bestStreakCounter", 0);
  const [correctCounter, setCorrectCounter] = useLocalStorage("correctCounter", 0);
  const [falseCounter, setFalseCounter] = useLocalStorage("falseCounter", 0);
  const [lastFalseWord, setlastFalseWord] = useState("-");
  const matching = randomWord.startsWith(textInput);
  const [logo, setLogo] = useState(penguin);
  const [openSettings, setOpenSettings] = useState(false);

  const [volume, setVolume] = useState(1);
  const [pitch, setPitch] = useState(1.05);
  const [rate, setRate] = useState(0.8);
  const [dictionary, setDictionary] = useState<Dictionary>(english5k);
  const [dictionaryId, setDictionaryId] = useState("0");

  console.log(voice?.name);

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * dictionary.words.length);
    return dictionary.words[randomIndex];
  }

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    // eslint-disable-next-line no-useless-assignment
    let sentence = "";

    if (dictionaryId == "4") {
      sentence = "Buchstabiere " + word + "!";
    } else {
      sentence = "Spell " + word + "!";
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    if (voice != null) {
      utterance.voice = voice ?? null;
    }

    window.speechSynthesis.speak(utterance);
  }

  function generateRandomWord() {
    if (wordclass === "random-word-correct") {
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
        setlastFalseWord(randomWord);
      }
    }

    const newRandomWord = getRandomWord();
    setRandomWord(newRandomWord);

    inputRef.current?.focus();
    setTextInput("");

    wordToSpeech(newRandomWord);
  }

  if (textInput === randomWord) {
    wordclass = "random-word-correct";
  } else {
    wordclass = "random-word-default";
  }

  return (
    <>
      <section>
        <header className="flex row">
          <div className="">
            <p></p>
          </div>
          <div className="flex container row">
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>
              info
            </button>
            <button type="button" className="header-button" onClick={() => setOpenSettings(!openSettings)}>
              settings
            </button>
          </div>
        </header>
        <div className="flex column">
          <div className="hero flex column less-gap">
            <img src={logo} id="logo" className="logo" alt="anime peace sign" />
            <h1 className="">Spelling Bee Prototype</h1>
          </div>
          <div className="flex column container">
            <p className={wordclass}>{randomWord}</p>
            <button type="button" className="generator" onClick={() => generateRandomWord()}>
              Generate random word
            </button>
            <input
              ref={inputRef}
              className={`textInput ${matching ? "" : "notMatching"}`}
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
      </section>
      {openSettings && (
        <div className="overlay-backdrop" onClick={() => setOpenSettings(false)}>
          <div className="overlay" onClick={(event) => event.stopPropagation()}>
            <div className="container settings-header">
              <h2>Settings</h2>
              <button type="button" className="header-button close" onClick={() => setOpenSettings(false)}>
                ×
              </button>
            </div>
            <div className="flex column">
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
                <button className="button" onClick={() => setVolume(1)}>
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
                <button className="button" onClick={() => setPitch(1.05)}>
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
                <button className="button" onClick={() => setRate(0.8)}>
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
                  onChange={async (event) => {
                    setDictionaryId(event.target.value);
                    switch (event.target.value) {
                      case "0": {
                        const english5k = await import("./static/english_5k.json");
                        setDictionary(english5k.default);
                        break;
                      }

                      case "1": {
                        const english10k = await import("./static/english_10k.json");
                        setDictionary(english10k.default);
                        break;
                      }

                      case "2": {
                        const english25k = await import("./static/english_25k.json");
                        setDictionary(english25k.default);
                        break;
                      }

                      case "3": {
                        const englishShakespearean = await import("./static/english_shakespearean.json");
                        setDictionary(englishShakespearean.default);
                        break;
                      }

                      case "4": {
                        const german10k = await import("./static/german_10k.json");
                        setDictionary(german10k.default);
                        break;
                      }
                    }
                  }}
                >
                  <option value="0">English - 5k</option>
                  <option value="1">English - 10k</option>
                  <option value="2">English - 25k</option>
                  <option value="3">English - Shakespearean</option>
                  <option value="4">German - 10k</option>
                </select>
              </div>
              <div className="settings-option">
                <label htmlFor="option1">Sectret Option</label>
                <input id="option1" type="checkbox" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
