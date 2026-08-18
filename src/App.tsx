import { useState, useRef } from "react";
import animeImg from "./assets/anime_peace.png";
import "./App.css";
import english5k from "./static/english_5k.json";

function App() {
  const [randomWord, setRandomWord] = useState("start");
  const [textInput, setTextInput] = useState("");
  let wordclass = "random-word-default";
  const inputRef = useRef<HTMLInputElement>(null);
  const [counter, setCounter] = useState(0);
  const voices = window.speechSynthesis.getVoices();
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

  /*const index = 6;
  if (voices.length > index) {
    voice = voices[index];
  }*/

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * english5k.words.length);
    return english5k.words[randomIndex];
  }

  function wordToSpeech(word: string) {
    window.speechSynthesis.cancel();

    const sentence = "spell " + word;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.volume = 1;
    utterance.pitch = 0.9;
    utterance.rate = 0.8;
    if (voice != null) {
      utterance.voice = voice ?? null;
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
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>
              info
            </button>
            <button type="button" className="header-button" onClick={() => wordToSpeech(randomWord)}>
              settings
            </button>
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
