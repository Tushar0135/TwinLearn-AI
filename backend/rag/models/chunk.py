from __future__ import annotations

from datetime import datetime, UTC
from uuid import uuid4

from pydantic import BaseModel, Field


class Chunk(BaseModel):
    """
    Represents one lecture chunk used by the RAG pipeline.
    """

    id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    lecture_id: str

    lecture_title: str

    chunk_number: int

    source_file: str

    text: str

    token_count: int

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )