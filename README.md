# User Management API

A professional RESTful user management API built with FastAPI, SQLAlchemy, and JWT-based authentication.

## Overview

This project provides a secure backend API for managing users, including user registration, login, profile access, and full CRUD operations on user records. It uses password hashing and bearer token authentication to protect sensitive endpoints.

## Features

- User registration with duplicate email protection
- Secure login with hashed passwords
- JWT access token authentication
- Retrieve the authenticated user profile
- List all users
- Get a user by ID
- Update a user by ID
- Delete a user by ID
- FastAPI automatic interactive API documentation
- SQLAlchemy-based database integration

## Tech Stack

- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Authentication:** OAuth2 Password Flow + JWT
- **Password Hashing:** Argon2 via `pwdlib`
- **Configuration:** Pydantic settings
- **Database:** Relational database supported by SQLAlchemy

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

## Authentication

The API uses JWT bearer tokens. After logging in, include the token in the request header:

```http
Authorization: Bearer <access_token>
```

## API Endpoints

### Root

- `GET /` — Health check endpoint

### Authentication

- `POST /users/signup` — Register a new user
- `POST /users/login` — Log in and receive an access token

### Users

- `GET /users` — Get all users
- `GET /users/me` — Get the authenticated user
- `GET /users/{user_id}` — Get a user by ID
- `PUT /users/{emp_id}` — Update a user by ID
- `DELETE /users/{emp_id}` — Delete a user by ID

## Example Request Flow

### 1. Sign up

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

### 2. Log in

```http
POST /users/login
Content-Type: application/x-www-form-urlencoded
```

```text
username=john@example.com&password=StrongPassword123
```

Response:

```json
{
  "access_token": "your.jwt.token.here",
  "token_type": "bearer"
}
```

### 3. Access protected routes

```http
GET /users/me
Authorization: Bearer your.jwt.token.here
```

## Running the Project

### Prerequisites

- Python 3.10+
- A configured database
- Environment variables for your secret key and token settings

### Install dependencies

```bash
pip install -r requirements.txt
```

### Start the application

From the backend app directory:

```bash
uvicorn main:app --reload
```

Or run it from your configured project entry point if different.

## API Documentation

Once the server is running, you can explore the API using FastAPI's built-in docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Security Notes

- Passwords are never stored in plain text
- Authentication is handled using signed JWT access tokens
- Protected endpoints require a valid bearer token
- Token expiration is enforced

## Possible Improvements

- Add pagination and filtering for user listing
- Add role-based access control
- Add input validation and richer error responses
- Add automated tests
- Add Docker support and deployment configuration
- Add environment-specific configuration examples

## License

This project is licensed under the MIT License.
