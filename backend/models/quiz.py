"""
models/quiz.py

Stores generated quizzes and their questions.

A Quiz belongs to:
    Student
    Lecture

A Quiz contains:
    multiple questions
    options
    correct answers
    explanations
    difficulty
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    JSON,
)

from sqlalchemy.orm import relationship

from database.db import Base


class Quiz(Base):

    __tablename__ = "quizzes"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # QUIZ ID
    # ========================================================

    quiz_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
    )

    # ========================================================
    # STUDENT
    # ========================================================

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
        index=True,
    )

    student = relationship(
        "Student",
        back_populates="quizzes",
    )

    # ========================================================
    # LECTURE
    # ========================================================

    lecture_id = Column(
        String,
        ForeignKey("lectures.lecture_id"),
        nullable=False,
        index=True,
    )

    lecture = relationship(
        "Lecture",
        back_populates="quizzes",
    )

    # ========================================================
    # QUIZ INFORMATION
    # ========================================================

    topic = Column(
        String,
        nullable=True,
        index=True,
    )

    test_name = Column(
        String,
        nullable=True,
    )

    teaching_strategy = Column(
        String,
        nullable=True,
        index=True,
    )

    number_of_questions = Column(
        Integer,
        nullable=False,
        default=10,
    )

    # ========================================================
    # QUESTIONS
    # ========================================================

    questions = Column(
        JSON,
        nullable=False,
    )

    # ========================================================
    # STATUS
    # ========================================================

    status = Column(
        String,
        nullable=False,
        default="generated",
    )

    # ========================================================
    # TIMESTAMP
    # ========================================================

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )