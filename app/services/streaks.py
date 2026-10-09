from datetime import date, timedelta
from typing import Sequence


def calculate_current_streak(dates: Sequence[date], today: date | None = None) -> int:
    if today is None:
        today = date.today()
    date_set = set(dates)
    if not date_set:
        return 0

    if today in date_set:
        streak = 0
        cursor = today
        while cursor in date_set:
            streak += 1
            cursor -= timedelta(days=1)
        return streak
    elif (today - timedelta(days=1)) in date_set:
        streak = 0
        cursor = today - timedelta(days=1)
        while cursor in date_set:
            streak += 1
            cursor -= timedelta(days=1)
        return streak
    return 0


def calculate_longest_streak(dates: Sequence[date]) -> int:
    """Calculate the longest streak of consecutive check-in dates."""
    sorted_unique_dates = sorted(set(dates))
    if not sorted_unique_dates:
        return 0

    longest = 1
    current = 1
    for i in range(1, len(sorted_unique_dates)):
        if sorted_unique_dates[i] - sorted_unique_dates[i - 1] == timedelta(days=1):
            current += 1
            if current > longest:
                longest = current
        else:
            current = 1
    return longest


def calculate_completion_rate(
    dates: Sequence[date],
    habit_created_at: date | None = None,
    today: date | None = None,
) -> float:
    if today is None:
        today = date.today()
    unique_dates = set(dates)
    if not unique_dates:
        return 0.0

    if habit_created_at is None:
        habit_created_at = min(unique_dates)

    total_days = (today - habit_created_at).days + 1
    if total_days <= 0:
        total_days = 1

    rate = len(unique_dates) / total_days
    return round(min(1.0, max(0.0, rate)), 2)


def calculate_habit_stats(
    dates: Sequence[date],
    habit_created_at: date | None = None,
    today: date | None = None,
) -> dict:
    "habit stats"
    return {
        "current_streak": calculate_current_streak(dates, today),
        "longest_streak": calculate_longest_streak(dates),
        "completion_rate": calculate_completion_rate(dates, habit_created_at, today),
    }
