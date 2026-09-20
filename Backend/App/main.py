from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydentic_config import settings
from routers import root
from routers import users, admin
from routers import auth

# Application entry point and middleware configuration.
app = FastAPI()

# Allow only configured browser origins to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(root.router)
