# User Management API

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?logo=sqlalchemy&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Professional RESTful User Management API built with **FastAPI**, **SQLAlchemy**, and **JWT authentication**.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
  - [Option A: SQLite (Quick Start)](#option-a-sqlite-quick-start)
  - [Option B: PostgreSQL (Production-Friendly)](#option-b-postgresql-production-friendly)
- [Installation & Run](#installation--run)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [1) Health Check](#1-health-check)
  - [2) Sign Up](#2-sign-up)
  - [3) Login](#3-login)
  - [4) Get Current User](#4-get-current-user)
  - [5) List Users](#5-list-users)
  - [6) Get User by ID](#6-get-user-by-id)
  - [7) Update User by ID](#7-update-user-by-id)
  - [8) Delete User by ID](#8-delete-user-by-id)
- [API Docs](#api-docs)
- [Security Notes](#security-notes)
- [Roadmap / Improvements](#roadmap--improvements)
- [License](#license)

---

## Overview

This API provides secure user management with:

- user registration
- credential-based login
- JWT bearer authentication
- authenticated profile access
- full user CRUD operations

---

## Features

- Duplicate email protection on registration
- Argon2 password hashing (`pwdlib`)
- JWT access token generation and validation
- OAuth2 Password Flow (`application/x-www-form-urlencoded` login)
- Protected endpoints with bearer token auth
- SQLAlchemy ORM-based database integration
- Interactive OpenAPI docs (Swagger + ReDoc)

---

## Tech Stack

- **Framework:** FastAPI  
- **Language:** Python 3.10+  
- **ORM:** SQLAlchemy  
- **Auth:** OAuth2 Password Flow + JWT  
- **Password Hashing:** Argon2 (`pwdlib`)  
- **Config:** Pydantic Settings  
- **Database:** SQLite / PostgreSQL (via SQLAlchemy URL)

---

## Project Structure

```text
Backend/
└── App/
    ├── main.py
    ├── auth_dependencies.py
    └── routers/
        ├── auth.py
        ├── root.py
        └── users.py
```

---

## Environment Variables

Create a `.env` file (example below) in your application root (or where your settings loader expects it).

```env
# App
APP_NAME=User Management API
APP_ENV=development
DEBUG=true

# Security / JWT
SECRET_KEY=change-this-to-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database (choose one)
# SQLite:
DATABASE_URL=sqlite:///./users.db

# PostgreSQL example:
# DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/user_management_db
```

> ✅ Use a strong random `SECRET_KEY` in production.

---

## Database Setup

### Option A: SQLite (Quick Start)

No separate database server required.

1. Set in `.env`:
   ```env
   DATABASE_URL=sqlite:///./users.db
   ```
2. Run the app.
3. SQLite DB file (`users.db`) will be created automatically (depending on your model/init flow).

---

### Option B: PostgreSQL (Production-Friendly)

1. Install PostgreSQL and create a database:
   ```sql
   CREATE DATABASE user_management_db;
   ```
2. Update `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/user_management_db
   ```
3. Ensure `psycopg2` (or `psycopg[binary]`) is installed in your dependencies.
4. Start the API.

---

## Installation & Run

```bash
# 1) Clone
git clone https://github.com/Talha8899/user-managment-api-.git
cd user-managment-api-

# 2) (Recommended) create virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# 3) Install dependencies
pip install -r requirements.txt
```

Start server (from directory containing `main.py`):

```bash
uvicorn main:app --reload
```

If `main.py` is nested, run with module path, for example:

```bash
uvicorn Backend.App.main:app --reload
```

---

## Authentication

After login, include JWT token in header:

```http
Authorization: Bearer <access_token>
```

---

## API Endpoints

Base URL (local): `http://127.0.0.1:8000`

---

### 1) Health Check

**Endpoint:** `GET /`

#### Request

```http
GET /
```

#### Response (200)

```json
{
  "message": "API is running"
}
```

---

### 2) Sign Up

**Endpoint:** `POST /users/signup`

#### Request

```http
POST /users/signup
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main Street",
  "password": "StrongPassword123"
}
```

#### Response (201 or 200)

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main Street"
}
```

#### Error Example (409/400)

```json
{
  "detail": "Email already registered"
}
```

---

### 3) Login

**Endpoint:** `POST /users/login`

#### Request

```http
POST /users/login
Content-Type: application/x-www-form-urlencoded
```

```text
username=john@example.com&password=StrongPassword123
```

#### Response (200)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "bearer"
}
```

#### Error Example (401)

```json
{
  "detail": "Invalid credentials"
}
```

---

### 4) Get Current User

**Endpoint:** `GET /users/me`  
**Auth:** Required

#### Request

```http
GET /users/me
Authorization: Bearer <access_token>
```

#### Response (200)

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main Street"
}
```

#### Error Example (401)

```json
{
  "detail": "Could not validate credentials"
}
```

---

### 5) List Users

**Endpoint:** `GET /users`  
**Auth:** Typically required (depends on your router config)

#### Request

```http
GET /users
Authorization: Bearer <access_token>
```

#### Response (200)

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main Street"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "address": "45 Sunset Blvd"
  }
]
```

---

### 6) Get User by ID

**Endpoint:** `GET /users/{user_id}`  
**Auth:** Required

#### Request

```http
GET /users/1
Authorization: Bearer <access_token>
```

#### Response (200)

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main Street"
}
```

#### Error Example (404)

```json
{
  "detail": "User not found"
}
```

---

### 7) Update User by ID

**Endpoint:** `PUT /users/{emp_id}`  
**Auth:** Required

#### Request

```http
PUT /users/1
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "address": "999 New Address"
}
```

#### Response (200)

```json
{
  "id": 1,
  "name": "John Updated",
  "email": "john.updated@example.com",
  "address": "999 New Address"
}
```

#### Error Example (404)

```json
{
  "detail": "User not found"
}
```

---

### 8) Delete User by ID

**Endpoint:** `DELETE /users/{emp_id}`  
**Auth:** Required

#### Request

```http
DELETE /users/1
Authorization: Bearer <access_token>
```

#### Response (200)

```json
{
  "message": "User deleted successfully"
}
```

#### Error Example (404)

```json
{
  "detail": "User not found"
}
```

---

## API Docs

Once running:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

---

## Security Notes

- Passwords are hashed (never stored as plain text)
- JWTs are signed and validated on protected routes
- Token expiry is enforced
- Keep `SECRET_KEY` private and rotate if compromised
- Prefer HTTPS in production deployments
- Role-based authorization(RBAC)

---

## Roadmap / Improvements

- Pagination + filtering for `/users`
- Better validation/error schemas
- Unit/integration tests
- Docker + docker-compose
- CI pipeline (lint, test, security checks)
- Alembic migrations and seed scripts

---

## License

This project is licensed under the MIT License.
