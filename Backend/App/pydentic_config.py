#this fille getting secret thing such as db_url from .env then validate it 
# in anywhere in our project we can use these by importing settings from config.py
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config=SettingsConfigDict(env_file=".env",env_file_encoding="utf-8")
    secret_key:SecretStr
    database_url:str
    algorithm:str ="HS256"
    access_token_expire_time:int = 30

settings=Settings()