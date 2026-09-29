from __future__ import annotations

from pydantic import BaseModel


class IndexingResult(BaseModel):
    """
    Result returned after lecture indexing.
    """

    lecture_id: str

    lecture_title: str

    chunks_created: int

    vectors_indexed: int

    status: str