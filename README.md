<div align="center">

# User Management Platform

<p><strong>A full-stack user management platform: a FastAPI backend with JWT authentication and role-based access, and a Next.js frontend with user profiles and an admin dashboard.</strong></p>

<p>
  <a href="https://fastapi.tiangolo.com"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white"></a>
  <a href="https://www.python.org"><img alt="Python" src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white"></a>
  <a href="https://www.sqlalchemy.org"><img alt="SQLAlchemy" src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white"></a>
  <a href="https://www.postgresql.org"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"></a>
  <a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev"><img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"></a>
  <img alt="Auth" src="https://img.shields.io/badge/Auth-JWT%20%2B%20Refresh%20Tokens-000000?style=flat-square&logo=jsonwebtokens&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-pytest-0A9EDC?style=flat-square&logo=pytest&logoColor=white">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green?style=flat-square"></a>
</p>

<p>
  <a href="#getting-started">Getting Started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#frontend">Frontend</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#security">Security</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database and Migrations](#database-and-migrations)
- [Frontend](#frontend)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

The platform covers the complete account lifecycle:

- **Backend:** a RESTful FastAPI service for registration, login, short-lived access tokens with rotating refresh tokens, password reset by email, profile management, and admin-only user administration.
- **Frontend:** a Next.js app with sign-up and login, a personal profile page with account activity, and an admin dashboard for browsing, creating, editing, and deleting users and seeing who is online.

The two halves live in one repository and talk over a JSON API, so you can run the whole stack locally or use the backend on its own with any client.

## Features

| Area | Capability |
| --- | --- |
| **Authentication** | OAuth2 password flow, signed JWT access tokens, rotating refresh tokens in an HttpOnly cookie |
| **Password security** | Argon2 hashing via `pwdlib`; plaintext passwords are never stored |
| **Password reset** | Email link (via Resend) with a short-lived, single-use, purpose-bound token |
| **Authorization** | Role-based access control: users manage their own profile, admins manage everyone |
| **Admin dashboard** | Paginated user table, search by ID, create / edit / delete, per-user login history |
| **Presence and activity** | Online/offline status from a heartbeat, plus login/logout history with configurable retention |
| **Validation** | Pydantic schemas: email format, password length, name and address rules, duplicate-email protection |
| **Persistence** | SQLAlchemy 2.x on PostgreSQL or SQLite, with Alembic migrations |
| **Quality** | Pytest suite for signup and login; ESLint and strict TypeScript on the frontend |
| **Documentation** | Interactive OpenAPI docs (Swagger UI and ReDoc) |

## Tech Stack

| Layer | Technology |
| --- | --- |
| **API framework** | [FastAPI](https://fastapi.tiangolo.com), Python 3.10+ |
| **Data** | [SQLAlchemy 2.x](https://www.sqlalchemy.org), [Alembic](https://alembic.sqlalchemy.org), PostgreSQL / SQLite |
| **Validation and config** | Pydantic, Pydantic Settings |
| **Auth** | OAuth2 Password Flow, PyJWT, Argon2 (`pwdlib`) |
| **Email** | [Resend](https://resend.com) |
| **Frontend** | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript, [Tailwind CSS 4](https://tailwindcss.com), lucide-react |
| **Testing and quality** | Pytest, FastAPI `TestClient`, ESLint |

## Architecture

### System overview

The application follows a clean, decoupled client-server architecture.

```mermaid
flowchart LR
    Client([Browser Client])
    
    subgraph Frontend [Next.js Frontend]
        UI[React UI / Server Components]
        State[Fetch Client]
    end
    
    subgraph Backend [FastAPI Backend]
        API[API Routers]
        AuthGuard[JWT / Argon2 Security]
        ORM[SQLAlchemy ORM]
    end
    
    subgraph External Services
        DB[(PostgreSQL / SQLite)]
        Resend[Resend Email API]
    end

    Client <-->|HTTPS| UI
    UI <--> State
    State <-->|REST API JSON| API
    API <--> AuthGuard
    API <--> ORM
    ORM <--> DB
    API -->|SMTP| Resend
```

### Session flow

Access tokens are short-lived and sent as a bearer header. Refresh tokens are opaque, stored only as hashes, delivered in an HttpOnly cookie, and rotated on every use.

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser
    participant A as FastAPI
    participant DB as Database

    U->>A: POST /users/login (email, password)
    A->>DB: Load user and verify Argon2 hash
    A->>DB: Store login event and hashed refresh token
    A-->>U: 200 access_token (JWT) and HttpOnly refresh cookie

    U->>A: GET /users/me (Bearer access token)
    A-->>U: 200 profile

    Note over U,A: Access token expires (401)

    U->>A: POST /users/refresh (refresh cookie)
    A->>DB: Validate hash, revoke old token, store new one
    A-->>U: 200 new access_token and rotated cookie

    U->>A: POST /users/logout (Bearer access token)
    A->>DB: Revoke refresh tokens and clear presence
    A-->>U: 204 and cookie cleared
```

### Password reset flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js
    participant A as FastAPI
    participant R as Resend

    U->>FE: Enter email on /passwordReset
    FE->>A: POST /users/password-reset/request
    A->>A: Sign short-lived reset token (separate secret)
    A->>R: Send email containing the reset link
    A-->>FE: Generic 200 message (no account enumeration)
    R-->>U: Email with link to /passwordReset/set-password
    U->>FE: Choose a new password
    FE->>A: POST /users/password-reset/confirm (token, password)
    A->>A: Verify token, mark it as used, save new Argon2 hash
    A-->>FE: 200 Password updated
```

### Data model

`user_activity` doubles as an audit log (login, logout, member since) and a session store (hashed refresh and reset tokens). Event types are `member_since`, `login`, `logout`, `refresh_token`, and `password_reset`. Rows older than `ACTIVITY_RETENTION_DAYS` are pruned automatically, except the `member_since` record.

```mermaid
erDiagram
    USERS ||--o{ USER_ACTIVITY : "has many"
    USERS {
        int emp_id PK
        string email
        string hashed_password
        string name
        string address
        string role "admin or user"
        boolean is_active
    }
    USER_ACTIVITY {
        int id PK
        int user_id FK
        string event_type "login, logout, refresh, reset"
        timestamp created_at
    }
```

## Project Structure

```text
User_management_platform/
├── Backend/
│   ├── requirements.txt                 # Pinned Python dependencies
│   └── App/
│       ├── main.py                      # FastAPI app, CORS, router registration
│       ├── auth_dependencies.py         # Argon2, JWT / refresh / reset tokens, current-user and admin guards
│       ├── database.py                  # Engine and session factory
│       ├── database_dependencies.py     # Per-request DB session dependency
│       ├── database_model.py            # ORM models: User_data, UserActivity
│       ├── pydentic_config.py           # Pydantic Settings (environment configuration)
│       ├── Schemas.py                   # Request and response schemas
│       ├── services.py                  # Password-reset email via Resend
│       ├── alembic.ini                  # Alembic configuration
│       ├── alembic/
│       │   ├── env.py
│       │   ├── script.py.mako
│       │   └── versions/                # Migration scripts
│       ├── routers/
│       │   ├── root.py                  # Health check
│       │   ├── auth.py                  # Signup, login, refresh, password reset
│       │   ├── users.py                 # Self-service: profile, activity, heartbeat, logout
│       │   └── admin.py                 # Admin: list, get, update, delete, user activity
│       ├── tests/
│       │   ├── conftest.py              # Fixtures and test database configuration
│       │   └── test_users.py            # Signup and login tests
│       └── .env.example                 # Backend environment template
├── frontend/
│   ├── app/
│   │   ├── layout.tsx · page.tsx        # Root layout and entry (login)
│   │   ├── config.ts                    # API base URL
│   │   ├── login/                       # Login form, shared auth layout, signup/
│   │   ├── me/                          # Profile and account activity
│   │   ├── passwordReset/               # Request link, set-password/
│   │   └── Admin/                       # Dashboard, users, settings, activity/[userId]
│   ├── public/                          # Static assets
│   ├── package.json
│   └── next.config.ts · tsconfig.json · eslint.config.mjs · postcss.config.mjs
├── assets/
│   ├── banner.svg                       # README banner
│   └── diagrams/                        # Architecture, data model, and route diagrams (SVG)
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10 or newer
- Node.js 20 or newer
- Git
- PostgreSQL (optional; SQLite works for a quick start)

### 1. Clone

```bash
git clone https://github.com/Talha8899/User_management_platform.git
cd User_management_platform
```

### 2. Run the backend

```bash
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r Backend/requirements.txt

cd Backend/App
cp .env.example .env                   # Windows: copy .env.example .env
# Edit .env (see Configuration below), then:

alembic upgrade head                   # create the database schema
uvicorn main:app --reload              # http://localhost:8000
```

Interactive API docs are served at **http://localhost:8000/docs**.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
npm install
npm run dev                            # http://localhost:3000
```

> **Tip:** use `localhost` for both the API and the frontend (not a mix of `localhost` and `127.0.0.1`). The refresh cookie is `SameSite=Lax`, so both must be on the same site.

### 4. Create your first admin

Sign-ups always create regular users. Register at `http://localhost:3000/login/signup`, then promote yourself directly in the database:

```bash
# SQLite
sqlite3 users.db "UPDATE users SET role = 'admin' WHERE email = 'you@example.com';"

# PostgreSQL (Docker example, see Database and Migrations)
docker exec -it user-mgmt-db psql -U postgres -d user_management_db \
  -c "UPDATE users SET role = 'admin' WHERE email = 'you@example.com';"
```

Sign in again (the role is embedded in the token at login) and you will be redirected to the admin dashboard at `/Admin`.

### Try the API in 60 seconds

```bash
# Register
curl -s -X POST http://localhost:8000/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","address":"123 Main Street","password":"StrongPassword123"}'

# Log in and capture the access token
TOKEN=$(curl -s -X POST http://localhost:8000/users/login \
  -d "username=john@example.com&password=StrongPassword123" \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Call a protected endpoint
curl -s http://localhost:8000/users/me -H "Authorization: Bearer $TOKEN"
```

## Configuration

The backend reads its settings from `Backend/App/.env`. Start from [`Backend/App/.env.example`](./Backend/App/.env.example) and never commit your real `.env`.

A minimal local configuration:

```env
DATABASE_URL=sqlite:///./users.db
SECRET_KEY=replace-with-a-long-random-secret
SECRET_KEY_PASSWORD_RESET=replace-with-a-different-long-random-secret
FRONTEND_BASE_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
RESEND_API_KEY=re_placeholder
REFRESH_COOKIE_SECURE=false
```

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `DATABASE_URL` | Yes | none | SQLAlchemy URL (SQLite or PostgreSQL) |
| `SECRET_KEY` | Yes | none | Signs access tokens |
| `SECRET_KEY_PASSWORD_RESET` | Yes | none | Separate secret for password-reset tokens |
| `FRONTEND_BASE_URL` | Yes | none | Base URL used to build password-reset links |
| `RESEND_API_KEY` | Yes | none | [Resend](https://resend.com) API key. Needed at startup; a real key is only required to actually send reset emails |
| `RESEND_FROM_EMAIL` | No | `onboarding@resend.dev` | Sender address for reset emails |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of allowed browser origins |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_TIME` | No | `30` | Access token lifetime, in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `1` | Refresh token lifetime, in days |
| `ACTIVITY_RETENTION_DAYS` | No | `15` | How long activity history is kept |
| `PASSWORD_RESET_EXPIRE_MINUTES` | No | `15` | Password-reset link lifetime |
| `REFRESH_COOKIE_NAME` | No | `refresh_token` | Refresh cookie name (keep the default) |
| `REFRESH_COOKIE_SECURE` | No | `false` | Set to `true` in production (HTTPS only) |
| `REFRESH_COOKIE_SAMESITE` | No | `lax` | `lax`, `strict`, or `none` (`none` requires `REFRESH_COOKIE_SECURE=true`) |

Generate strong secrets with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

The frontend reads two variables, set in `frontend/.env.local`:

| Variable | Required | Description |
| --- | :---: | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the API, for example `http://localhost:8000` |
| `NEXT_ALLOWED_DEV_ORIGINS` | No | Comma-separated extra origins allowed to load the dev server |

## Database and Migrations

**SQLite** needs no setup: set `DATABASE_URL=sqlite:///./users.db` and run the migrations.

**PostgreSQL** is recommended for production. To start a local instance with Docker:

```bash
docker run --name user-mgmt-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=user_management_db \
  -p 5432:5432 -d postgres:16
```

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/user_management_db
```

Run Alembic from `Backend/App/`, where `alembic.ini` lives:

```bash
# Apply all migrations (run this before the first start)
alembic upgrade head

# After changing database_model.py, generate a new migration
alembic revision --autogenerate -m "describe your change"
```

> The app also calls `create_all()` on startup as a convenience for empty databases. If tables already exist, `alembic upgrade head` will fail on the initial migration, so apply migrations first on new databases.

## Frontend

The frontend is a Next.js 16 App Router application in [`frontend/`](./frontend).

### Pages

| Route | Purpose | Access |
| --- | --- | --- |
| `/` and `/login` | Sign in; admins are redirected to `/Admin`, everyone else to `/me` | Public |
| `/login/signup` | Create an account | Public |
| `/passwordReset` | Request a password-reset email | Public |
| `/passwordReset/set-password?token=…` | Choose a new password from the emailed link | Reset token |
| `/me` | View and edit your profile and password, see your login history | Signed in |
| `/Admin` | Dashboard, user management, and admin settings | Admin |
| `/Admin/activity/[userId]` | Login and logout history for one user | Admin |

```mermaid
flowchart TD
    Start([User Visits App]) --> CheckAuth{Session Active / Cookie Exists?}
    
    %% Path A: Already Logged In
    CheckAuth -->|Yes| RoleCheck{Check User Role}
    
    %% Path B: Not Logged In
    CheckAuth -->|No| Login["Login Page (/login)"]
    
    %% Successful Login leads to Role Check
    Login -->|Successful Login| RoleCheck
    
    %% New User Signup Flow
    Login -->|New user? Click Register| Signup["Signup Page (/signup)"]
    Signup -->|Account Created| RedirectLogin["Redirect to Login"] --> Login
    
    %% Forgot Password Flow
    Login -->|Forgot Password?| ResetReq["Request Reset Link (/passwordReset)"]
    ResetReq -->|Submit Email & Click Link| ResetSet["Set New Password Page"]
    ResetSet -->|Password Updated| RedirectLogin2["Redirect to Login"] --> Login
    
    %% Role Routing Destinations
    RoleCheck -->|Role: Admin| AdminDash["Admin Dashboard (/Admin)"]
    RoleCheck -->|Role: Standard User| UserDash["User Profile (/me)"]
```
---

### Admin dashboard

- **Dashboard:** total, active, and offline user counts.
- **Users:** paginated table with "load more", lookup by user ID, and a modal to create, edit, or delete users.
- **User activity:** login and logout history plus the member-since date for any user.
- **Settings:** the signed-in administrator's profile.

### How it handles sessions

- The access token is kept in `sessionStorage`; the refresh token never touches JavaScript (HttpOnly cookie).
- `authenticatedFetch` retries a request once after refreshing the token when the API returns `401`.
- The admin page sends a heartbeat every 30 seconds so the user list can show who is online (a user counts as active if seen within the last two minutes).
- Route guards in the UI are a convenience only. Every protected endpoint enforces roles on the server.

### Scripts

```bash
npm run dev      # start the development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

<!-- Add screenshots once available, for example:
<p align="center">
  <img src="./assets/screenshots/admin-dashboard.png" alt="Admin dashboard" width="85%">
</p>
-->

## API Reference

**Base URL (local):** `http://localhost:8000` · Interactive docs: [`/docs`](http://localhost:8000/docs) (Swagger UI) and [`/redoc`](http://localhost:8000/redoc) (ReDoc)

### Endpoint overview

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness and database check |
| `POST` | `/users/signup` | Public | Register a new user |
| `POST` | `/users/login` | Public | Sign in; returns an access token and sets the refresh cookie |
| `POST` | `/users/refresh` | Refresh cookie | Rotate the refresh token and issue a new access token |
| `POST` | `/users/logout` | Bearer | Revoke refresh tokens and clear presence |
| `POST` | `/users/password-reset/request` | Public | Email a password-reset link |
| `POST` | `/users/password-reset/confirm` | Reset token | Set a new password |
| `GET` | `/users/me` | Bearer | Current user's profile |
| `PATCH` | `/users/update/me` | Bearer | Update your own name, email, address, or password |
| `GET` | `/users/me/activity` | Bearer | Your login and logout history (latest 50) |
| `POST` | `/users/me/heartbeat` | Bearer | Refresh your presence timestamp |
| `GET` | `/users` | Admin | Paginated user list (`skip`, `limit` 1–100, default 10) |
| `GET` | `/users/{user_id}` | Admin | Get one user |
| `PATCH` | `/users/{user_id}` | Admin | Update a user's name, email, address, or role |
| `DELETE` | `/users/{user_id}` | Admin | Delete a user (admins cannot delete themselves) |
| `GET` | `/users/{user_id}/activity` | Admin | A user's login and logout history (latest 100) |

Protected endpoints expect `Authorization: Bearer <access_token>`.

### Validation rules

| Field | Rule |
| --- | --- |
| `name` | 2–50 characters; stored lowercase |
| `email` | Valid email address; normalized to lowercase; unique |
| `address` | 1–100 characters and at least one letter |
| `password` | 8–50 characters |

### Endpoint details

<details>
<summary><strong>POST /users/signup</strong> · Register</summary>

```bash
curl -X POST http://localhost:8000/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main Street",
    "password": "StrongPassword123"
  }'
```

**201 Created**

```json
{ "message": "user signed up successfully" }
```

**409 Conflict**

```json
{ "detail": "user already exists" }
```

</details>

<details>
<summary><strong>POST /users/login</strong> · Sign in</summary>

OAuth2 password flow: the body is `application/x-www-form-urlencoded` and the email goes in the `username` field.

```bash
curl -i -X POST http://localhost:8000/users/login \
  -d "username=john@example.com&password=StrongPassword123"
```

**200 OK** (plus a `Set-Cookie: refresh_token=…; HttpOnly` header)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**401 Unauthorized**

```json
{ "detail": "invalid credentials" }
```

</details>

<details>
<summary><strong>POST /users/refresh</strong> · Rotate tokens</summary>

Send the refresh cookie set at login. Each refresh token can be used once; the response sets a new one.

```bash
curl -X POST http://localhost:8000/users/refresh --cookie "refresh_token=<token>"
```

**200 OK**

```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

**401 Unauthorized**

```json
{ "detail": "Invalid or expired refresh token" }
```

</details>

<details>
<summary><strong>GET /users/me</strong> · Current user</summary>

```bash
curl http://localhost:8000/users/me -H "Authorization: Bearer <access_token>"
```

**200 OK**

```json
{
  "emp_id": 2,
  "name": "john doe",
  "address": "123 Main Street",
  "role": "user",
  "email": "john@example.com",
  "is_active": true,
  "last_seen_at": "2026-09-20T12:25:05.238922Z"
}
```

</details>

<details>
<summary><strong>PATCH /users/update/me</strong> · Update your profile</summary>

Only the fields you send are changed. `password` is optional.

```bash
curl -X PATCH http://localhost:8000/users/update/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "address": "999 New Address" }'
```

**200 OK**

```json
{ "message": "user info updated successfully" }
```

</details>

<details>
<summary><strong>GET /users</strong> · List users (admin)</summary>

```bash
curl "http://localhost:8000/users?skip=0&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
```

**200 OK**

```json
{
  "users": [
    {
      "emp_id": 1,
      "name": "admin user",
      "address": "123 Main Street",
      "role": "admin",
      "email": "admin@example.com",
      "is_active": true,
      "last_seen_at": "2026-09-20T12:25:05.503403Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "skip": 0,
  "has_more": false
}
```

**403 Forbidden** (non-admin caller)

```json
{ "detail": "Admin privileges required" }
```

</details>

<details>
<summary><strong>PATCH /users/{user_id}</strong> · Update a user (admin)</summary>

```bash
curl -X PATCH http://localhost:8000/users/2 \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Jane Updated", "role": "admin" }'
```

**200 OK**

```json
{ "message": "user updated successfully" }
```

</details>

<details>
<summary><strong>DELETE /users/{user_id}</strong> · Delete a user (admin)</summary>

```bash
curl -X DELETE http://localhost:8000/users/2 \
  -H "Authorization: Bearer <admin_access_token>"
```

**200 OK**

```json
{ "message": "user deleted successfully" }
```

**403 Forbidden** (deleting your own account)

```json
{ "detail": "Admin cannot delete own account" }
```

</details>

<details>
<summary><strong>POST /users/password-reset/request</strong> and <strong>/confirm</strong> · Reset a password</summary>

```bash
# 1. Request the link (always returns the same message, whether or not the email exists)
curl -X POST http://localhost:8000/users/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{ "email": "john@example.com" }'

# 2. Set a new password using the token from the emailed link
curl -X POST http://localhost:8000/users/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{ "token": "<token-from-email>", "password": "NewStrongPassword123" }'
```

**200 OK**

```json
{ "message": "If the email is registered, a reset link was sent." }
```

```json
{ "message": "Password updated successfully. You can now sign in." }
```

**400 Bad Request** (expired, invalid, or already-used link)

```json
{ "detail": "Invalid or expired reset link" }
```

</details>

<details>
<summary><strong>GET /health</strong> · Health check</summary>

```bash
curl http://localhost:8000/health
```

**200 OK**

```json
{ "message": "healthy" }
```

Returns **503** when the database is unreachable.

</details>

### Error format

Errors return a JSON body with a `detail` field.

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid, expired, or already-used password-reset link |
| `401 Unauthorized` | Wrong credentials, or a missing, invalid, or expired token |
| `403 Forbidden` | Authenticated but not allowed (for example a non-admin calling an admin route) |
| `404 Not Found` | The requested user does not exist |
| `409 Conflict` | Email already registered |
| `422 Unprocessable Entity` | Request body failed validation |

## Testing

The suite uses `pytest` with FastAPI's `TestClient` and wraps each test in a rolled-back transaction, so it is designed for **PostgreSQL**. Point it at a dedicated database with `TEST_DATABASE_URL`:

```bash
# Create a test database (Docker example)
docker exec -it user-mgmt-db psql -U postgres -c "CREATE DATABASE testdb;"

# Run the tests
cd Backend/App
export TEST_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/testdb"
python -m pytest
```

> Use `python -m pytest` so the `Backend/App` modules are importable. Without `TEST_DATABASE_URL` the suite falls back to a local SQLite file, which does not isolate state between tests.

**Current coverage:** signup validation errors, successful signup, duplicate-email signup, and login (success and invalid credentials).

Frontend checks:

```bash
cd frontend
npm run lint
```

## Security

- **Passwords:** hashed with Argon2 (`pwdlib` recommended settings); never stored or returned in plaintext.
- **Access tokens:** signed JWTs with an enforced expiry (30 minutes by default) carrying the user ID and role.
- **Refresh tokens:** random opaque values stored only as SHA-256 hashes, delivered in an HttpOnly cookie, rotated on every use, and revoked on logout.
- **Password reset:** signed with a separate secret, bound to the `password_reset` purpose, short-lived, and single-use. The request endpoint answers identically for unknown emails.
- **Authorization:** roles are checked on the server (`require_admin`) for every admin route. Admins cannot delete their own account.
- **CORS:** only the origins listed in `CORS_ORIGINS` may call the API from a browser.

**Production checklist**

- [ ] Use long, random, and different values for `SECRET_KEY` and `SECRET_KEY_PASSWORD_RESET`
- [ ] Serve everything over HTTPS and set `REFRESH_COOKIE_SECURE=true`
- [ ] Host the frontend and API on the same site (for example `app.example.com` and `api.example.com`), or use `REFRESH_COOKIE_SAMESITE=none` together with `REFRESH_COOKIE_SECURE=true`
- [ ] Set `CORS_ORIGINS` and `FRONTEND_BASE_URL` to your real frontend URL
- [ ] Configure a real `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`
- [ ] Use PostgreSQL rather than SQLite
- [ ] Keep `.env` out of version control and rotate any secret that is ever exposed

## Roadmap

- [x] Registration, login, and role-based access control
- [x] Argon2 password hashing and JWT authentication
- [x] Refresh-token rotation and logout
- [x] Password reset by email
- [x] Pagination for the user list
- [x] Admin dashboard, user activity history, and presence
- [x] Alembic migrations and a Pytest suite for signup and login
- [ ] Docker and docker-compose setup
- [ ] CI pipeline (lint, test, security checks)
- [ ] Rate limiting for login and password-reset endpoints
- [ ] Require the current password for password changes and revoke sessions afterwards
- [ ] Tests for authenticated and admin endpoints, and for the frontend

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Make your changes and add or update tests
3. Run `python -m pytest` (backend) and `npm run lint` (frontend)
4. Commit using [Conventional Commits](https://www.conventionalcommits.org), for example `feat: add user search`
5. Push your branch and open a pull request describing the change

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

## Author

**Talha Abdul Sattar**

[![GitHub](https://img.shields.io/badge/GitHub-Talha8899-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Talha8899)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Talha%20Abdul%20Sattar-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://pk.linkedin.com/in/talha-abdul-sattar-4b4926389)

<div align="center">
<br />
<i>If this project helped you, consider giving it a star! ⭐</i>

</div>
