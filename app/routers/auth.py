from app.config import settings
from app.security import verify_password
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas import Token
from app.database import get_db
from fastapi import Depends
from sqlalchemy.orm.session import Session
from fastapi import APIRouter, HTTPException, status
from app.schemas import UserCreate, UserRead
from app.models import User
from app.security import get_password_hash, create_access_token
from datetime import timedelta

auth_router = APIRouter(tags=["Auth"], prefix="/auth")


@auth_router.post(
    "/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, password_hashed=hashed_password)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@auth_router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user_query = db.query(User).filter(User.email == form_data.username).first()

    if not user_query or not verify_password(
        form_data.password, user_query.password_hashed
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wrong Info",
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user_query.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
