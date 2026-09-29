from pydantic import BaseModel, Field


# ============================================================
# RAG QUERY
# ============================================================

class RAGQuery(BaseModel):
    """
    Request model for asking a question about a lecture.
    """

    question: str = Field(
        min_length=1,
        max_length=2000,
    )

    lecture_id: str

    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    teaching_strategy: str | None = None


# ============================================================
# SOURCE REFERENCE
# ============================================================

class SourceReference(BaseModel):
    """
    Represents one retrieved lecture chunk used to generate
    the answer.
    """

    chunk_id: str

    lecture_id: str

    lecture_title: str

    source_file: str

    chunk_number: int


# ============================================================
# RAG RESPONSE
# ============================================================

class RAGResponse(BaseModel):
    """
    Final response returned by the RAG pipeline.
    """

    answer: str

    sources: list[SourceReference] = Field(
        default_factory=list
    )

    retrieved_chunks: int = 0

    grounded: bool = False

    teaching_strategy: str | None = None