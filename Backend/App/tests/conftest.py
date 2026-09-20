import os

# Tests currently use a dedicated local PostgreSQL database.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "sqlite:///./test.db"
)
os.environ.setdefault("FRONTEND_BASE_URL", "http://localhost:3000")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("SECRET_KEY_PASSWORD_RESET", "test-reset-secret-key")
os.environ.setdefault("RESEND_API_KEY", "test-resend-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database_dependencies import get_db
from database_model import Base


@pytest.fixture(scope="session")
def test_engine():
    test_db_url = os.environ.get("DATABASE_URL")
    test_engine = create_engine(test_db_url)
    try:
        yield test_engine
    finally:
        test_engine.dispose()


@pytest.fixture(scope="session")
def test_db_setup(test_engine):
    # Create the schema once for the test session and remove it afterward.
    with test_engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
    try:
        yield
    finally:
        with test_engine.begin() as conn:
            Base.metadata.drop_all(bind=conn)
        test_engine.dispose()


@pytest.fixture
def db_session(test_engine):
    # Wrap each test in a transaction so test data can be rolled back.
    conn = test_engine.connect()
    trans = conn.begin()
    local_session = sessionmaker(
        bind=conn,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )

    with local_session() as session:
        try:
            yield session
        finally:
            session.close()
            trans.rollback()
            conn.close()


@pytest.fixture
def client(db_session):
    # Replace the production database dependency with the test session.
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_test_user(
    client,
    username: str = "testuser",
    email: str = "testuser@example.com",
    password: str = "testpassword",
    address: str = "testaddress",
):
    user_data = {
        "name": username,
        "email": email,
        "password": password,
        "address": address,
    }
    response = client.post("/users/signup", json=user_data)
    assert response.status_code == 201, "failed to create user"
    return response.json()


def login_test_user(
    client, username: str = "testuser@example.com", password: str = "testpassword"
):
    login_data = {"username": username, "password": password}
    response = client.post("/users/login", data=login_data)
    assert response.status_code == 200, "failed to login user"
    return response.json()["access_token"]


def auth_header(token: str):
    """Build the bearer header used by protected endpoint tests."""
    return {"Authorization": f"Bearer {token}"}
