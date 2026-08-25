import pytest
from tests.conftest import client,create_test_user,login_test_user,auth_header


def test_create_user_validation_error(client):
    user_data={"username":"testuser"}
    response=client.post("/users/signup",json=user_data)
    assert response.status_code==422

def test_create_user_success(client):
    user_data={"name":"testuser","email":"testuser@example.com","password":"testpassword","address":"testaddress"}
    response=client.post("/users/signup",json=user_data)
    assert response.status_code==201

def test_create_user_dublicate_email(client,create_test_user):
    create_test_user
    user_data={"name":"testuser","email":"testuser@example.com","password":"testpassword","address":"testaddress"}
    response=client.post("/users/signup",json=user_data)
    assert response.status_code==409


def test_login_user_sucess(client,create_test_user):
    login_data={"username":"testuser@example.com","password":"testpassword"}
    response=client.post("/users/login",data=login_data)
    assert response.status_code==200

def test_login_user_invalid_credentials(client,create_test_user):
    login_data={"username":"testuser@example.com","password":"wrongpassword"}
    response=client.post("/users/login",data=login_data)
    assert response.status_code==401
    