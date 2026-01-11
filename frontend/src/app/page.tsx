"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    if (!name) {
      setError("Please enter your name first");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await createRoom(name);
      localStorage.setItem(`yaaru_player_id_${data.room_id}`, data.player_id);
      router.push(`/room/${data.room_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) return;

    try {
      setLoading(true);
      setError("");
      const data = await joinRoom(roomId, name);
      localStorage.setItem(`yaaru_player_id_${roomId}`, data.player_id);
      router.push(`/room/${roomId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-black text-black tracking-tighter mb-2">YAARU?</h1>
          <p className="text-black/80 font-medium">Find the impostor among you.</p>
        </div>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="text-black font-black">Join a Room</CardTitle>
            <CardDescription className="text-black font-bold">Enter a room code and your name to join the game.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Your Name"
                  className="border-2 border-black focus-visible:ring-0 focus-visible:border-black placeholder:text-black/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Room Code (e.g. abcd)"
                  className="border-2 border-black focus-visible:ring-0 focus-visible:border-black placeholder:text-black/40"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90 font-bold py-6 text-lg" disabled={loading}>
                {loading ? "Joining..." : "Join Room"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t-2 border-black" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-black font-bold">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full bg-white border-2 border-black text-black hover:bg-black hover:text-white font-bold py-6 text-lg"
          onClick={handleCreateRoom}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create New Room"}
        </Button>
      </div>
    </main>
  );
}
