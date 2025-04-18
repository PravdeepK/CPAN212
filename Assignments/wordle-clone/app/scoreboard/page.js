"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth } from "../../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const db = getFirestore();

export default function Scoreboard() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const fetchAllGames = async () => {
    const user = auth.currentUser;
    if (!user || !user.displayName) {
      router.push("/login");
      return;
    }

    const username = user.displayName;
    const allGames = [];

    // Normal 3–10 letter games
    for (let i = 3; i <= 10; i++) {
      const q = query(
        collection(db, "users", username, "games", i.toString(), "entries"),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        allGames.push({ id: doc.id, difficulty: i, ...doc.data() });
      });
    }

    // ✅ Custom Word games
    const customSnapshot = await getDocs(
      query(collection(db, "users", username, "games", "custom", "entries"), orderBy("timestamp", "desc"))
    );

    customSnapshot.forEach((doc) => {
      allGames.push({ id: doc.id, difficulty: "custom", ...doc.data() });
    });

    setGames(allGames);
  };

  const resetScoreboard = async () => {
    const user = auth.currentUser;
    if (!user || !user.displayName) return;

    const confirmReset = window.confirm(
      "Are you sure you want to reset your scoreboard? This cannot be undone!"
    );
    if (!confirmReset) return;

    const username = user.displayName;

    try {
      for (let i = 3; i <= 10; i++) {
        const q = query(
          collection(db, "users", username, "games", i.toString(), "entries")
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docItem) =>
          deleteDoc(doc(db, "users", username, "games", i.toString(), "entries", docItem.id))
        );
        await Promise.all(deletePromises);
      }

      const customSnap = await getDocs(
        collection(db, "users", username, "games", "custom", "entries")
      );
      const customDeletes = customSnap.docs.map((docItem) =>
        deleteDoc(doc(db, "users", username, "games", "custom", "entries", docItem.id))
      );
      await Promise.all(customDeletes);

      await fetchAllGames();
      alert("Scoreboard has been reset!");
    } catch (error) {
      console.error("Failed to reset scoreboard:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName) {
        fetchAllGames();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredGames = games.filter((game) => {
    const matchDifficulty =
      difficultyFilter === "all" ||
      game.difficulty === "custom" && difficultyFilter === "custom" ||
      game.difficulty === parseInt(difficultyFilter);
    const matchResult =
      resultFilter === "all" || game.result === resultFilter;
    return matchDifficulty && matchResult;
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <h1 className="title">Scoreboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          className={`scoreboard-button ${difficultyFilter === "all" ? "active-button" : ""}`}
          onClick={() => setDifficultyFilter("all")}
        >
          All Difficulties
        </button>
        {[...Array(8)].map((_, i) => {
          const len = (i + 3).toString();
          return (
            <button
              key={len}
              className={`scoreboard-button ${difficultyFilter === len ? "active-button" : ""}`}
              onClick={() => setDifficultyFilter(len)}
            >
              {len} Letters
            </button>
          );
        })}
        <button
          className={`scoreboard-button ${difficultyFilter === "custom" ? "active-button" : ""}`}
          onClick={() => setDifficultyFilter("custom")}
        >
          Custom
        </button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <button
          className={`scoreboard-button ${resultFilter === "all" ? "active-button" : ""}`}
          onClick={() => setResultFilter("all")}
        >
          All Results
        </button>
        <button
          className={`scoreboard-button ${resultFilter === "win" ? "active-button" : ""}`}
          onClick={() => setResultFilter("win")}
        >
          Wins
        </button>
        <button
          className={`scoreboard-button ${resultFilter === "lose" ? "active-button" : ""}`}
          onClick={() => setResultFilter("lose")}
        >
          Losses
        </button>
      </div>

      {/* Game List */}
      {filteredGames.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <ul className="text-lg">
          {filteredGames.map((game, index) => (
            <li
              key={game.id}
              className={game.result === "win" ? "text-green-600" : "text-red-600"}
            >
              {index + 1}.{" "}
              {game.result === "win" ? "✅ Win" : "❌ Loss"} — Word:{" "}
              <strong>{game.word}</strong>{" "}
              {game.difficulty === "custom"
                ? "(Custom Word)"
                : `(${game.difficulty} letters)`}
            </li>
          ))}
        </ul>
      )}

      <button onClick={resetScoreboard} className="restart-button">
        Reset Scoreboard
      </button>

      <button onClick={() => router.push("/")} className="restart-button">
        Back to Game
      </button>
    </div>
  );
}
