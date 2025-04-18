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
  const [darkMode, setDarkMode] = useState(false);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUsername(user.displayName);

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

  useEffect(() => {
    const handleEnterOnly = (e) => {
      if (e.key === "Enter") {
        handleVirtualKey("ENTER");
      }
    };
    window.addEventListener("keydown", handleEnterOnly);
    return () => window.removeEventListener("keydown", handleEnterOnly);
  }, [currentGuess, gameOver, secretWord]);

  const saveResult = async (result) => {
    if (!username || !secretWord) return;

    const entry = {
      word: secretWord,
      result,
      timestamp: new Date(),
    };

    await addDoc(
      collection(db, "users", username, "games", "custom", "entries"),
      entry
    );

    await deleteDoc(doc(db, "customChallenges", id));
  };

  const checkGuess = (guess) => {
    return guess.split("").map((letter, index) => {
      if (letter === secretWord[index]) return "bg-green-600 text-white";
      if (secretWord.includes(letter)) return "bg-yellow-400 text-black";
      return "bg-gray-500 text-white";
    });
  };

  const handleVirtualKey = async (key) => {
    if (gameOver) return;

    if (key === "ENTER" && currentGuess.length === secretWord.length) {
      const updatedGuesses = [...guesses];
      const nextRow = updatedGuesses.findIndex((g) => g === "");
      updatedGuesses[nextRow] = currentGuess;
      setGuesses(updatedGuesses);

      const newKeyStatus = { ...keyStatuses };
      currentGuess.split("").forEach((char, i) => {
        if (char === secretWord[i]) {
          newKeyStatus[char] = "bg-green-600 text-white";
        } else if (secretWord.includes(char)) {
          newKeyStatus[char] = newKeyStatus[char] || "bg-yellow-400 text-black";
        } else {
          newKeyStatus[char] = "bg-gray-500 text-white";
        }
      });
      setKeyStatuses(newKeyStatus);

      if (currentGuess === secretWord) {
        setWon(true);
        setGameOver(true);
        await saveResult("win");
      } else if (updatedGuesses.filter((g) => g !== "").length >= MAX_TRIES) {
        setGameOver(true);
        await saveResult("lose");
      }

      setCurrentGuess("");
    } else if (key === "⌫") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < secretWord.length) {
      setCurrentGuess((prev) => prev + key.toUpperCase());
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

  if (!secretWord) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <h1 className="title">Custom Challenge</h1>

      <div className="grid">
        {guesses.map((guess, rowIndex) => {
          const colors = guess
            ? checkGuess(guess)
            : Array(secretWord.length).fill("border-gray-400");
          return (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: secretWord.length }).map((_, colIndex) => (
                <div key={colIndex} className={`cell ${colors[colIndex]}`}>
                  {guess[colIndex] || ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <input
        className="input-box"
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
        maxLength={secretWord.length}
      />

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {gameOver && (
        <p className={won ? "text-green-500" : "text-red-500"}>
          {won ? "You nailed it!" : `The word was ${secretWord}`}
        </p>
      )}

      <div className="keyboard">
        <div className="keyboard-row">
          {"QWERTYUIOP".split("").map((key) => (
            <button
              key={key}
              onClick={() => handleVirtualKey(key)}
              className={`key ${keyStatuses[key] || ""}`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row">
          {"ASDFGHJKL".split("").map((key) => (
            <button
              key={key}
              onClick={() => handleVirtualKey(key)}
              className={`key ${keyStatuses[key] || ""}`}
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
              onClick={() => handleVirtualKey(key)}
              className={`key ${keyStatuses[key] || ""}`}
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

      <button className="restart-button" onClick={() => router.push("/")}>
        Back to Game
      </button>
    </div>
  );
}
