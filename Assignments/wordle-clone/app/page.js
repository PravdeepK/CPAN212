"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
} from "firebase/firestore";

const db = getFirestore();
const MAX_TRIES = 6;

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [difficulty, setDifficulty] = useState(5);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUsername(user.displayName || "Player");

        const savedTheme = localStorage.getItem("darkMode");
        const darkModeEnabled = savedTheme === "true";
        setDarkMode(darkModeEnabled);
        document.documentElement.classList.toggle("dark", darkModeEnabled);

        fetchWord();
      }
    });

    return () => unsubscribe();
  }, [difficulty]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  const saveGameResult = async (result) => {
    if (!username || !secretWord) return;

    try {
      await addDoc(
        collection(db, "users", username, "games", difficulty.toString(), "entries"),
        {
          word: secretWord,
          result,
          timestamp: new Date(),
        }
      );
    } catch (error) {
      console.error("Failed to save game result:", error);
    }
  };

  const fetchWord = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ length: difficulty }),
      });

      if (!res.ok) {
        setErrorMessage("Failed to fetch word");
        return;
      }

      const data = await res.json();

      if (!data.word || data.word.length !== difficulty) {
        setErrorMessage(
          `Word length mismatch! Expected ${difficulty} letters but got ${data.word.length}. Retrying...`
        );
        console.warn(
          `Retrying fetchWord because GPT returned wrong length: ${data.word}`
        );
        fetchWord();
        return;
      }

      setSecretWord(data.word.toUpperCase());
      setGuesses(Array(MAX_TRIES).fill(""));
      setKeyStatuses({});
      setGameOver(false);
      setWon(false);
      setCurrentGuess("");
    } catch (error) {
      setErrorMessage("Network error");
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
    } catch {
      return false;
    }
  };

  const checkGuess = (guess) => {
    const result = Array(difficulty).fill("bg-gray-400 text-white");
    const matched = Array(difficulty).fill(false);
    const secretLetters = secretWord.split("");

    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === secretLetters[i]) {
        result[i] = "bg-green-500 text-white";
        matched[i] = true;
      }
    }

    for (let i = 0; i < guess.length; i++) {
      if (result[i] === "bg-green-500 text-white") continue;

      const idx = secretLetters.findIndex(
        (letter, j) => letter === guess[i] && !matched[j]
      );

      if (idx !== -1) {
        result[i] = "bg-yellow-500 text-black";
        matched[idx] = true;
      }
    }

    return result;
  };

  const handleKeyPress = async (e) => {
    if (gameOver) return;

    if (e.key === "Enter" && currentGuess.length === difficulty) {
      setErrorMessage("");

      const isValidWord = await validateWord(currentGuess);
      if (!isValidWord) {
        setErrorMessage("Not a valid word! Please enter a real word.");
        return;
      }

      const newGuesses = [...guesses];
      const nextEmptyRow = newGuesses.findIndex((row) => row === "");
      if (nextEmptyRow !== -1) {
        newGuesses[nextEmptyRow] = currentGuess;
        setGuesses(newGuesses);

        const tileColors = checkGuess(currentGuess);

        let newKeyStatuses = { ...keyStatuses };
        currentGuess.split("").forEach((letter, index) => {
          const color = tileColors[index];
          if (
            color.includes("green") ||
            (color.includes("yellow") && newKeyStatuses[letter] !== "bg-green-500 text-white")
          ) {
            newKeyStatuses[letter] = color;
          } else if (!newKeyStatuses[letter]) {
            newKeyStatuses[letter] = color;
          }
        });

        setKeyStatuses(newKeyStatuses);
      }

      if (currentGuess === secretWord) {
        await saveGameResult("win");
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        await saveGameResult("lose");
        setGameOver(true);
      }

      setCurrentGuess("");
    }
  };

  const handleVirtualKey = async (key) => {
    if (gameOver) return;

    if (key === "ENTER") {
      await handleKeyPress({ key: "Enter" });
    } else if (key === "⌫") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < difficulty) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  if (!username) return null;

  return (
    <div className="flex flex-col justify-start items-center min-h-screen w-full text-center gap-3 px-2">
      <h1 className="title">Wordle Clone</h1>
      <p className="welcome-text">Welcome, {username}!</p>

      <div className="flex items-center gap-4">
        <label>Difficulty: {difficulty} letters</label>
        <input
          type="range"
          min="3"
          max="10"
          value={difficulty}
          onChange={(e) => setDifficulty(parseInt(e.target.value))}
        />
      </div>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      <div className="grid">
        {guesses.map((guess, rowIndex) => {
          const tileColors = guess
            ? checkGuess(guess)
            : Array(difficulty).fill("border-gray-400");

          return (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: difficulty }).map((_, colIndex) => {
                const letter = guess[colIndex] || "";
                return (
                  <div
                    key={colIndex}
                    className={`cell ${tileColors[colIndex]}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <input
        type="text"
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
        onKeyPress={handleKeyPress}
        className="input-box"
        maxLength={difficulty}
      />

      {/* Custom Keyboard */}
      <div className="keyboard">
        <div className="keyboard-row">
          {"QWERTYUIOP".split("").map((key) => (
            <button
              key={key}
              className={`key ${keyStatuses[key] || ""}`}
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row">
          {"ASDFGHJKL".split("").map((key) => (
            <button
              key={key}
              className={`key ${keyStatuses[key] || ""}`}
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row">
          <button
            className="key large-key"
            onClick={() => handleVirtualKey("ENTER")}
          >
            Enter
          </button>

          {"ZXCVBNM".split("").map((key) => (
            <button
              key={key}
              className={`key ${keyStatuses[key] || ""}`}
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}

          <button
            className="key large-key"
            onClick={() => handleVirtualKey("⌫")}
          >
            ⌫
          </button>
        </div>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && (
        <p className="game-over">
          {won
            ? "Congrats! You guessed the word!"
            : `Game Over! The word was ${secretWord}`}
        </p>
      )}

      {/* Bottom Buttons */}
      <div className="flex flex-col gap-1 mt-2">
        <button
          onClick={async () => {
            if (!won && gameOver) {
              await saveGameResult("lose");
            }
            fetchWord();
          }}
          className="restart-button"
        >
          Restart Game
        </button>

        <button
          onClick={() => router.push("/custom-word")}
          className="scoreboard-button"
        >
          Custom Word
        </button>

        <button
          onClick={() => router.push("/scoreboard")}
          className="scoreboard-button"
        >
          View Scoreboard
        </button>

        <button
          onClick={() => router.push("/multiplayer")}
          className="scoreboard-button"
        >
          Multiplayer Mode
        </button>

        <button
          className="logout-button"
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
