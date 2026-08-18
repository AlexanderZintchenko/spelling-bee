import { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import english5k from './static/english_5k.json'

function App() {
  const [randomWord, setRandomWord] = useState("start")
  const words = ["random1", "random2"]
  const [textInput, setTextInput] = useState("")
  let wordclass = "random-word-default"
  const inputRef = useRef<HTMLInputElement>(null)
  const [counter, setCounter] = useState(0)

  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * english5k.words.length);
    return english5k.words[randomIndex];
  }

  const voices = window.speechSynthesis.getVoices();
  console.log(voices);

  const voice = voices.find(
    (voice) => voice.name === "Microsoft George - English (United Kingdom)"
  );

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
    wordclass = "random-word-correct"
  } else {
    wordclass = "random-word-default"
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Spelling Bee Prototype</h1>
        </div>

        <div className={wordclass}>
          <p>{randomWord}</p>
        </div>

        <button
          type="button"
          className="counter"
          onClick={() => generateRandomWord()}
        >
          generate random word
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
                  setCounter(counter+1);
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

      
          <button
            type="button"
            className="repeat-button"
            onClick={() => wordToSpeech(randomWord)}
          >
            ⟳
          </button>

          <div>
            <button
            type="button"
            className="repeat-button"
          >
          {counter}
          </button>
          </div>
      

      </section>

      <div className="ticks"></div>

      <div className="ticks"></div>
    </>
  )
}

export default App
