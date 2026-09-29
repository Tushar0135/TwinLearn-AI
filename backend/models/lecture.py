"""
models/lecture.py

Defines the Lecture table.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)

from sqlalchemy.orm import relationship

from database.db import Base
from config import STATUS_UPLOADING


class Lecture(Base):

    __tablename__ = "lectures"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # PUBLIC LECTURE ID
    # ========================================================

    lecture_id = Column(
        String,
        unique=True,
        index=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ========================================================
    # STUDENT
    # ========================================================

    student_id = Column(
        String,
        ForeignKey("students.student_id"),
        nullable=False,
        index=True,
    )

    student = relationship(
        "Student",
        back_populates="lectures",
    )

    # ========================================================
    # FILE INFORMATION
    # ========================================================

    filename = Column(
        String,
        nullable=False,
    )

    file_type = Column(
        String,
        nullable=False,
    )

    file_size_kb = Column(
        Integer,
        nullable=True,
    )

    page_count = Column(
        Integer,
        nullable=True,
    )

    # ========================================================
    # PROCESSING
    # ========================================================

    upload_time = Column(
        DateTime,
        default=datetime.utcnow,
    )

    processing_status = Column(
        String,
        default=STATUS_UPLOADING,
    )

    extracted_text_path = Column(
        String,
        nullable=True,
    )

    error_message = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # NLP METADATA
    # ========================================================

    topic = Column(
        String,
        nullable=True,
    )

    subtopics = Column(
        JSON,
        nullable=True,
    )

    keywords = Column(
        JSON,
        nullable=True,
    )

    difficulty = Column(
        String,
        nullable=True,
    )

    learning_objectives = Column(
        JSON,
        nullable=True,
    )

    prerequisites = Column(
        JSON,
        nullable=True,
    )

    summary = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # QUIZZES
    # ========================================================

    quizzes = relationship(
        "Quiz",
        back_populates="lecture",
        cascade="all, delete-orphan",
    )