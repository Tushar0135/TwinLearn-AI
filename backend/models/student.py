"""
models/student.py

Student ORM model for LearnTwin AI Professor.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
)

from sqlalchemy.orm import relationship

from database.db import Base


class Student(Base):

    __tablename__ = "students"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # PUBLIC STUDENT ID
    # ========================================================

    student_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
    )

    # ========================================================
    # STUDENT INFORMATION
    # ========================================================

    full_name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    # ========================================================
    # ACCOUNT
    # ========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    email_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    otp_code = Column(
        String,
        nullable=True,
    )

    otp_expires_at = Column(
        DateTime,
        nullable=True,
    )

    # ========================================================
    # LECTURES
    # ========================================================

    lectures = relationship(
        "Lecture",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    # ========================================================
    # QUIZZES
    # ========================================================

    quizzes = relationship(
        "Quiz",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    # ========================================================
    # TEST RESULTS
    # ========================================================

    test_results = relationship(
        "TestResult",
        back_populates="student",
        cascade="all, delete-orphan",
    )