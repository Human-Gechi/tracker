import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        # Store emails lowercase
        return v.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: dt.datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HabitBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=200)


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=200)
    is_archived: bool | None = None

    @field_validator("name", "is_archived")
    @classmethod
    def not_null_when_sent(cls, v):
        if v is None:
            raise ValueError("This field cannot be null")
        return v


class HabitRead(HabitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_archived: bool
    created_at: dt.datetime


class CheckInCreate(BaseModel):
    date: dt.date | None = None


class CheckInRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    habit_id: int
    date: dt.date


class HabitStats(BaseModel):
    """Response for GET /habits/{id}/stats."""

    current_streak: int = Field(ge=0)
    longest_streak: int = Field(ge=0)
    completion_rate: float = Field(ge=0, le=1)


class TodayItem(BaseModel):
    habit_id: int
    name: str
    done_today: bool
    current_streak: int = Field(ge=0)


class ErrorResponse(BaseModel):
    detail: str
