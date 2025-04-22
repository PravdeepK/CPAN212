// ws-server/multiplayer-server.js

const WebSocket = require("ws");
const http      = require("http");
const crypto    = require("crypto");
// dynamic import so fetch works in Node.js
const fetch     = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const server = http.createServer();
const wss    = new WebSocket.Server({ server });

const rooms = {};

/**
 * Determine the correct base‑url for the Next.js API:
 *  • WORDLE_API_URL env var if you explicitly set it
 *  • in production on Vercel, use the VERCEL_URL
 *  • otherwise default to localhost:3000
 */
const API_ORIGIN =
  process.env.WORDLE_API_URL ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

console.log("🔗 Wordle API origin is:", API_ORIGIN);

function generateRoomId() {
  return crypto.randomUUID().slice(0, 6);
}

function deleteRoom(roomId, reason = "expired") {
  const room = rooms[roomId];
  if (!room) return;
  try {
    room.host?.send(JSON.stringify({ type: "room-expired" }));
    room.guest?.send(JSON.stringify({ type: "room-expired" }));
    room.host?.close();
    room.guest?.close();
  } catch (e) { /* ignore */ }
  clearTimeout(room.timeout);
  delete rooms[roomId];
  console.log(`🧹 Room ${roomId} deleted (${reason})`);
}

async function fetchWordFromAPI() {
  const url = `${API_ORIGIN}/api/word`;
  console.log(`🎲 Fetching new word from ${url}…`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ length: 5 }),
    });
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
    const data = await res.json();
    console.log("✅ Got word:", data.word);
    return data.word;
  } catch (err) {
    console.error("❌ Failed to fetch word from API:", err.message);
    return null;
  }
}

wss.on("connection", (socket) => {
  socket.on("message", async (msg) => {
    let type, payload;
    try {
      ({ type, payload } = JSON.parse(msg));
    } catch (_) {
      console.warn("⚠️  Invalid JSON from client:", msg);
      return;
    }

    // — Host creates a room —
    if (type === "create-room") {
      const roomId = generateRoomId();
      const timeout = setTimeout(() => deleteRoom(roomId), 10 * 60_000);
      const word = await fetchWordFromAPI();
      if (!word) {
        socket.send(JSON.stringify({ type: "error", payload: "Could not generate word." }));
        return;
      }
      rooms[roomId] = { host: socket, guest: null, word, finished: { host: false, guest: false }, timeout };
      socket.send(JSON.stringify({ type: "room-created", payload: { roomId, word } }));
      console.log(`🎲 Room ${roomId} created (word=${word})`);
    }

    // — Guest joins —
    if (type === "join-room") {
      const room = rooms[payload.roomId];
      if (room && !room.guest) {
        room.guest = socket;
        socket.send(JSON.stringify({ type: "room-joined", payload: { roomId: payload.roomId, word: room.word } }));
        room.host.send(JSON.stringify({ type: "guest-joined" }));
        console.log(`👤 Guest joined room ${payload.roomId}`);
      } else {
        socket.send(JSON.stringify({ type: "room-expired" }));
      }
    }

    // — Relay guesses —
    if (type === "send-guess") {
      const room = rooms[payload.roomId];
      if (room) {
        const out = JSON.stringify({ type: "guess", payload: { guess: payload.guess } });
        if (socket === room.host && room.guest) room.guest.send(out);
        if (socket === room.guest && room.host) room.host.send(out);
      }
    }

    // — Player finished —
    if (type === "player-finished") {
      const room = rooms[payload.roomId];
      if (room) {
        const who = socket === room.host ? "host" : "guest";
        room.finished[who] = true;
        console.log(`🏁 ${who} finished in room ${payload.roomId}`);
        if (room.finished.host && room.finished.guest) {
          const cd = JSON.stringify({ type: "start-cooldown" });
          room.host?.send(cd);
          room.guest?.send(cd);
          setTimeout(() => deleteRoom(payload.roomId, "both finished"), 30_000);
        }
      }
    }
  });

  socket.on("close", () => {
    for (const id in rooms) {
      const { host, guest } = rooms[id];
      if (host === socket || guest === socket) {
        deleteRoom(id, "disconnect");
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`🟢 WebSocket server up on ws://localhost:${PORT}`);
});
