from fastapi import HTTPException,Depends
from Schemas import user_response,user_update
from Schemas import user_response_logged_in
import database_model as database_model
from database_dependencies import get_db
from sqlalchemy.orm import Session
from fastapi import APIRouter
from auth_dependencies import get_logged_in_user

router=APIRouter(tags=["users"])


#route to get all users available in database
@router.get("/users",response_model=list[user_response])
def get_all_users(db:Session=Depends(get_db),
            current_user:database_model.User_data=Depends(get_logged_in_user)):
    """for getting data of all users"""
    db_users=db.query(database_model.User_data).all()
    return db_users

#route to get logged-in user data
@router.get("/users/me", response_model=user_response_logged_in)
def logged_in_user(current_user:database_model.User_data=Depends(get_logged_in_user)):
    return current_user

#route to get a specific user by ID
@router.get("/users/{user_id}",response_model=user_response,)
def get_user_with_id(user_id:int,db:Session=Depends(get_db),current_user:database_model.User_data=Depends(get_logged_in_user)):
    """for getting specific users by id """
    user=db.query(database_model.User_data).filter(database_model.User_data.emp_id==user_id).first()
    if user:
        return user
        
    raise HTTPException(status_code=404, detail="user not found")

#route to update a specific user by ID
@router.put("/users/{emp_id}")
def update_the_user(emp_id:int, update_user:user_update,db:Session=Depends(get_db),current_user:database_model.User_data=Depends(get_logged_in_user)):
    """updating user""" 
    db_user=db.query(database_model.User_data).filter(database_model.User_data.emp_id==emp_id).first()
    if db_user:
        db_user.name=update_user.name
        db_user.email=update_user.email
        db_user.address=update_user.address
        db.commit()
        return {"message":"user updated successfully"}
    else:    
        raise HTTPException(status_code=404, detail="user not found")

#route to delete a specific user by ID
@router.delete("/users/{emp_id}")
def delete_user(emp_id:int,db:Session=Depends(get_db),current_user:database_model.User_data=Depends(get_logged_in_user)):
    """deleting user"""
    db_user=db.query(database_model.User_data).filter(database_model.User_data.emp_id==emp_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return {"message":"user deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="user not found")
