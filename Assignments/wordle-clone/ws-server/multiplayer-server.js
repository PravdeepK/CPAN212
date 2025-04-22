// ws-server/multiplayer-server.js

const WebSocket = require("ws");
const http = require("http");
const crypto = require("crypto");
// dynamic import so fetch works in Node.js
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = {};

// Use an environment variable in production, fall back to localhost in dev
const API_ORIGIN = process.env.WORDLE_API_URL || "http://localhost:3000";

function generateRoomId() {
  return crypto.randomUUID().slice(0, 6); // e.g. "a1b2c3"
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
  try {
    const res = await fetch(`${API_ORIGIN}/api/word`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ length: 5 }),
    });
    const data = await res.json();
    return data?.word || null;
  } catch (err) {
    console.error("❌ Failed to fetch word from API:", err.message);
    return null;
  }
}

wss.on("connection", (socket) => {
  socket.on("message", async (msg) => {
    try {
      const { type, payload } = JSON.parse(msg);

      // Host creates a room
      if (type === "create-room") {
        const roomId = generateRoomId();
        const timeout = setTimeout(() => deleteRoom(roomId), 10 * 60 * 1000); // 10 min
        const word = await fetchWordFromAPI();

        if (!word) {
          socket.send(JSON.stringify({ type: "error", payload: "Failed to generate word." }));
          return;
        }

        rooms[roomId] = {
          host: socket,
          guest: null,
          word,
          finished: { host: false, guest: false },
          timeout,
        };

        socket.send(JSON.stringify({
          type: "room-created",
          payload: { roomId, word },
        }));
        console.log(`🎲 Room ${roomId} created with word: ${word}`);
      }

      // Guest joins existing room
      if (type === "join-room") {
        const room = rooms[payload.roomId];
        if (room && !room.guest) {
          room.guest = socket;
          socket.send(JSON.stringify({
            type: "room-joined",
            payload: { roomId: payload.roomId, word: room.word },
          }));
          room.host.send(JSON.stringify({ type: "guest-joined" }));
          console.log(`👤 Guest joined room ${payload.roomId}`);
        } else {
          socket.send(JSON.stringify({ type: "room-expired" }));
        }
      }

      // Relay a guess to the other player
      if (type === "send-guess") {
        const room = rooms[payload.roomId];
        const msgOut = JSON.stringify({
          type: "guess",
          payload: { from: payload.from, guess: payload.guess },
        });
        if (room) {
          if (socket === room.host && room.guest) room.guest.send(msgOut);
          if (socket === room.guest && room.host) room.host.send(msgOut);
        }
      }

      // Handle player finished
      if (type === "player-finished") {
        const room = rooms[payload.roomId];
        if (room) {
          const who = socket === room.host ? "host" : "guest";
          room.finished[who] = true;

          if (room.finished.host && room.finished.guest) {
            // start a 30s cooldown before cleanup
            const cooldownMsg = JSON.stringify({ type: "start-cooldown" });
            try {
              room.host?.send(cooldownMsg);
              room.guest?.send(cooldownMsg);
            } catch {}
            setTimeout(() => deleteRoom(payload.roomId, "both finished"), 30 * 1000);
          }
        }
      }
    } catch (err) {
      console.error("❌ Failed to handle message:", err.message);
    }
  });

  socket.on("close", () => {
    // if either party disconnects, tear down the room
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
  console.log(`🟢 Multiplayer WebSocket server running on ws://localhost:${PORT}`);
});
