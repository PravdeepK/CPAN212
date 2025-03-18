"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const WORD_LENGTH = 5;
const MAX_TRIES = 6;
const KEYBOARD_LAYOUT = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

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
  const [keyStatuses, setKeyStatuses] = useState({});

  useEffect(() => {
    fetchWord();
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }

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
      document.documentElement.classList.toggle("dark", newMode);
      return newMode;
    });
  };

  const setUser = () => {
    localStorage.setItem("username", username);
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
        setKeyStatuses({});
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
    let tileColors = Array(WORD_LENGTH).fill("bg-gray-400 text-white"); // Default to gray

    guess.split("").forEach((letter, index) => {
      if (letter === secretWord[index]) {
        tileColors[index] = "bg-green-500 text-white"; // ✅ Correct position
      } else if (secretWord.includes(letter)) {
        tileColors[index] = "bg-yellow-500 text-black"; // 🟡 Wrong position
      }
    });

    return tileColors; // ✅ Only returns colors, does NOT update state
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

        // ✅ Update key colors separately to prevent re-render issues
        let newKeyStatuses = { ...keyStatuses };
        currentGuess.split("").forEach((letter, index) => {
          if (letter === secretWord[index]) {
            newKeyStatuses[letter] = "bg-green-500 text-white"; // ✅ Correct position
          } else if (secretWord.includes(letter)) {
            if (newKeyStatuses[letter] !== "bg-green-500 text-white") {
              newKeyStatuses[letter] = "bg-yellow-500 text-black"; // 🟡 Wrong position
            }
          } else {
            newKeyStatuses[letter] = "bg-gray-400 text-white"; // ❌ Not in word
          }
        });

        setKeyStatuses(newKeyStatuses);
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

  return (
    <div className="container">
      <h1 className="title">Wordle Clone</h1>
      <p className="welcome-text">Welcome, {username}!</p>
      <button onClick={() => router.push("/scoreboard")} className="scoreboard-button">View Scoreboard</button>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      <div className="grid">
        {guesses.map((guess, rowIndex) => {
          const tileColors = guess ? checkGuess(guess) : Array(WORD_LENGTH).fill("border-gray-400");

          return (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                const letter = guess[colIndex] || "";
                return <div key={colIndex} className={`cell ${tileColors[colIndex]}`}>{letter}</div>;
              })}
            </div>
          );
        })}
      </div>

      <input type="text" value={currentGuess} onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())} onKeyPress={handleKeyPress} className="input-box" maxLength={WORD_LENGTH} />

      <div className="keyboard">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.split("").map((key) => (
              <button key={key} className={`key ${keyStatuses[key] || ""}`}>
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && <p className="game-over">{won ? "🎉 Congrats! You guessed the word!" : `❌ Game Over! The word was ${secretWord}`}</p>}

      <button onClick={fetchWord} className="restart-button">Restart Game</button>
    </div>
  );
}
