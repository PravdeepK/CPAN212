"use client";
import React, { useState, useEffect } from "react";

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

export default function Home() {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [gameOver, setGameOver] = useState(false);

  // Fetch a random word when the component loads
  useEffect(() => {
    const fetchWord = async () => {
      const res = await fetch("/api/word");
      const data = await res.json();
      setSecretWord(data.word);
    };
    fetchWord();
  }, []);

  const handleInputChange = (e) => {
    if (e.target.value.length <= WORD_LENGTH) {
      setCurrentGuess(e.target.value.toUpperCase());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && currentGuess.length === WORD_LENGTH) {
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess("");

      // Check if the guess is correct
      if (currentGuess === secretWord || newGuesses.length >= MAX_TRIES) {
        setGameOver(true);
      }
    }
  };

  // Function to check each letter and apply colors
  const checkGuess = (guess) => {
    return guess.split("").map((letter, index) => {
      if (letter === secretWord[index]) return "bg-green-500 text-white"; // Correct position
      if (secretWord.includes(letter)) return "bg-yellow-500 text-black"; // Wrong position
      return "bg-gray-400 text-white"; // Not in word
    });
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold">Wordle Clone</h1>

      <div className="grid grid-rows-6 gap-2 mt-4">
        {Array.from({ length: MAX_TRIES }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1">
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
              const letter = guesses[rowIndex]?.[colIndex] || "";
              const styles = guesses[rowIndex]
                ? checkGuess(guesses[rowIndex])[colIndex]
                : "border-gray-400";

              return (
                <div
                  key={colIndex}
                  className={`w-10 h-10 flex items-center justify-center border text-xl font-bold ${styles}`}
                >
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
        className={`mt-4 p-2 border rounded ${
          gameOver ? "bg-gray-300" : ""
        }`}
        maxLength={WORD_LENGTH}
        disabled={gameOver}
      />

      {gameOver && (
        <p className="text-xl mt-4">
          Game Over! The word was <strong>{secretWord}</strong>
        </p>
      )}
    </div>
  );
}
