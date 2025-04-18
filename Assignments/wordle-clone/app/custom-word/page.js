"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { auth } from "../../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const db = getFirestore();

export default function CustomWordPage() {
  const [customWord, setCustomWord] = useState("");
  const [challengeLink, setChallengeLink] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) router.push("/login");

    const savedTheme = localStorage.getItem("darkMode");
    const isDark = savedTheme === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const createChallenge = async () => {
    const word = customWord.toUpperCase();
    if (word.length < 3 || word.length > 10) {
      alert("Word must be between 3–10 letters");
      return;
    }

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await response.json();

      // ✅ This ensures only real English words are accepted
      if (!data.valid) {
        alert("Invalid word. Not accepted.");
        return;
      }

      const docRef = await addDoc(collection(db, "customChallenges"), {
        word,
        timestamp: new Date(),
      });

      setChallengeLink(`${window.location.origin}/custom-challenge/${docRef.id}`);
    } catch (err) {
      console.error("Challenge creation error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 text-center px-4">
      <h1 className="title">Create a Custom Word Challenge</h1>

      <input
        type="text"
        value={customWord}
        onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
        className="input-box"
        placeholder="Enter custom word"
        maxLength={10}
      />

      <button onClick={createChallenge} className="restart-button">
        Create Challenge
      </button>

      {challengeLink && (
        <>
          <p className="text-green-400 font-semibold">Challenge Created!</p>
          <p>Share this link:</p>
          <a href={challengeLink} className="text-blue-400 underline" target="_blank">
            {challengeLink}
          </a>
        </>
      )}

      <button
        className="scoreboard-button"
        onClick={() => router.push("/")}
      >
        Back to Game
      </button>
    </div>
  );
}
