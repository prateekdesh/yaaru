from database import Status, Players, get_db, RoomCreateResponse, JoinRoomResponse, JoinRoomRequest, Games, SessionLocal
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from handlers.room import create_room
from handlers.room import check_room_exists
from handlers.room import generate_client_id
from handlers.room import start_game
from handlers.room import expose_word
from handlers.room import finish_game
from sqlalchemy.orm import Session
from connection_manager import manager

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; in production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Yaaru?"}

@app.post("/create-room", response_model=RoomCreateResponse)
def create_room_endpoint(request: JoinRoomRequest):
    game, player = create_room(name=request.name)
    return RoomCreateResponse(room_id=game.room_id, player_id=player.client_id)

@app.post("/join-room/{room_id}", response_model=JoinRoomResponse)
def join_room(room_id: str, request: JoinRoomRequest, db: Session = Depends(get_db)):
    game = check_room_exists(room_id)
    if game and game.status == Status.LOBBY:
        player = Players(game_id=game.id, name=request.name, client_id=generate_client_id(), is_host=False)
        db.add(player)
        db.commit()
        db.refresh(player)
        return JoinRoomResponse(player_id=player.client_id)
    else:
        raise HTTPException(status_code=404, detail="Room not found or not in lobby")

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    game = check_room_exists(room_id)
    if not game:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id, client_id)

    with SessionLocal() as db:
        player = db.query(Players).filter(Players.client_id == client_id).first()
        player_name = player.name if player else "Unknown"
        
        # Also send the current list of players to the new joiner
        all_players = db.query(Players).filter(Players.game_id == game.id).all()
        for p in all_players:
            await manager.send_personal_message({
                "event": "player_joined",
                "player_name": p.name,
                "client_id": p.client_id
            }, room_id, client_id)

    await manager.broadcast({
        "event": "player_joined",
        "player_name": player_name,
        "client_id": client_id
    }, room_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "start":
                updated_game = start_game(game.id)
                if updated_game:
                    with SessionLocal() as db:
                        players = db.query(Players).filter(Players.game_id == game.id).all()
                        impostor_player = db.query(Players).filter(Players.id == updated_game.impostor_id).first()
                        
                        for p in players:
                            is_impostor = p.id == updated_game.impostor_id
                            await manager.send_personal_message({
                                "event": "game_started",
                                "status": updated_game.status.value,
                                "word": "???" if is_impostor else updated_game.word,
                                "is_impostor": is_impostor
                            }, room_id, p.client_id)
            
            elif data == "expose":
                game_info = expose_word(game.id)
                if game_info:
                    finish_game(game.id)
                    await manager.broadcast({
                        "event": "game_over",
                        "word": game_info.word,
                        "impostor_name": game_info.impostor_name,
                        "status": Status.FINISHED.value
                    }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id)
