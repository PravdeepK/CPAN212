"use client";
import React, { useState, useEffect } from "react";

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

export default function Home() {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Fetch Word and Handle API Errors
  const fetchWord = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/word");

      // ✅ Check if response is OK before parsing JSON
      if (!res.ok) {
        console.error(`❌ API Error: ${res.status} ${res.statusText}`);
        setErrorMessage("❌ Failed to fetch word");
        return;
      }

      const data = await res.json();
      if (data.word) {
        console.log("✅ Secret Word:", data.word);
        setSecretWord(data.word);
        setGuesses([]);
        setGameOver(false);
        setWon(false);
        setCurrentGuess("");
      } else {
        console.error("❌ API Error: No word returned.");
        setErrorMessage("❌ No word available");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setErrorMessage("❌ Network error");
    } finally {
      setLoading(false);
    }
  };

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

  // ✅ Validate if the entered word is real
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
      console.error("❌ Validation error:", error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    if (e.target.value.length <= WORD_LENGTH) {
      setCurrentGuess(e.target.value.toUpperCase());
    }
  };

  const handleKeyPress = async (e) => {
    if (e.key === "Enter" && currentGuess.length === WORD_LENGTH) {
      setErrorMessage(""); // Clear previous error

      const isValidWord = await validateWord(currentGuess);
      if (!isValidWord) {
        setErrorMessage("❌ Not a valid word!");
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess("");

      if (currentGuess === secretWord) {
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.length >= MAX_TRIES) {
        setGameOver(true);
      }
    }
  };

  // ✅ Apply Colors to Tiles Based on Guess Accuracy
  const checkGuess = (guess) => {
    return guess.split("").map((letter, index) => {
      if (letter === secretWord[index]) return "bg-green-500 text-white"; // ✅ Correct position
      if (secretWord.includes(letter)) return "bg-yellow-500 text-black"; // ✅ Wrong position
      return "bg-gray-400 text-white"; // ❌ Not in word
    });
  };

  return (
    <div className="container">
      <h1 className="title">Wordle Clone</h1>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      {loading ? (
        <p className="loading">Loading word...</p>
      ) : (
        <>
          <div className="grid">
            {Array.from({ length: MAX_TRIES }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                  const letter = guesses[rowIndex]?.[colIndex] || "";
                  const styles = guesses[rowIndex]
                    ? checkGuess(guesses[rowIndex])[colIndex]
                    : "border-gray-400";

                  return (
                    <div key={colIndex} className={`cell ${styles}`}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <input
            type="text"
            value={currentGuess}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="input-box"
            maxLength={WORD_LENGTH}
            disabled={gameOver}
          />

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          {gameOver && (
            <p className={`game-over ${won ? "win-message" : ""}`}>
              {won ? "🎉 Congrats! You guessed the word!" : `Game Over! The word was ${secretWord}`}
            </p>
          )}

          <button onClick={fetchWord} className="restart-button">
            Restart Game
          </button>
        </>
      )}
    </div>
  );
}
