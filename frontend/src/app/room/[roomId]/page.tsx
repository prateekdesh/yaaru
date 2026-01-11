"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getWsUrl } from "@/lib/api";
import { GameEvent, GameStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Play, Eye } from "lucide-react";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<GameStatus>("LOBBY");
  const [players, setPlayers] = useState<{ name: string; id: string }[]>([]);
  const [word, setWord] = useState<string | null>(null);
  const [isImpostor, setIsImpostor] = useState(false);
  const [impostorName, setImpostorName] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem(`yaaru_player_id_${roomId}`);
    if (!storedId) {
      router.push("/");
      return;
    }
    setClientId(storedId);

    const ws = new WebSocket(getWsUrl(roomId, storedId));

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      const data: GameEvent = JSON.parse(event.data);
      console.log("Received event:", data);

      if (data.event === "player_joined") {
        setPlayers((prev) => {
            if (prev.find(p => p.id === data.client_id)) return prev;
            return [...prev, { name: data.player_name || "Unknown", id: data.client_id || "" }];
        });
      } else if (data.event === "game_started") {
        setStatus("PLAYING");
        setIsGameOver(false);
        // @ts-ignore
        setWord(data.word || null);
        // @ts-ignore
        setIsImpostor(data.is_impostor || false);
      } else if (data.event === "game_over") {
        setStatus("FINISHED");
        setWord(data.word || null);
        // @ts-ignore
        setImpostorName(data.impostor_name || null);
        setIsGameOver(true);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId, router]);

  const handleStartGame = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send("start");
    }
  };

  const handleExpose = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send("expose");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-between items-end border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tighter">ROOM: {roomId.toUpperCase()}</h1>
            <p className="text-black font-medium">Share this code with your friends.</p>
          </div>
          <Badge className="bg-black text-white px-4 py-1 text-sm font-bold border-2 border-black">
            {status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                {status === "LOBBY" ? "Lobby" : status === "PLAYING" ? "The Game is On!" : "Game Over"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {status === "LOBBY" && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="p-4 bg-white border-4 border-black rounded-full">
                    <Users className="w-12 h-12 text-black" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-black">Waiting for players...</p>
                    <p className="text-black/60 text-sm font-bold">The host can start the game when everyone is ready.</p>
                  </div>
                  <Button onClick={handleStartGame} className="w-full max-w-xs gap-2 bg-black text-white hover:bg-black/90 font-bold py-6 text-lg border-2 border-black">
                    <Play className="w-4 h-4" /> Start Game
                  </Button>
                </div>
              )}

              {status === "PLAYING" && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  <div className="space-y-2">
                    <p className={`text-sm uppercase tracking-widest font-black ${isImpostor ? 'text-red-600' : 'text-black'}`}>
                      {isImpostor ? 'You are the Impostor' : 'Your Word'}
                    </p>
                    <h2 className="text-6xl font-black text-black">
                      {isImpostor ? "???" : word || "???"}
                    </h2>
                  </div>
                  <p className="text-black font-medium max-w-md">
                    {isImpostor 
                      ? "Try to blend in! Figure out the word by listening to others." 
                      : "Discuss the word without giving it away to the impostor."}
                  </p>
                  <Button variant="outline" onClick={handleExpose} className="gap-2 border-2 border-black text-black hover:bg-black hover:text-white font-bold px-8">
                    <Eye className="w-4 h-4" /> Expose Word
                  </Button>
                </div>
              )}

              {status === "FINISHED" && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-sm uppercase tracking-widest text-black font-black">The Word Was</p>
                      <h2 className="text-6xl font-black text-black underline decoration-4 underline-offset-8">{word || "UNKNOWN"}</h2>
                    </div>
                    <div className="space-y-1 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-sm uppercase tracking-widest text-red-600 font-black">The Impostor Was</p>
                      <h2 className="text-3xl font-black text-black">{impostorName || "UNKNOWN"}</h2>
                    </div>
                  </div>
                  <Button onClick={handleStartGame} className="bg-black text-white hover:bg-black/90 font-bold px-8 py-6 text-lg border-2 border-black">
                    <Play className="w-4 h-4" /> Play Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-sm uppercase tracking-wider text-black font-black">Players</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {players.map((player) => (
                  <li key={player.id} className="flex items-center gap-2 p-3 rounded-none bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-3 h-3 rounded-full bg-black" />
                    <span className="font-bold text-black">{player.name}</span>
                    {player.id === clientId && (
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-none uppercase font-black ml-auto">You</span>
                    )}
                  </li>
                ))}
                {players.length === 0 && (
                    <p className="text-xs text-black italic text-center py-4 font-bold">No one here yet...</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
