from app.security import verify_token
from app.database import get_db
from sqlalchemy.orm import Session
from app.security import oauth2_scheme
from fastapi import Depends
from fastapi import HTTPException, status
from app.models import User


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):

    token_data = verify_token(token)
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
