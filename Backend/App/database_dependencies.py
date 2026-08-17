"""This module contains the database dependencies for the FastAPI application.
It includes the necessary imports and functions to create the database tables 
and manage database sessions."""

from database import session,engine
import database_model as database_model

database_model.Base.metadata.create_all(bind=engine)

#make database session for work with database
def get_db():
    db=session()
    try:
        yield db
    finally:
        db.close()