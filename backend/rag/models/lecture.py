from __future__ import annotations

from pydantic import BaseModel, Field


class LectureDocument(BaseModel):
    """
    RAG representation of one processed lecture.

    This model receives the clean lecture text and
    NLP metadata from the main lecture pipeline.
    """

    lecture_id: str

    title: str

    source_file: str

    text: str = Field(
        min_length=1
    )

    # --------------------------------------------------------
    # NLP METADATA
    # --------------------------------------------------------

    topic: str | None = None

    subtopics: list[str] = Field(
        default_factory=list
    )

    keywords: list[str] = Field(
        default_factory=list
    )

    difficulty: str | None = None

    learning_objectives: list[str] = Field(
        default_factory=list
    )

    prerequisites: list[str] = Field(
        default_factory=list
    )

    summary: str | None = None