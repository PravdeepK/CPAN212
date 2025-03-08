"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Scoreboard() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const [wins, setWins] = useState(0);

  useEffect(() => {
    setAttempts(parseInt(localStorage.getItem("attempts") || "0"));
    setWins(parseInt(localStorage.getItem("wins") || "0"));
  }, []);

  const winRate = attempts > 0 ? ((wins / attempts) * 100).toFixed(2) : "0.00";

  return (
    <div className="container">
      <h1 className="title">Scoreboard</h1>
      <p>Total Attempts: {attempts}</p>
      <p>Wins: {wins}</p>
      <p>Win Rate: {winRate}%</p>
      <button onClick={() => router.push("/")} className="restart-button">Back to Game</button>
    </div>
  );
}
