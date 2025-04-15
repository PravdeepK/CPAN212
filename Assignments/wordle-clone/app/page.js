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
  const [hasSavedResult, setHasSavedResult] = useState(false); // NEW

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
    if (!username || !secretWord || hasSavedResult) return;

    try {
      await addDoc(
        collection(db, "users", username, "games", difficulty.toString(), "entries"),
        {
          word: secretWord,
          result,
          timestamp: new Date(),
        }
      );
      setHasSavedResult(true); // Mark as saved
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

      setSecretWord(data.word);
      setGuesses(Array(MAX_TRIES).fill(""));
      setKeyStatuses({});
      setGameOver(false);
      setWon(false);
      setCurrentGuess("");
      setHasSavedResult(false); // RESET FLAG
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
    let tileColors = Array(difficulty).fill("bg-gray-400 text-white");

    guess.split("").forEach((letter, index) => {
      if (letter === secretWord[index]) {
        tileColors[index] = "bg-green-500 text-white";
      } else if (secretWord.includes(letter)) {
        tileColors[index] = "bg-yellow-500 text-black";
      }
    });

    return tileColors;
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

        let newKeyStatuses = { ...keyStatuses };
        currentGuess.split("").forEach((letter, index) => {
          if (letter === secretWord[index]) {
            newKeyStatuses[letter] = "bg-green-500 text-white";
          } else if (secretWord.includes(letter)) {
            if (newKeyStatuses[letter] !== "bg-green-500 text-white") {
              newKeyStatuses[letter] = "bg-yellow-500 text-black";
            }
          } else {
            newKeyStatuses[letter] = "bg-gray-400 text-white";
          }
        });

        setKeyStatuses(newKeyStatuses);
      }

      setCurrentGuess("");

      if (currentGuess === secretWord) {
        await saveGameResult("win");
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        await saveGameResult("lose");
        setGameOver(true);
      }
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

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && (
        <p className="game-over">
          {won
            ? "Congrats! You guessed the word!"
            : `Game Over! The word was ${secretWord}`}
        </p>
      )}

      <div className="flex flex-col gap-1 mt-2">
        <button
          onClick={fetchWord}
          className="restart-button"
        >
          Restart Game
        </button>

        <button
          onClick={() => router.push("/scoreboard")}
          className="scoreboard-button"
        >
          View Scoreboard
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
