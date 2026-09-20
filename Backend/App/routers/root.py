from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database_dependencies import get_db

# Basic service-health route.
router = APIRouter(tags=["root"])


@router.get("/health")
def root(db: Session= Depends(get_db)):
    """Confirm that the API process is reachable."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        print(f"Error occurred while checking health: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="database unavailable")

    return {"message": "healthy"}
