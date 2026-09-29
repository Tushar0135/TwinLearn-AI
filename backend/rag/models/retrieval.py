from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    """
    Represents one retrieved lecture chunk.
    """

    id: str

    text: str

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )

    distance: float | None = None


class RetrievalResult(BaseModel):
    """
    Application-level retrieval response.
    """

    query: str

    chunks: list[RetrievedChunk] = Field(
        default_factory=list
    )

    total_results: int = 0