from datetime import date
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Checkin, Habit, User
from app.schemas import CheckInCreate, CheckInRead, HabitStats, TodayItem
from app.services.streaks import calculate_current_streak, calculate_habit_stats

checkin_router = APIRouter(tags=["CheckIns"])


@checkin_router.post(
    "/habits/{id}/checkins",
    response_model=CheckInRead,
    status_code=status.HTTP_201_CREATED,
)
def create_checkin(
    id: int,
    checkin_data: CheckInCreate | None = Body(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    habit = db.query(Habit).filter(Habit.id == id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    # Prevent check-ins on archived habits
    if habit.is_archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in to an archived habit",
        )

    target_date = (
        checkin_data.date if (checkin_data and checkin_data.date) else date.today()
    )
    if target_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in for a future date",
        )

    existing_checkin = (
        db.query(Checkin)
        .filter(Checkin.habit_id == habit.id, Checkin.date == target_date)
        .first()
    )
    if existing_checkin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Habit already checked in for this date",
        )

    new_checkin = Checkin(habit_id=habit.id, date=target_date)
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)

    return new_checkin


@checkin_router.delete(
    "/habits/{id}/checkins/{date}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_checkin(
    id: int,
    date: date,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    habit = db.query(Habit).filter(Habit.id == id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    checkin = (
        db.query(Checkin)
        .filter(Checkin.habit_id == habit.id, Checkin.date == date)
        .first()
    )
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found",
        )

    db.delete(checkin)
    db.commit()


@checkin_router.get("/habits/{id}/stats", response_model=HabitStats)
def get_habit_stats(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    habit = db.query(Habit).filter(Habit.id == id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )

    checkins = db.query(Checkin).filter(Checkin.habit_id == habit.id).all()
    checkin_dates = [c.date for c in checkins]
    habit_created = habit.created_at.date() if habit.created_at else None
    return calculate_habit_stats(checkin_dates, habit_created_at=habit_created)


@checkin_router.get("/habits/today", response_model=list[TodayItem])
@checkin_router.get("/today", response_model=list[TodayItem])
def get_habits_today(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    habits = (
        db.query(Habit)
        .filter(Habit.user_id == user.id, Habit.is_archived.is_(False))
        .all()
    )
    today = date.today()
    items: list[TodayItem] = []
    for habit in habits:
        checkins = db.query(Checkin).filter(Checkin.habit_id == habit.id).all()
        checkin_dates = [c.date for c in checkins]
        done_today = today in checkin_dates
        streak = calculate_current_streak(checkin_dates, today=today)
        items.append(
            TodayItem(
                habit_id=habit.id,
                name=habit.name,
                done_today=done_today,
                current_streak=streak,
            )
        )
    return items
