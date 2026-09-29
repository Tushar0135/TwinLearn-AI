from __future__ import annotations

from typing import Any, Protocol


class VectorStore(Protocol):
    """
    Interface for vector database implementations.

    Any vector store used by the application should provide
    these operations.
    """

    def upsert_documents(
        self,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        """
        Insert or update vector documents.
        """
        ...

    def search(
        self,
        query_embedding: list[float],
        top_k: int,
        where: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Perform semantic similarity search.
        """
        ...

    def count(self) -> int:
        """
        Return number of indexed documents.
        """
        ...

    def health_check(self) -> dict[str, Any]:
        """
        Return vector store health information.
        """
        ...