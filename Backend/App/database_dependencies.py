"""FastAPI dependency for creating and closing database sessions."""

from database import session, engine
import database_model as database_model

# Ensure tables exist for the local application startup path.
database_model.Base.metadata.create_all(bind=engine)


# Yield a request-scoped session and always close it afterward.
def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()
