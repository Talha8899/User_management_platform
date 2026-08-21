from pydantic import BaseModel,Field,EmailStr
from pydantic import field_validator,ConfigDict
from typing import Optional


#user signup model / add new user
class User_Add(BaseModel):
    name:str=Field(min_length=2, max_length=50)
    address:str=Field(min_length=1, max_length=100)
    email:EmailStr
    password:str=Field(min_length=8, max_length=50)
    
    @field_validator("email")
    @classmethod
    def validate_email(cls,value):
        value=value.strip().lower()
        if not value:
            raise ValueError("Email could not be empty")
        return value

    @field_validator("name")
    @classmethod
    def validate_string_name(cls,value):
        value=value.strip().lower()
        if not value:
            raise ValueError("value could not be empty")
        return value

    @field_validator("address")
    @classmethod
    def validate_string_address(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("value could not be empty")
        
        if not any(char.isalpha() for char in value):
            raise ValueError("Address must contain at least one letter")
        return value

#user update model
class user_update(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    email:EmailStr
    password:str=Field(min_length=8, max_length=50)

    @field_validator("email")
    @classmethod
    def validate_email(cls,value):
        value=value.strip().lower()
        if not value:
            raise ValueError("Email could not be empty")
        return value
    
#user response model 
class user_response(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id:int
    name:str
    address:str

#user response model for logged in user
class user_response_logged_in(user_response):
    model_config = ConfigDict(from_attributes=True)
    email:str

#user update model for partial update
class update_info(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name:Optional[str]=Field(default=None,min_length=2, max_length=50) 
    address:Optional[str]=Field(default=None,min_length=1, max_length=100) 
    email:Optional[EmailStr]=None

    @field_validator("email")
    @classmethod
    def validate_email(cls,value):
        value=value.strip().lower()
        if not value:
            raise ValueError("Email could not be empty")
        return value

    @field_validator("name")
    @classmethod
    def validate_string_name(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("value could not be empty")
        return value

    @field_validator("address")
    @classmethod
    def validate_string_address(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("value could not be empty")
        
        if not any(char.isalpha() for char in value):
            raise ValueError("Address must contain at least one letter")
        return value
