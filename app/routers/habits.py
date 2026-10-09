from app.models import User, Habit
from app.dependencies import get_current_user
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas import HabitCreate, HabitRead, HabitUpdate

habit_router = APIRouter(tags=["Habit"], prefix="/habits")


@habit_router.post("/", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit: HabitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    new_habit = Habit(name=habit.name, description=habit.description, user_id=user.id)

    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)

    return new_habit


@habit_router.get(
    "/all-habits", response_model=list[HabitRead], status_code=status.HTTP_200_OK
)
def get_all_habits(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    all_habits = db.query(Habit).filter(Habit.user_id == user.id).all()
    return all_habits


@habit_router.get("/{id}", response_model=HabitRead, status_code=status.HTTP_200_OK)
def get_habit(
    id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    habit = db.query(Habit).filter(Habit.user_id == user.id, Habit.id == id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )
    return habit


@habit_router.put("/{id}", response_model=HabitRead, status_code=status.HTTP_200_OK)
def update_habit(
    id: int,
    habit_data: HabitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    habit = db.query(Habit).filter(Habit.user_id == user.id, Habit.id == id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found"
        )

    update_dict = habit_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return habit


@habit_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    habit = db.query(Habit).filter(Habit.user_id == user.id, Habit.id == id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found"
        )

    db.delete(habit)
    db.commit()

    return None
