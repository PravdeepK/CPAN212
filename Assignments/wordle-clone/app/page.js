"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const db = getFirestore();
const MAX_TRIES = 6;
const KEYBOARD_LAYOUT = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState(null); // null initially to prevent early rendering
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
        if (savedTheme === "true") {
          setDarkMode(true);
          document.documentElement.classList.add("dark");
        }

        fetchWord();
      }
    });

    return () => unsubscribe();
  }, [difficulty]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    localStorage.setItem("darkMode", newMode);
    document.documentElement.classList.toggle("dark", newMode);
    setDarkMode(newMode);
  };

  const fetchWord = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ length: difficulty }),
      });      
      if (!res.ok) return setErrorMessage("Failed to fetch word");

      const data = await res.json();
      if (data.word) {
        if (data.word.length !== difficulty) {
          setErrorMessage(`Expected ${difficulty}-letter word, but got ${data.word.length}. Please try again.`);
          console.warn(`Mismatch: received "${data.word}"`);
          return;
        }

        setSecretWord(data.word);
        console.log(`Answer (${data.word.length} letters): ${data.word}`);
        setGuesses(Array(MAX_TRIES).fill(""));
        setKeyStatuses({});
        setGameOver(false);
        setWon(false);
        setCurrentGuess("");
      }
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
    } catch (error) {
      return false;
    }
  };

  const saveGameResult = async (result) => {
    const user = auth.currentUser;
    if (!user || !user.displayName) return;

    const username = user.displayName;
    const gamesRef = collection(db, "users", username, "games", difficulty.toString(), "entries");

    await addDoc(gamesRef, {
      result,
      word: secretWord,
      difficulty,
      timestamp: new Date(),
    });

    const q = query(gamesRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const extraGames = snapshot.docs.slice(10);
    for (const gameDoc of extraGames) {
      await deleteDoc(doc(db, "users", username, "games", difficulty.toString(), "entries", gameDoc.id));
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
        setWon(true);
        setGameOver(true);
        await saveGameResult("win");
      } else if (newGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        setGameOver(true);
        await saveGameResult("lose");
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

  if (!username) return null; // prevent UI flicker during auth

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full text-center gap-6">
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

      <button onClick={() => router.push("/scoreboard")} className="scoreboard-button">
        View Scoreboard
      </button>

      <button
        className="scoreboard-button"
        onClick={async () => {
          await signOut(auth);
          router.replace("/login");
        }}
      >
        Logout
      </button>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      <div className="grid">
        {guesses.map((guess, rowIndex) => {
          const tileColors = guess ? checkGuess(guess) : Array(difficulty).fill("border-gray-400");

          return (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: difficulty }).map((_, colIndex) => {
                const letter = guess[colIndex] || "";
                return (
                  <div key={colIndex} className={`cell ${tileColors[colIndex]}`}>
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

      <div className="keyboard">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.split("").map((key) => (
              <button key={key} className={`key ${keyStatuses[key] || ""}`} onClick={() => handleVirtualKey(key)}>
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="keyboard-row">
          <button className="key large-key" onClick={() => handleVirtualKey("ENTER")}>Enter</button>
          <button className="key large-key" onClick={() => handleVirtualKey("⌫")}>⌫</button>
        </div>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && (
        <p className="game-over">
          {won ? "Congrats! You guessed the word!" : `Game Over! The word was ${secretWord}`}
        </p>
      )}

      <button onClick={fetchWord} className="restart-button">
        Restart Game
      </button>
    </div>
  );
}
