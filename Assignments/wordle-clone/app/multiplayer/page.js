"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const MAX_TRIES = 6;
let socket;

export default function MultiplayerPage() {
  const router = useRouter();
  const db = getFirestore();

  const [username, setUsername] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState(Array(MAX_TRIES).fill(""));
  const [opponentGuesses, setOpponentGuesses] = useState(Array(MAX_TRIES).fill(""));
  const [youDone, setYouDone] = useState(false);
  const [themDone, setThemDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState({});

  // — Auth listener —
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setUsername(u.displayName || "Player");
    });
    return () => unsub();
  }, [router]);

  // — WebSocket setup —
  useEffect(() => {
    socket = new WebSocket(
      window.location.hostname === "localhost"
        ? "ws://localhost:3005"
        : "wss://5fe4-99-234-89-67.ngrok-free.app"
    );

    socket.onmessage = ({ data }) => {
      const { type, payload } = JSON.parse(data);

      if (type === "room-created") {
        setRoomId(payload.roomId);
        setIsHost(true);
        setWord(payload.word.toUpperCase());
      }

      if (type === "room-joined") {
        setRoomId(payload.roomId);
        setIsHost(false);
        setWord(payload.word.toUpperCase());
      }

      if (type === "guest-joined") {
        // nothing to do here, UI can watch roomId + guest flag
      }

      if (type === "guess") {
        const g = payload.guess.toUpperCase();
        const cols = checkGuess(g);
        setOpponentGuesses(o => {
          const n = [...o];
          const idx = n.findIndex(x => x === "");
          if (idx !== -1) n[idx] = g;
          return n;
        });
      }

      if (type === "player-finished") {
        setThemDone(true);
      }
    };
  }, []);

  // — Helpers —  
  const validateWord = async (w) => {
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: w }),
      });
      return (await res.json()).valid;
    } catch {
      return false;
    }
  };

  const checkGuess = (guess) => {
    const result = Array(5).fill("border-gray-400 bg-gray-400 text-white");
    const matched = Array(5).fill(false);
    const secret = word.split("");

    // green pass
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secret[i]) {
        result[i] = "bg-green-500 text-white";
        matched[i] = true;
      }
    }
    // yellow pass
    for (let i = 0; i < 5; i++) {
      if (result[i].includes("green")) continue;
      const idx = secret.findIndex((l, j) => l === guess[i] && !matched[j]);
      if (idx !== -1) {
        result[i] = "bg-yellow-500 text-black";
        matched[idx] = true;
      }
    }
    return result;
  };

  const saveResult = async (result) => {
    if (!username || !word) return;
    try {
      await addDoc(
        collection(db, "users", username, "games", "multiplayer", "entries"),
        {
          word,
          result,          // "win" or "lose"
          multiplayer: true,
          timestamp: new Date(),
        }
      );
    } catch (e) {
      console.error("Failed to save result:", e);
    }
  };

  // — Handle key presses —
  const handleKey = async (key) => {
    if (gameOver || !word) return;

    if (key === "ENTER") {
      if (currentGuess.length !== 5) return;
      if (!(await validateWord(currentGuess))) return alert("❌ Not a valid word.");

      const guessU = currentGuess.toUpperCase();
      setGuesses(g => {
        const n = [...g];
        const idx = n.findIndex(x => x === "");
        if (idx !== -1) n[idx] = guessU;
        return n;
      });

      const cols = checkGuess(guessU);
      setKeyStatuses(ks => {
        const n = { ...ks };
        guessU.split("").forEach((ltr,i) => {
          const c = cols[i];
          if (c.includes("green") || (c.includes("yellow") && n[ltr] !== "bg-green-500 text-white")) {
            n[ltr] = c;
          } else if (!n[ltr]) {
            n[ltr] = c;
          }
        });
        return n;
      });

      socket.send(JSON.stringify({ type: "send-guess", payload: { roomId, guess: guessU } }));

      const wonIt = guessU === word;
      const nextIdx = guesses.findIndex(x => x === "");
      const outOfTries = nextIdx === MAX_TRIES - 1;
      if (wonIt || outOfTries) {
        setGameOver(true);
        setWon(wonIt);
        setYouDone(true);
        socket.send(JSON.stringify({ type: "player-finished", payload: { roomId } }));
        await saveResult(wonIt ? "win" : "lose");
      }

      setCurrentGuess("");
    }
    else if (key === "⌫") {
      setCurrentGuess(c => c.slice(0,-1));
    }
    else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(c => c + key);
    }
  };

  // — Render board —
  const renderBoard = (rows, title, reveal) => (
    <div className="flex flex-col items-center gap-1">
      <h3 className="font-bold">{title}</h3>
      <div className="grid">
        {rows.map((row,ri) => {
          const cols = row === "" ? Array(5).fill("border-gray-400") : checkGuess(row);
          const letters = row.split("");
          return (
            <div key={ri} className="grid-row">
              {cols.map((c,ci) => (
                <div key={ci} className={`cell ${c}`}>
                  {reveal && row ? letters[ci] : ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  const revealOpponent = youDone && themDone;

  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 text-center">
      <h1 className="title">MULTIPLAYER</h1>

      {!roomId ? (
        <div className="flex flex-col gap-2 mt-2">
          <button className="scoreboard-button" onClick={()=>socket.send(JSON.stringify({type:"create-room"}))}>
            Start Multiplayer Game
          </button>
          <button className="scoreboard-button" onClick={()=>{
            const id=prompt("Enter Room ID:");
            if(id) socket.send(JSON.stringify({type:"join-room",payload:{roomId:id.trim()}}));
          }}>
            Join a Room
          </button>
        </div>
      ) : (
        <>
          <p><strong>Room:</strong> {roomId}</p>
          <div className="flex flex-col md:flex-row gap-8">
            {renderBoard(guesses, "Your Board", true)}
            {renderBoard(opponentGuesses, "Opponent Board", revealOpponent)}
          </div>

          <input
            className="input-box"
            type="text"
            value={currentGuess}
            readOnly
            maxLength={5}
            placeholder={youDone ? "" : "Type your guess…"}
            onKeyDown={e => {
              if (e.key==="Enter") handleKey("ENTER");
              else if (e.key==="Backspace") handleKey("⌫");
              else if(/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
            }}
          />

          <div className="keyboard">
            {["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].map((row,i)=>(
              <div key={i} className="keyboard-row">
                {row.split("").map(k=>(
                  <button
                    key={k}
                    className={`key ${keyStatuses[k]||""}`}
                    onClick={()=>handleKey(k)}
                    disabled={youDone}
                  >{k}</button>
                ))}
                {i===2 && <>
                  <button className="key large-key" onClick={()=>handleKey("ENTER")} disabled={youDone}>Enter</button>
                  <button className="key large-key" onClick={()=>handleKey("⌫")} disabled={youDone}>⌫</button>
                </>}
              </div>
            ))}
          </div>

          {gameOver && (
            <p className="game-over">
              {won ? "🎉 Congrats, you beat it!" : `😞 You failed! The word was ${word}`}
            </p>
          )}
        </>
      )}

      <button className="restart-button mt-4" onClick={()=>router.push("/")}>
        Back to Main Game
      </button>
    </div>
  );
}
