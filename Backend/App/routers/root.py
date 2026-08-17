from fastapi import APIRouter

router=APIRouter(tags=["root"])

@router.get("/")
def root():
    """Health check-api is running"""
    return {"message":"welcome-Root is running"}