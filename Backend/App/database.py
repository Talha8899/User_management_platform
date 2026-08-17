"""This file is used to establish the connection 
between sqlalchemy and our database for now which is 
postgresql """
from pydentic_config import settings #getting db url from .env file with using pydantic settings 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

#database url 
db_url=settings.Database_url
#create connection by the help of the url
engine=create_engine(db_url)
#create session for work 
session=sessionmaker(autocommit=False, autoflush=False, bind=engine)