"""
models/test_result.py

Stores the result of every quiz/test attempted by a student.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
    JSON,
)

from sqlalchemy.orm import relationship

from database.db import Base


class TestResult(Base):

    __tablename__ = "test_results"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # TEST ID
    # ========================================================

    test_id = Column(
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
        back_populates="test_results",
    )

    # ========================================================
    # QUIZ
    # ========================================================

    quiz_id = Column(
        String,
        nullable=True,
        index=True,
    )

    # ========================================================
    # LECTURE
    # ========================================================

    lecture_id = Column(
        String,
        nullable=True,
        index=True,
    )

    # ========================================================
    # TEST INFORMATION
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

    # ========================================================
    # SCORE
    # ========================================================

    score = Column(
        Float,
        nullable=False,
    )

    total_marks = Column(
        Float,
        nullable=False,
    )

    percentage = Column(
        Float,
        nullable=False,
    )

    # ========================================================
    # DIAGRAM PERFORMANCE
    # ========================================================

    diagram_questions = Column(
        Integer,
        default=0,
        nullable=False,
    )

    diagram_correct = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # ========================================================
    # PASS / FAIL
    # ========================================================

    passed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    # ========================================================
    # DETAILED RESULTS
    # ========================================================

    results = Column(
        JSON,
        nullable=True,
    )

    # ========================================================
    # TIMESTAMP
    # ========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )