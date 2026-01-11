import string
from database import get_db, Games, Status, Players, GameStatus, SessionLocal
import random

def generate_client_id():
    threshold = 10
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=threshold))

def generate_room_id():
    threshold = 4
    return "".join(random.choices(string.ascii_lowercase, k=threshold))

def create_room(name: str = "HOST"):
    with SessionLocal() as db:
        game = Games(room_id=generate_room_id(), status=Status.LOBBY, word="WORD")
        db.add(game)
        db.flush()  # Generate game.id
        player = Players(game_id=game.id, name=name, client_id=generate_client_id(), is_host=True)
        db.add(player)
        db.commit()
        db.refresh(game)
        db.refresh(player)
        return game, player

def check_room_exists(room_id: str) -> Games | None:
    with SessionLocal() as db:
        game = db.query(Games).filter(Games.room_id == room_id).first()
        if game:
            return game
        else:
            return None

def finish_game(game_id: int):
    with SessionLocal() as db:
        game = db.query(Games).filter(Games.id == game_id).first()
        if game:
            game.status = Status.FINISHED
            db.commit()
            db.refresh(game)
            return game
        else:
            return None

def generate_word():
    words = ["apple", "banana", "cat"]
    return random.choice(words)

def start_game(game_id: int):
    with SessionLocal() as db:
        game = db.query(Games).filter(Games.id == game_id).first()
        if game:
            word = generate_word()
            game.word = word
            game.status = Status.PLAYING
            
            # Pick a random player as impostor
            players = db.query(Players).filter(Players.game_id == game_id).all()
            if players:
                impostor = random.choice(players)
                game.impostor_id = impostor.id
            
            db.commit()
            db.refresh(game)
            return game
        else:
            return None

def expose_word(game_id: int):
    with SessionLocal() as db:
        game = db.query(Games).filter(Games.id == game_id).first()
        if game:
            word = game.word
            impostor_id = game.impostor_id
            impostor_name = db.query(Players).filter(Players.id == impostor_id).first().name
            return GameStatus(
                room_id=game.room_id,
                status=game.status,
                word=word,
                impostor_name=impostor_name
            )
        else:
            return None