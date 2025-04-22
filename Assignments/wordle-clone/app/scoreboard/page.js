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
  const [activeTab, setActiveTab] = useState("all"); // default to all

  const fetchAllGames = async () => {
    const user = auth.currentUser;
    if (!user?.displayName) {
      router.push("/login");
      return;
    }
    const username = user.displayName;
    const allGames = [];

    // solo 3–10
    for (let i = 3; i <= 10; i++) {
      const snap = await getDocs(
        query(
          collection(db, "users", username, "games", i.toString(), "entries"),
          orderBy("timestamp", "desc")
        )
      );
      snap.forEach((d) =>
        allGames.push({ id: d.id, difficulty: i, ...d.data() })
      );
    }
    // custom
    {
      const snap = await getDocs(
        query(
          collection(db, "users", username, "games", "custom", "entries"),
          orderBy("timestamp", "desc")
        )
      );
      snap.forEach((d) =>
        allGames.push({ id: d.id, difficulty: "custom", ...d.data() })
      );
    }
    // multiplayer
    {
      const snap = await getDocs(
        query(
          collection(db, "users", username, "games", "multiplayer", "entries"),
          orderBy("timestamp", "desc")
        )
      );
      snap.forEach((d) =>
        allGames.push({ id: d.id, difficulty: "multiplayer", ...d.data() })
      );
    }

    setGames(allGames);
  };

  const resetScoreboard = async () => {
    const user = auth.currentUser;
    if (!user.displayName) return;
    if (!confirm("Reset your scoreboard?")) return;
    const username = user.displayName;

    // delete solo 3–10
    for (let i = 3; i <= 10; i++) {
      const snap = await getDocs(
        collection(db, "users", username, "games", i.toString(), "entries")
      );
      await Promise.all(
        snap.docs.map((docItem) =>
          deleteDoc(
            doc(
              db,
              "users",
              username,
              "games",
              i.toString(),
              "entries",
              docItem.id
            )
          )
        )
      );
    }
    // custom
    {
      const snap = await getDocs(
        collection(db, "users", username, "games", "custom", "entries")
      );
      await Promise.all(
        snap.docs.map((docItem) =>
          deleteDoc(
            doc(
              db,
              "users",
              username,
              "games",
              "custom",
              "entries",
              docItem.id
            )
          )
        )
      );
    }
    // multiplayer
    {
      const snap = await getDocs(
        collection(db, "users", username, "games", "multiplayer", "entries")
      );
      await Promise.all(
        snap.docs.map((docItem) =>
          deleteDoc(
            doc(
              db,
              "users",
              username,
              "games",
              "multiplayer",
              "entries",
              docItem.id
            )
          )
        )
      );
    }

    await fetchAllGames();
    alert("Scoreboard reset!");
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.displayName) fetchAllGames();
      else router.push("/login");
    });
    return () => unsub();
  }, []);

  const filtered = games.filter((g) => {
    const isMulti = g.multiplayer === true;

    // show all if activeTab === 'all'
    const tabOk =
      activeTab === "all" ||
      (activeTab === "multiplayer" && isMulti) ||
      (activeTab === "solo" && !isMulti);

    const diffOk =
      difficultyFilter === "all" ||
      (g.difficulty === "custom" && difficultyFilter === "custom") ||
      g.difficulty === parseInt(difficultyFilter);
    const resOk = resultFilter === "all" || g.result === resultFilter;
    return tabOk && diffOk && resOk;
  });

  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 text-center">
      <h1 className="title">SCOREBOARD</h1>

      {/* Game Modes */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          className={`scoreboard-button ${
            activeTab === "all" ? "active-button" : ""
          }`}
          onClick={() => {
            setActiveTab("all");
            setDifficultyFilter("all");
          }}
        >
          All Game Modes
        </button>
        {[...Array(8)].map((_, i) => {
          const len = (i + 3).toString();
          return (
            <button
              key={len}
              className={`scoreboard-button ${
                difficultyFilter === len ? "active-button" : ""
              }`}
              onClick={() => {
                setDifficultyFilter(len);
                setActiveTab("solo");
              }}
            >
              {len} Letters
            </button>
          );
        })}
        <button
          className={`scoreboard-button ${
            difficultyFilter === "custom" && activeTab === "solo"
              ? "active-button"
              : ""
          }`}
          onClick={() => {
            setDifficultyFilter("custom");
            setActiveTab("solo");
          }}
        >
          Custom
        </button>
        <button
          className={`scoreboard-button ${
            activeTab === "multiplayer" ? "active-button" : ""
          }`}
          onClick={() => {
            setActiveTab("multiplayer");
            setDifficultyFilter("all");
          }}
        >
          Multiplayer
        </button>
      </div>

      {/* Results */}
      <div className="flex gap-2">
        <button
          className={`scoreboard-button ${
            resultFilter === "all" ? "active-button" : ""
          }`}
          onClick={() => setResultFilter("all")}
        >
          All Results
        </button>
        <button
          className={`scoreboard-button ${
            resultFilter === "win" ? "active-button" : ""
          }`}
          onClick={() => setResultFilter("win")}
        >
          Wins
        </button>
        <button
          className={`scoreboard-button ${
            resultFilter === "lose" ? "active-button" : ""
          }`}
          onClick={() => setResultFilter("lose")}
        >
          Losses
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <ul className="text-lg">
          {filtered.map((g, i) => (
            <li
              key={g.id}
              className={g.result === "win" ? "text-green-600" : "text-red-600"}
            >
              {i + 1}.{" "}
              {g.result === "win" ? "✅ Win" : "❌ Loss"} — Word:{" "}
              <strong>{g.word}</strong>{" "}
              {g.difficulty === "custom"
                ? "(Custom)"
                : g.difficulty === "multiplayer"
                ? "(Multiplayer)"
                : `(${g.difficulty} letters)`}{" "}
              {g.multiplayer && g.player && (
                <span className="text-blue-500 ml-1 text-sm">
                  (vs {g.player})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button className="restart-button" onClick={resetScoreboard}>
          Reset Scoreboard
        </button>
        <button className="restart-button" onClick={() => router.push("/")}>
          Back to Game
        </button>
      </div>
    </div>
  );
}
