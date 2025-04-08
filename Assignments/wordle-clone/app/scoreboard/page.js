"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth } from "../../config/firebaseConfig";

const db = getFirestore();

export default function Scoreboard() {
  const router = useRouter();
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      const user = auth.currentUser;
      if (!user || !user.displayName) {
        router.push("/login");
        return;
      }

      const username = user.displayName;

      const q = query(
        collection(db, "users", username, "games"),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(data);
    };

    fetchGames();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <h1 className="title">Scoreboard</h1>
      {games.length === 0 ? (
        <p>No games yet!</p>
      ) : (
        <ul className="text-lg">
          {games.map((game, index) => (
            <li key={game.id}>
              {index + 1}. {game.result === "win" ? "Win" : "Loss"} — Word: <strong>{game.word}</strong>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => router.push("/")} className="restart-button">
        Back to Game
      </button>
    </div>
  );
}
