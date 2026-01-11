from enum import Enum as EnumType
from sqlalchemy import create_engine, Column, Integer, String
import sqlalchemy
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.types import Boolean
from sqlalchemy import Enum
from pydantic import BaseModel, ConfigDict
from contextlib import contextmanager

DATABASE_URL = "sqlite:///./yaaru.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.orm.declarative_base()

class Status(EnumType):
    LOBBY = "LOBBY"
    PLAYING = "PLAYING"
    FINISHED = "FINISHED"

class Games(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True, unique=True)
    status = Column(Enum(Status), index=True)
    word = Column(String, index=True)
    impostor_id = Column(Integer, index=True)


class Players(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, index=True)
    name = Column(String, index=True)
    client_id = Column(String, index=True)
    is_host = Column(Boolean, index=True)


class RoomCreateResponse(BaseModel):
    room_id: str
    player_id: str


class JoinRoomRequest(BaseModel):
    name: str


class JoinRoomResponse(BaseModel):
    player_id: str


class GameStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    room_id: str
    status: Status
    word: str | None = None
    impostor_name: str | None = None


Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



