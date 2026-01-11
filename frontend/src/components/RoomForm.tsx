'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, joinRoom } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RoomForm() {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const { room_id, player_id } = await createRoom();
      // Store player_id and info in local storage or state management
      localStorage.setItem(`player_${room_id}`, player_id);
      localStorage.setItem(`name_${room_id}`, 'HOST');
      router.push(`/room/${room_id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !name) return;

    setIsLoading(true);
    try {
      const { player_id } = await joinRoom(roomId, name);
      localStorage.setItem(`player_${roomId}`, player_id);
      localStorage.setItem(`name_${roomId}`, name);
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error(error);
      alert('Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Create a New Game</h2>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or join existing</span>
        </div>
      </div>

      <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="roomId" className="text-sm font-medium">Room ID</label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toLowerCase())}
            placeholder="e.g. abcd"
            className="border p-2 rounded-md"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="border p-2 rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !roomId || !name}
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
}
