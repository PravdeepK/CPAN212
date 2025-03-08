"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [guesses, setGuesses] = useState(Array(MAX_TRIES).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchWord();
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode);
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };

  const setUser = () => {
    setIsUsernameSet(true);
  };

  const fetchWord = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/word");
      if (!res.ok) return setErrorMessage("❌ Failed to fetch word");

      const data = await res.json();
      if (data.word) {
        console.log("✅ Secret Word:", data.word);
        setSecretWord(data.word);
        setGuesses(Array(MAX_TRIES).fill(""));
        setGameOver(false);
        setWon(false);
        setCurrentGuess("");
      }
    } catch (error) {
      setErrorMessage("❌ Network error");
    } finally {
      setLoading(false);
    }
  };

  const validateWord = async (word) => {
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      return data.valid;
    } catch (error) {
      return false;
    }
  };

  const checkGuess = (guess) => {
    return guess.split("").map((letter, index) => {
      if (letter === secretWord[index]) return "bg-green-500 text-white";
      if (secretWord.includes(letter)) return "bg-yellow-500 text-black";
      return "bg-gray-400 text-white";
    });
  };

  const handleKeyPress = async (e) => {
    if (e.key === "Enter" && currentGuess.length === WORD_LENGTH) {
      setErrorMessage("");

      const isValidWord = await validateWord(currentGuess);
      if (!isValidWord) {
        setErrorMessage("❌ Not a valid word! Please enter a real word.");
        return;
      }

      const newGuesses = [...guesses];
      const nextEmptyRow = newGuesses.findIndex((row) => row === "");
      if (nextEmptyRow !== -1) {
        newGuesses[nextEmptyRow] = currentGuess;
        setGuesses(newGuesses);
      }

      setCurrentGuess("");

      if (currentGuess === secretWord) {
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        setGameOver(true);
      }
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="container">
        <h1 className="title">ENTER YOUR USERNAME</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-box"
          placeholder="YOUR NAME"
        />
        <button onClick={setUser} className="start-button">Start Game</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">Wordle Clone</h1>
      <button onClick={() => router.push("/scoreboard")} className="scoreboard-button">View Scoreboard</button>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      <div className="grid">
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
              const letter = guess[colIndex] || "";
              const styles = guess ? checkGuess(guess)[colIndex] : "border-gray-400";
              return <div key={colIndex} className={`cell ${styles}`}>{letter}</div>;
            })}
          </div>
        ))}
      </div>

      <input type="text" value={currentGuess} onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())} onKeyPress={handleKeyPress} className="input-box" maxLength={WORD_LENGTH} />

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && <p className="game-over">{won ? "🎉 Congrats! You guessed the word!" : `❌ Game Over! The word was ${secretWord}`}</p>}

      <button onClick={fetchWord} className="restart-button">Restart Game</button>
    </div>
  );
}
