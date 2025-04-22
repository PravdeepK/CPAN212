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

  // ————— STATE —————
  const [username, setUsername] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState(Array(MAX_TRIES).fill(""));
  const [opponentGuesses, setOpponentGuesses] = useState(
    Array(MAX_TRIES).fill("")
  );
  const [opponentColors, setOpponentColors] = useState(
    Array(MAX_TRIES).fill(null)
  );
  const [opponentName, setOpponentName] = useState(null); // ← your opponent’s username
  const [youDone, setYouDone] = useState(false);
  const [themDone, setThemDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState({});

  // ————— AUTH LISTENER —————
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setUsername(u.displayName || "Player");
    });
    return () => unsub();
  }, [router]);

  // ————— WEBSOCKET SETUP —————
  useEffect(() => {
    socket = new WebSocket(
      window.location.hostname === "localhost"
        ? "ws://localhost:3005"
        : "wss://orange-moles-own.loca.lt"
    );

    socket.onmessage = ({ data }) => {
      const { type, payload } = JSON.parse(data);

      if (type === "room-created") {
        // you created the room
        setRoomId(payload.roomId);
        setIsHost(true);
        setWord(payload.word.toUpperCase());
      }

      if (type === "room-joined") {
        // you joined an existing room
        setRoomId(payload.roomId);
        setIsHost(false);
        setWord(payload.word.toUpperCase());
        // if server also provides who the host is:
        if (payload.hostName) {
          setOpponentName(payload.hostName);
        }
      }

      if (type === "new-player") {
        // if server notifies you of the other’s name
        setOpponentName(payload.username);
      }

      if (type === "guess") {
        // opponent just made a guess
        const g = payload.guess.toUpperCase();
        const colors = checkGuess(g);

        setOpponentGuesses((o) => {
          const n = [...o];
          const i = n.findIndex((x) => x === "");
          if (i !== -1) n[i] = g;
          return n;
        });

        setOpponentColors((o) => {
          const n = [...o];
          const i = n.findIndex((x) => x === null);
          if (i !== -1) n[i] = colors;
          return n;
        });
      }

      if (type === "player-finished") {
        // opponent finished (win or out of tries)
        setThemDone(true);
      }
    };
  }, []);

  // ————— FIRESTORE SAVE —————
  const saveResult = async (result) => {
    if (!username || !word) return;

    // build the entry, only include `player` if defined
    const entry = {
      word,
      result,            // "win" or "lose"
      multiplayer: true, // flag for scoreboard
      timestamp: new Date(),
    };
    if (opponentName) {
      entry.player = opponentName;
    }

    try {
      await addDoc(
        collection(db, "users", username, "games", "multiplayer", "entries"),
        entry
      );
    } catch (err) {
      console.error("Failed to save multiplayer result:", err);
    }
  };

  // ————— HELPERS —————
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
    const res = Array(5).fill("border-gray-400 bg-gray-400 text-white");
    const matched = Array(5).fill(false);
    const secret = word.split("");

    // greens
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secret[i]) {
        res[i] = "bg-green-500 text-white";
        matched[i] = true;
      }
    }
    // yellows
    for (let i = 0; i < 5; i++) {
      if (res[i].includes("green")) continue;
      const idx = secret.findIndex((l, j) => l === guess[i] && !matched[j]);
      if (idx !== -1) {
        res[i] = "bg-yellow-500 text-black";
        matched[idx] = true;
      }
    }
    return res;
  };

  // ————— GAME ACTIONS —————
  const startGame = () => {
    socket.send(JSON.stringify({ type: "create-room", username }));
  };
  const joinRoom = () => {
    const id = prompt("Enter Room ID:");
    if (id) {
      socket.send(
        JSON.stringify({ type: "join-room", payload: { roomId: id.trim() }, username })
      );
    }
  };

  const handleKey = async (key) => {
    if (gameOver || !word) return;

    if (key === "ENTER") {
      if (currentGuess.length !== 5) return;
      if (!(await validateWord(currentGuess))) {
        return alert("❌ Not a valid word.");
      }

      const guessU = currentGuess.toUpperCase();
      // record your guess
      setGuesses((g) => {
        const n = [...g];
        const i = n.findIndex((x) => x === "");
        if (i !== -1) n[i] = guessU;
        return n;
      });

      // update your keyboard
      const colors = checkGuess(guessU);
      setKeyStatuses((ks) => {
        const n = { ...ks };
        guessU.split("").forEach((ltr, i) => {
          const c = colors[i];
          if (
            c.includes("green") ||
            (c.includes("yellow") && n[ltr] !== "bg-green-500 text-white")
          ) {
            n[ltr] = c;
          } else if (!n[ltr]) {
            n[ltr] = c;
          }
        });
        return n;
      });

      // broadcast to opponent
      socket.send(
        JSON.stringify({
          type: "send-guess",
          payload: { roomId, guess: guessU },
        })
      );

      // finish check
      const wonIt = guessU === word;
      const nextIdx = guesses.findIndex((x) => x === "");
      const outOfTries = nextIdx === MAX_TRIES - 1;

      if (wonIt || outOfTries) {
        setGameOver(true);
        setWon(wonIt);
        setYouDone(true);

        // notify server
        socket.send(
          JSON.stringify({ type: "player-finished", payload: { roomId } })
        );

        // save to Firestore
        await saveResult(wonIt ? "win" : "lose");
      }

      setCurrentGuess("");
    } else if (key === "⌫") {
      setCurrentGuess((c) => c.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess((c) => c + key);
    }
  };

  // Reveal the opponent’s letter‐colors only once both players are done
  const revealOpponent = youDone && themDone;

  // ————— RENDER HELPERS —————
  const renderBoard = (list, title, showLetters) => (
    <div className="flex flex-col items-center gap-1">
      <h3 className="font-bold">{title}</h3>
      <div className="grid">
        {list.map((row, ri) => {
          const cols =
            row === ""
              ? Array(5).fill("border-gray-400")
              : checkGuess(row.toUpperCase());
          const letters = row.toUpperCase().split("");
          return (
            <div key={ri} className="grid-row">
              {cols.map((c, ci) => (
                <div key={ci} className={`cell ${c}`}>
                  {showLetters && row ? letters[ci] : ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ————— JSX —————
  return (
    <div className="flex flex-col items-center min-h-screen gap-4 p-4 text-center">
      <h1 className="title">MULTIPLAYER</h1>

      {!roomId && (
        <div className="flex flex-col gap-2 mt-2">
          <button className="scoreboard-button" onClick={startGame}>
            Start Multiplayer Game
          </button>
          <button className="scoreboard-button" onClick={joinRoom}>
            Join a Room
          </button>
        </div>
      )}

      {roomId && (
        <>
          <p>
            <strong>Room:</strong> {roomId}
          </p>
          <div className="flex flex-col md:flex-row gap-8">
            {renderBoard(guesses, "Your Board", true)}
            {renderBoard(opponentGuesses, "Opponent Board", revealOpponent)}
          </div>
        </>
      )}

      {roomId && (
        <>
          <input
            type="text"
            value={currentGuess}
            readOnly
            maxLength={5}
            className="input-box"
            placeholder={youDone ? "" : "Type your guess…"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleKey("ENTER");
              else if (e.key === "Backspace") handleKey("⌫");
              else if (/^[a-zA-Z]$/.test(e.key))
                handleKey(e.key.toUpperCase());
            }}
          />
          <div className="keyboard">
            {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, i) => (
              <div className="keyboard-row" key={i}>
                {row.split("").map((k) => (
                  <button
                    key={k}
                    className={`key ${keyStatuses[k] || ""}`}
                    onClick={() => handleKey(k)}
                    disabled={youDone}
                  >
                    {k}
                  </button>
                ))}
                {i === 2 && (
                  <>
                    <button
                      className="key large-key"
                      onClick={() => handleKey("ENTER")}
                      disabled={youDone}
                    >
                      Enter
                    </button>
                    <button
                      className="key large-key"
                      onClick={() => handleKey("⌫")}
                      disabled={youDone}
                    >
                      ⌫
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <p className="game-over">
          {won
            ? "🎉 Congrats, you beat it!"
            : `😞 You failed! The word was ${word}`}
        </p>
      )}

      <button
        className="restart-button mt-4"
        onClick={() => router.push("/")}
      >
        Back to Main Game
      </button>
    </div>
  );
}
