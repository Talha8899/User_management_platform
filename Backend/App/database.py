"""Create the SQLAlchemy engine and reusable database session factory."""

from pydentic_config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# The database URL is loaded from the environment-backed settings object.
db_url = settings.database_url
engine = create_engine(db_url)

# Routes use this factory to create one session per request.
session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
