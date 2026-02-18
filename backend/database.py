from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Replace 'your_actual_password_here' with the Postgres password you made during installation!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/edumate"

# Create the engine that talks to Postgres
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models
Base = declarative_base()

# Dependency to get the database session in our routes later
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()