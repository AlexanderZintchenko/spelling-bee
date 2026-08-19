import { useState, useRef } from "react";
//import animeImg from "./assets/anime_peace.png";
//import animeImg from "./assets/penguin.png";
import animeImg from "./assets/louie.png";
import "./App.css";
import english5k from "./static/english_5k.json";

function initializeVoices(voices: SpeechSynthesisVoice[]) {
  console.log(voices);
  let voice = voices.find((voice) => voice.name === "Microsoft David - English (United States)");

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
  const [randomWord, setRandomWord] = useState("start");
  const [textInput, setTextInput] = useState("");
  let wordclass = "random-word-default";
  const inputRef = useRef<HTMLInputElement>(null);
  const [streakCounter, setstreakCounter] = useState(0);
  const [correctCounter, setcorrectCounter] = useState(0);
  const [falseCounter, setfalseCounter] = useState(0);
  const [lastFalseWord, setlastFalseWord] = useState("-");
  const voices = window.speechSynthesis.getVoices();
  const matching = randomWord.startsWith(textInput);

  const voice = initializeVoices(voices);

  console.log(voice?.name);

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * english5k.words.length);
    return english5k.words[randomIndex];
  }

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    const sentence = "spell " + word;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.volume = 1;
    utterance.pitch = 1.05;
    utterance.rate = 0.8;
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
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>
              settings
            </button>
          </div>
        </header>
        <div className="flex column">
          <div className="hero flex column less-gap">
            <img src={animeImg} id="logo" className="animeImg" alt="anime peace sign" />
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
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  generateRandomWord();
                } else if (event.key === "Alt") {
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
            <p>last false word:<br />{lastFalseWord}</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
