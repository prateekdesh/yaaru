export type GameStatus = "LOBBY" | "PLAYING" | "FINISHED";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface RoomCreateResponse {
  room_id: string;
  player_id: string;
}

export interface JoinRoomResponse {
  player_id: string;
}

export interface GameEvent {
  event: "player_joined" | "game_started" | "game_over";
  player_name?: string;
  client_id?: string;
  status?: GameStatus;
  word?: string;
  impostor_name?: string;
}
