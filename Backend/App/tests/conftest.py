import os
os.environ["DATABASE_URL"] = ("postgresql://postgres:your_password@localhost:5432/testdb")

import pytest
from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker
from main import app
from database_dependencies import get_db
from database_model import Base
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def test_engine():
    test_db_url= os.environ.get("DATABASE_URL")
    tast_engine=create_engine(test_db_url)
    try:
        yield tast_engine
    finally:
        tast_engine.dispose()
#test_session=sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session")
def test_db_setup(test_engine):
    with test_engine.begin()as conn:
        Base.metadata.create_all(bind=conn)
    try:
        yield
    finally:
        with test_engine.begin()as conn:
            Base.metadata.drop_all(bind=conn)
        test_engine.dispose()

@pytest.fixture
def db_session(test_engine):
    conn=test_engine.connect()
    trans=conn.begin()
    local_session=sessionmaker(bind=conn,expire_on_commit=False,join_transaction_mode="create_savepoint")

    with local_session() as session:
        try:
            yield session
        finally:
            session.close()
            trans.rollback()
            conn.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    app.dependency_overrides[get_db]=override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def create_test_user(client,username:str="testuser",email:str="testuser@example.com",password:str="testpassword", address:str="testaddress"):
    user_data={"name":username,"email":email,"password":password,"address":address}
    response=client.post("/users/signup",json=user_data)
    assert response.status_code==201,f"failed to create user"
    return response.json()

def login_test_user(client,username:str="testuser",password:str="testpassword"):
    login_data={"username":username,"password":password}
    response=client.post("/auth/login",data=login_data)
    assert response.status_code==200,f"failed to login user"
    return response.json()["access_token"]

def auth_header(token:str):
    return {"Authorization":f"Bearer {token}"}

