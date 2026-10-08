from app.database import get_db
from fastapi import Depends
from sqlalchemy.orm.session import Session
from fastapi import APIRouter, HTTPException, status
from app.schemas import UserCreate, UserRead
from app.models import User
from app.security import get_password_hash


auth_router = APIRouter(tags=["Auth"], prefix="/auth")


@auth_router.post(
    "/register", response_model=UserRead, status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_pwd=hashed_password)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
