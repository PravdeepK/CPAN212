import { useEffect, useState } from "react";

export default function useWebSocket(options = {}) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const url =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "ws://localhost:3005"
        : process.env.NEXT_PUBLIC_WS_URL; // ← pulled from env

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("✅ Connected to WebSocket server");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === "room-created")    options.onRoomJoined?.(payload.roomId, payload.word);
        if (type === "room-joined")     options.onRoomJoined?.(payload.roomId, payload.word);
        if (type === "guest-joined")    options.onGuestJoined?.();
        if (type === "guess")           options.onOpponentGuess?.(payload.guess);
        if (type === "room-expired")    alert("Room has expired. Please refresh and try again.");
      } catch (err) {
        console.warn("❌ Invalid WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      alert("WebSocket failed to connect. Is your server running?");
    };

    ws.onclose = () => {
      console.warn("🔌 WebSocket connection closed.");
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendJsonMessage = (type, payload) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    }
  };

  return { socket, sendJsonMessage };
}
