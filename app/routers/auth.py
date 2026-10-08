from app.database import get_db
from sqlalchemy.orm import Session
from app.security import oauth2_scheme
from fastapi import Depends


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):

    pass
