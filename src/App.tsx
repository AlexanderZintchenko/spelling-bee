import { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import animeImg from "./assets/anime_peace.png";
import "./App.css";
import english5k from "./static/english_5k.json";

function App() {
  const [randomWord, setRandomWord] = useState("start");
  const words = ["random1", "random2"];
  const [textInput, setTextInput] = useState("");
  let wordclass = "random-word-default";
  const inputRef = useRef<HTMLInputElement>(null);
  const [counter, setCounter] = useState(0);

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * english5k.words.length);
    return english5k.words[randomIndex];
  }

  const voices = window.speechSynthesis.getVoices();
  console.log(voices);

  const voice = voices.find((voice) => voice.name === "Microsoft George - English (United Kingdom)");

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);

    if (voice != null) {
      utterance.voice = voice ?? null;
    }

    if (voices.length > 6) {
      utterance.voice = voices[6];
    }

    window.speechSynthesis.speak(utterance);
  }

  function generateRandomWord() {
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
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>info</button>
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>settings</button>
          </div>
        </header>
        <div className="hero flex column">
          <img src={animeImg} id="logo" className="animeImg" alt="anime peace sign" />
          <h1 className="">Spelling Bee Prototype</h1>
        </div>

        <div className="flex column container">
          <div className={wordclass}>
            <p>{randomWord}</p>
          </div>

          <button type="button" className="generator" onClick={() => generateRandomWord()}>
            Generate random word
          </button>

          <div>
            <input
              ref={inputRef}
              className="textInput"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  if (wordclass === "random-word-correct") {
                    setCounter(counter + 1);
                  } else {
                    setCounter(0);
                  }
                  generateRandomWord();
                } else if (event.key === "Control") {
                  wordToSpeech(randomWord);
                }
              }}
            />
          </div>

          <button type="button" className="repeat-button" onClick={() => wordToSpeech(randomWord)}>
            ⟳
          </button>

          <div>
            <button type="button" className="counter">
              streak: {counter}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
