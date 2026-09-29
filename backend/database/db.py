"""
database/db.py

SQLAlchemy database configuration.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL


# ============================================================
# ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_db():

    # IMPORTANT:
    # Import every model so SQLAlchemy knows about
    # every relationship before mapper configuration.

    from models.student import Student
    from models.lecture import Lecture
    from models.quiz import Quiz
    from models.test_result import TestResult

    # Keep references alive.
    _ = (
        Student,
        Lecture,
        Quiz,
        TestResult,
    )

    Base.metadata.create_all(
        bind=engine
    )