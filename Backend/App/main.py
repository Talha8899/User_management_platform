from fastapi import FastAPI
from routers import root
from routers import users
from routers import auth


app = FastAPI()
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(root.router)
