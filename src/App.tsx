import { useState, useRef, useEffect } from "react";
//import logo from "./assets/anime_peace.png";
import penguin from "./assets/penguin.png";
import astolfo from "./assets/louie.png";
import "./App.css";
import english5k from "./static/english_5k.json";

const preload = new Image();
preload.src = astolfo;

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(
    speechSynthesis.getVoices()
  );

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
  const [streakCounter, setstreakCounter] = useState(0);
  const [correctCounter, setcorrectCounter] = useState(0);
  const [falseCounter, setfalseCounter] = useState(0);
  const [lastFalseWord, setlastFalseWord] = useState("-");
  const matching = randomWord.startsWith(textInput);
  const [logo, setLogo] = useState(penguin);
  const [openSettings, setOpenSettings] = useState(false);
  
  const [volume, setVolume] = useState(1);
  const [pitch, setPitch] = useState(1.05);
  const [rate, setRate] = useState(0.8);

  console.log(voice?.name);

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * english5k.words.length);
    return english5k.words[randomIndex];
  }

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    const sentence = "spell " + word;
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
      setstreakCounter(streakCounter + 1);
      setcorrectCounter(correctCounter + 1);
    } else {
      setstreakCounter(0);
      if (textInput.length > 0) {
        setfalseCounter(falseCounter + 1);
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
                  max="300"
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
                <select
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
                <label htmlFor="option1">Option X</label>
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
