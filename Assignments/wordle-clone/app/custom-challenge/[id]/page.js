"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { auth } from "../../../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const db = getFirestore();
const MAX_TRIES = 6;

export default function CustomChallengePage() {
  const router = useRouter();
  const { id } = useParams();
  const [username, setUsername] = useState(null);
  const [secretWord, setSecretWord] = useState("");
  const [guesses, setGuesses] = useState(Array(MAX_TRIES).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [keyStatuses, setKeyStatuses] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUsername(user.displayName || "Player");

      const theme = localStorage.getItem("darkMode") === "true";
      setDarkMode(theme);
      document.documentElement.classList.toggle("dark", theme);

      const docRef = doc(db, "customChallenges", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSecretWord(docSnap.data().word.toUpperCase());
      } else {
        setChallengeExpired(true);
      }
    });

    return () => unsubscribe();
  }, [id]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.documentElement.classList.toggle("dark", newMode);
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

  const saveResult = async (result) => {
    if (!username || !secretWord) return;

    await addDoc(
      collection(db, "users", username, "games", "custom", "entries"),
      {
        word: secretWord,
        result,
        timestamp: new Date(),
      }
    );

    await deleteDoc(doc(db, "customChallenges", id));
  };

  const checkGuess = (guess) => {
    const result = Array(secretWord.length).fill("bg-gray-400 text-white");
    const matched = Array(secretWord.length).fill(false);
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

    if (e.key === "Enter" && currentGuess.length === secretWord.length) {
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
        const newKeyStatuses = { ...keyStatuses };
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
        await saveResult("win");
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        await saveResult("lose");
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
    } else if (currentGuess.length < secretWord.length) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  if (challengeExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center">
        <h1 className="title text-red-500">Challenge Expired</h1>
        <p className="text-white">This challenge link has already been used or does not exist.</p>
        <button className="restart-button" onClick={() => router.push("/")}>
          Back to Game
        </button>
      </div>
    );
  }

  if (!secretWord || !username) return null;

  return (
    <div className="flex flex-col justify-start items-center min-h-screen w-full text-center gap-3 px-2">
      <h1 className="title">Custom Challenge</h1>

      <label className="dark-mode-switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider"></span>
      </label>

      <div className="grid">
        {guesses.map((guess, rowIndex) => {
          const tileColors = guess
            ? checkGuess(guess)
            : Array(secretWord.length).fill("border-gray-400");

          return (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: secretWord.length }).map((_, colIndex) => {
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
        maxLength={secretWord.length}
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

      <div className="flex flex-col gap-1 mt-2">
        <button
          onClick={() => router.push("/")}
          className="restart-button"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}
