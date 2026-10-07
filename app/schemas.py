from pickle import NONE
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, date


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserRead(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HabitBase(BaseModel):
    name: str = Field(description="", min_length=1, max_length=50)
    description: str | None = None


class HabitCreate(HabitBase):
    pass