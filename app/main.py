from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.routers.auth import auth_router
from app.routers.checkins import checkin_router
from app.routers.habits import habit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"Message": "Welcome to Trackr API"}


app.include_router(auth_router)
app.include_router(checkin_router)
app.include_router(habit_router)
