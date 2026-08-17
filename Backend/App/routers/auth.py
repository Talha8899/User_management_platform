import database_model as database_model
from Schemas import User_Add
from fastapi import HTTPException,Depends,APIRouter
from sqlalchemy.orm import Session
from database_dependencies import get_db
from database_model import User_data
from fastapi.security import OAuth2PasswordRequestForm
from auth_dependencies import access_token, hash_password,verify_password

router=APIRouter(tags=["authentication"])

#route for  new user signup
@router.post("/users/signup")
def add_user(user:User_Add,db:Session=Depends(get_db)):
    """checking if user already exist or not"""
    db_user=db.query(database_model.User_data).filter(database_model.User_data.email==user.email).first()
    if db_user:
        raise HTTPException(status_code=409, detail="user already exists") 
    """adding user"""
    #Hashing the password before storing it in the database
    hashed_password=hash_password(user.password)
    new_user=database_model.User_data(**user.model_dump(exclude={"password"}), #mapping the user data to the database model except password
                password_hash=hashed_password)#mapping the hashed password to the database model
    db.add(new_user)
    db.commit()
    return {"message":"user signed up successfully", "status_code": 201}

#route for  existing user login
@router.post("/users/login")
def login(login:OAuth2PasswordRequestForm = Depends(),db:Session=Depends(get_db)):
    email=login.username.strip().lower()
    user=db.query(User_data).filter(User_data.email==email).first()
    if not user :
        raise HTTPException(status_code=401,detail="invalid credentials")
    verify=verify_password(login.password,user.password_hash)
    if not verify:
        raise HTTPException(status_code=401,detail="invalid credentials")
    
    token=access_token({"sub": str(user.emp_id)})

    return {"access_token":token,"token_type":"bearer"}
