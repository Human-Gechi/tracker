# Trackr

Trackr is a minimalist, distraction-free habit tracking application and streak engine. Built with FastAPI and modern Vanilla JavaScript, it offers daily ritual check-ins, streak calculations, completion analytics, and a responsive web interface with dark and light themes.

> #### *Note the Frontend was coded by Gemini. I am not much of a frontend developer.*

---

## Features

- **Authentication & Security**: User registration with strict password complexity requirements, Argon2 password hashing via Passlib, and OAuth2 JWT bearer token authentication.
- **Habit Management**: Create, edit, archive, unarchive, and delete habits with custom descriptions.
- **Daily Rituals & Check-Ins**: Mark habits complete for today or log past dates, with built-in safeguards against duplicate check-ins, future-dated check-ins, and archived habits.
- **Streak & Analytics Engine**:
  - **Current Streak**: Real-time streak tracking with a grace period for the current day.
  - **Longest Streak**: Historical record of consecutive completion days.
  - **Completion Rate**: Accurate lifetime completion percentage based on creation date.
- **Interactive API Documentation**: Auto-generated OpenAPI (Swagger UI) and ReDoc documentation.

---

## Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database**: [SQLite](https://www.sqlite.org/) via [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **Validation & Settings**: [Pydantic v2](https://docs.pydantic.dev/) and [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Security & Tokens**: [python-jose](https://github.com/mpdavis/python-jose), [passlib](https://passlib.readthedocs.io/), and [argon2-cffi](https://argon2-cffi.readthedocs.io/)

### Frontend
- **Markup & Layout**: Semantic HTML5
- **Styling**: Vanilla CSS3 design system with custom CSS variables, responsive grid and flexbox layouts, and theme switching
- **Logic**: Vanilla JavaScript (ES6+) with native `fetch` API and client-side state handling
- **Typography**: Google Fonts (Plus Jakarta Sans and JetBrains Mono)

### Tooling
- **Linter & Formatter**: [Ruff](https://astral.sh/ruff)

---

## Project Structure

```text
trackr/
├── app/
│   ├── __init__.py
│   ├── config.py          # Settings and environment configuration
│   ├── database.py        # SQLAlchemy engine, session maker, get_db dependency
│   ├── dependencies.py    # Authentication dependency (get_current_user)
│   ├── main.py            # FastAPI application, CORS, routers, static files mount
│   ├── models.py          # SQLAlchemy ORM models (User, Habit, Checkin)
│   ├── schemas.py         # Pydantic schemas and input validators
│   ├── security.py        # Password hashing and JWT encoding/decoding
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py        # Authentication routes (signup, login)
│   │   ├── checkins.py    # Check-in, stats, and today view routes
│   │   └── habits.py      # Habit CRUD routes
│   └── services/
│       ├── __init__.py
│       └── streaks.py     # Streak calculation and analytics service
├── frontend/
│   ├── app.js             # Client state management, API calls, DOM handlers
│   ├── index.html         # Single-page application template
│   └── styles.css         # Design tokens, theme variables, and component styles
├── .env.example           # Example environment variables
├── requirements.txt       # Project dependencies
└── README.md              # Project documentation
```

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Human-Gechi/tracker.git
cd tracker
```

### 2. Create and Activate a Virtual Environment

On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

On Windows (Command Prompt):
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains a secret key:
```env
SECRET_KEY=your_secret_key_here
```

*(Note: SQLite database tables are created automatically on startup at `trackr.db`.)*

### 5. Run the Application
Start the development server with Uvicorn:

```bash
uvicorn app.main:app --reload
```

The application will be accessible at:
- **Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## API Overview

All API endpoints except `/auth/*` and `/api` require a valid JWT Bearer token in the `Authorization` header (`Bearer <token>`).

### Authentication (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register a new user account with email and password |
| `POST` | `/auth/login` | Authenticate using form credentials and receive a JWT token |

### Habits (`/habits`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/habits/` | Create a new habit |
| `GET` | `/habits/all-habits` | Retrieve all habits for the authenticated user |
| `GET` | `/habits/{id}` | Retrieve details for a specific habit |
| `PUT` | `/habits/{id}` | Update habit name, description, or archived status |
| `DELETE` | `/habits/{id}` | Delete a habit and its associated data |

### Check-Ins & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/habits/today` | List active habits, today completion status, and streaks |
| `GET` | `/today` | Alias for `/habits/today` |
| `POST` | `/habits/{id}/checkins` | Check in for today or a specified date (`YYYY-MM-DD`) |
| `DELETE` | `/habits/{id}/checkins/{date}` | Remove a check-in for a specific date |
| `GET` | `/habits/{id}/stats` | Get current streak, longest streak, and completion rate |

### Utility
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | Root API health status message |

---

## Code Quality & Testing

### Linting and Formatting
Check code rules and automatically apply fixes using Ruff:
```bash
ruff check --fix
ruff format
```

### Running Tests
Execute the test suite using pytest:
```bash
pytest
```

---

## License

This project is licensed under the MIT License.
