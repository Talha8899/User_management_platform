from datetime import datetime,timezone,timedelta
from fastapi import HTTPException,Depends
import jwt
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from pydentic_config import settings
from database_dependencies import get_db
from sqlalchemy.orm import Session
import database_model as database_model
"""this lines tells and store the argon 2 recomended settings 
for password hashing and verifaction in passwordhasher variable """

password_hasher=PasswordHash.recommended()

Oauth_scheme=OAuth2PasswordBearer(tokenUrl="/users/login")

def hash_password(password:str) -> str :
    """this function hash the  plain password and return it"""
    return password_hasher.hash(password)

def verify_password(plain_password:str,hashed_password:str) -> bool:
    """this function verify the plain password 
    with hashed password and return true or false"""
    return password_hasher.verify(plain_password,hashed_password)

def access_token(data:dict):
    """this function create access token for user and return it"""
    """copying data into to_encode varible to avoid original data changes"""
    to_encode=data.copy()
    #creating a expire time for the token to expire
    exp_time=datetime.now(timezone.utc)+timedelta(minutes=settings.access_token_expire_time)
    #add expire time to the to_encoded data dict to make it expire 
    to_encode.update({"exp":exp_time})
    #encoding the data into jwt token and return it
    token=jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm
    )
    return token

def verify_access_token(token:str):
    """this function verify the access token and return the data in it"""
    try:
        data=jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm]
        )
        return data
    
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")


def get_logged_in_user(token:str=Depends(Oauth_scheme),db:Session=Depends(get_db)):
    """verify the access token"""
    payload=verify_access_token(token)
    emp_id=payload.get("sub")
    if emp_id is None:
        raise HTTPException(status_code=401, detail="Invalid  or expired token")
    
    try:
        emp_id=int(emp_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid  or expired token")

    """getting logged-in user"""
    user=db.query(database_model.User_data).filter(database_model.User_data.emp_id==emp_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

def require_admin(current_user:database_model.User_data=Depends(get_logged_in_user)):
    """this function check if the logged-in user is admin or not"""
    if not current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user