"""Now this tells the sqlalchemy to what type of 
table and colum its need to create in database"""
from sqlalchemy.orm import Mapped, declarative_base, mapped_column
from sqlalchemy import Integer,String
#declare the base like foundation for table with name and columns
Base=declarative_base()
class User_data(Base):
    __tablename__="users"
    emp_id:Mapped[int] = mapped_column(
        Integer,primary_key=True,
        nullable=False,
        autoincrement=True,
        index=True)
    name :Mapped[str]= mapped_column(String,index=True,nullable=False,unique=True)
    address :Mapped[str]= mapped_column(String)
    email :Mapped[str]= mapped_column(String,unique=True,nullable=False)
    password_hash :Mapped[str]= mapped_column(String,nullable=False)
    role:Mapped[str] = mapped_column(String, nullable=False, server_default="user", default="user")