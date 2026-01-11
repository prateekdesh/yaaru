const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export async function createRoom(name: string) {
  const res = await fetch(`${API_BASE}/create-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}

export async function joinRoom(roomId: string, name: string) {
  const res = await fetch(`${API_BASE}/join-room/${roomId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to join room");
  }
  return res.json();
}

export function getWsUrl(roomId: string, clientId: string) {
  return `${WS_BASE}/ws/${roomId}?client_id=${clientId}`;
}
