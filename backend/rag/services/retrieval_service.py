from __future__ import annotations

from typing import Any

from rag.core.config import settings
from rag.core.exceptions import RetrievalException
from rag.core.logger import logger
from rag.interfaces.vector_store import VectorStore
from rag.models.retrieval import (
    RetrievedChunk,
    RetrievalResult,
)
from rag.services.embedding_service import EmbeddingService


class RetrievalService:
    """
    Production-level semantic retrieval service.

    Flow:

        User Question
             |
             v
        Query Validation
             |
             v
        Query Embedding
             |
             v
        Chroma Vector Search
             |
             +---- lecture_id HARD FILTER
             |
             v
        Candidate Chunks
             |
             v
        Relevance Filtering
             |
             v
        Fallback
             |
             v
        Final Top-K Chunks
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
    ) -> None:

        self._embedding_service = embedding_service
        self._vector_store = vector_store

        logger.info(
            "RetrievalService initialized."
        )

    # =====================================================
    # MAIN RETRIEVAL
    # =====================================================

    def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> RetrievalResult:

        try:

            # -------------------------------------------------
            # 1. Validate query
            # -------------------------------------------------

            cleaned_query = self._validate_query(
                query
            )

            # -------------------------------------------------
            # 2. Resolve top_k
            # -------------------------------------------------

            if top_k is None:
                top_k = settings.TOP_K

            if top_k <= 0:
                raise RetrievalException(
                    "top_k must be greater than zero."
                )

            # Safety limit
            top_k = min(top_k, 50)

            logger.info(
                "Retrieving context for query: %s",
                cleaned_query,
            )

            # -------------------------------------------------
            # 3. Generate query embedding
            # -------------------------------------------------

            query_embedding = (
                self._embedding_service.embed_query(
                    cleaned_query
                )
            )

            if not query_embedding:
                raise RetrievalException(
                    "Query embedding generation returned empty result."
                )

            logger.info(
                "Query embedding generated successfully."
            )

            # -------------------------------------------------
            # 4. Build safe metadata filter
            # -------------------------------------------------

            safe_filter = (
                self._build_safe_filter(
                    metadata_filter
                )
            )

            logger.info(
                "RAG metadata filter: %s",
                safe_filter,
            )

            # -------------------------------------------------
            # 5. Retrieve candidates
            # -------------------------------------------------

            candidate_k = min(
                max(top_k * 2, 10),
                50,
            )

            logger.info(
                "Searching vector store with top_k=%d",
                candidate_k,
            )

            results = self._vector_store.search(
                query_embedding=query_embedding,
                top_k=candidate_k,
                where=safe_filter,
            )

            # -------------------------------------------------
            # 6. Parse results
            # -------------------------------------------------

            retrieved_chunks = (
                self._parse_results(results)
            )

            logger.info(
                "Vector search returned %d candidates.",
                len(retrieved_chunks),
            )

            # -------------------------------------------------
            # 7. No candidates
            # -------------------------------------------------

            if not retrieved_chunks:

                logger.warning(
                    "No chunks returned from vector store."
                )

                return RetrievalResult(
                    query=cleaned_query,
                    chunks=[],
                    total_results=0,
                )

            # -------------------------------------------------
            # 8. Log distances
            # -------------------------------------------------

            logger.info(
                "Retrieved chunk distances: %s",
                [
                    chunk.distance
                    for chunk in retrieved_chunks
                ],
            )

            # -------------------------------------------------
            # 9. Relevance filtering
            # -------------------------------------------------

            filtered_chunks = (
                self._filter_by_relevance(
                    retrieved_chunks
                )
            )

            # -------------------------------------------------
            # 10. Fallback
            #
            # If threshold removes everything,
            # use best vector results.
            # -------------------------------------------------

            if not filtered_chunks:

                logger.warning(
                    "Relevance threshold removed all "
                    "candidates. Using fallback."
                )

                filtered_chunks = (
                    self._fallback_chunks(
                        retrieved_chunks,
                        top_k,
                    )
                )

            # -------------------------------------------------
            # 11. Sort by distance
            #
            # Lower distance = better match.
            # -------------------------------------------------

            filtered_chunks.sort(
                key=lambda chunk: (
                    chunk.distance
                    if chunk.distance is not None
                    else float("inf")
                )
            )

            # -------------------------------------------------
            # 12. Final top_k
            # -------------------------------------------------

            final_chunks = (
                filtered_chunks[:top_k]
            )

            logger.info(
                "Final retrieved chunks: %d",
                len(final_chunks),
            )

            # -------------------------------------------------
            # 13. Return
            # -------------------------------------------------

            return RetrievalResult(
                query=cleaned_query,
                chunks=final_chunks,
                total_results=len(final_chunks),
            )

        except RetrievalException:
            raise

        except Exception as exc:

            logger.exception(
                "Retrieval failed."
            )

            raise RetrievalException(
                "Unable to retrieve relevant lecture context."
            ) from exc

    # =====================================================
    # SAFE METADATA FILTER
    # =====================================================

    @staticmethod
    def _build_safe_filter(
        metadata_filter: dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        """
        Only lecture_id is allowed as a hard filter.

        Topic filtering is intentionally removed.

        Example:

            {
                "lecture_id": "abc-123"
            }
        """

        if not metadata_filter:
            return None

        lecture_id = metadata_filter.get(
            "lecture_id"
        )

        if not lecture_id:
            return None

        return {
            "lecture_id": str(
                lecture_id
            )
        }

    # =====================================================
    # QUERY VALIDATION
    # =====================================================

    @staticmethod
    def _validate_query(
        query: str,
    ) -> str:
        """
        Validate and normalize query.
        """

        if not isinstance(query, str):

            raise RetrievalException(
                "Query must be a string."
            )

        cleaned_query = " ".join(
            query.strip().split()
        )

        if not cleaned_query:

            raise RetrievalException(
                "Query cannot be empty."
            )

        if len(cleaned_query) > 2000:

            raise RetrievalException(
                "Query is too long."
            )

        return cleaned_query

    # =====================================================
    # RESULT PARSER
    # =====================================================

    @staticmethod
    def _parse_results(
        results: dict[str, Any],
    ) -> list[RetrievedChunk]:
        """
        Safely parse Chroma response.

        Supports both:

            [[...]]
        and:

            [...]
        """

        if not results:
            return []

        ids = results.get("ids") or []
        documents = results.get("documents") or []
        metadatas = results.get("metadatas") or []
        distances = results.get("distances") or []

        # -------------------------------------------------
        # Normalize nested Chroma response
        # -------------------------------------------------

        if ids and isinstance(
            ids[0],
            list,
        ):
            ids = ids[0]

        if documents and isinstance(
            documents[0],
            list,
        ):
            documents = documents[0]

        if metadatas and isinstance(
            metadatas[0],
            list,
        ):
            metadatas = metadatas[0]

        if distances and isinstance(
            distances[0],
            list,
        ):
            distances = distances[0]

        logger.info(
            "Parsed vector results: "
            "ids=%d, documents=%d, "
            "metadatas=%d, distances=%d",
            len(ids),
            len(documents),
            len(metadatas),
            len(distances),
        )

        if not ids:

            logger.warning(
                "Vector store returned no IDs."
            )

            return []

        chunks: list[RetrievedChunk] = []

        for index, chunk_id in enumerate(ids):

            document = (
                documents[index]
                if index < len(documents)
                else ""
            )

            metadata = (
                metadatas[index]
                if index < len(metadatas)
                else {}
            )

            distance = (
                distances[index]
                if index < len(distances)
                else None
            )

            # Ignore empty documents
            if not document:
                continue

            chunks.append(
                RetrievedChunk(
                    id=str(chunk_id),
                    text=str(document),
                    metadata=metadata or {},
                    distance=distance,
                )
            )

        return chunks

    # =====================================================
    # RELEVANCE FILTER
    # =====================================================

    def _filter_by_relevance(
        self,
        chunks: list[RetrievedChunk],
    ) -> list[RetrievedChunk]:
        """
        Filter chunks using configured distance threshold.
        """

        threshold = settings.RAG_MAX_DISTANCE

        filtered_chunks = []

        for chunk in chunks:

            # Missing distance -> keep it
            if chunk.distance is None:

                filtered_chunks.append(
                    chunk
                )

                continue

            try:

                distance = float(
                    chunk.distance
                )

            except (
                TypeError,
                ValueError,
            ):

                logger.warning(
                    "Invalid chunk distance: %r",
                    chunk.distance,
                )

                # Do not throw away a potentially useful chunk
                filtered_chunks.append(
                    chunk
                )

                continue

            if distance <= threshold:

                filtered_chunks.append(
                    chunk
                )

        logger.info(
            "Relevance filtering: %d -> %d chunks.",
            len(chunks),
            len(filtered_chunks),
        )

        return filtered_chunks

    # =====================================================
    # FALLBACK
    # =====================================================

    @staticmethod
    def _fallback_chunks(
        chunks: list[RetrievedChunk],
        top_k: int,
    ) -> list[RetrievedChunk]:
        """
        Fallback when relevance threshold is too strict.

        Keeps the best vector-search candidates.
        """

        valid_chunks = [
            chunk
            for chunk in chunks
            if chunk.text
        ]

        valid_chunks.sort(
            key=lambda chunk: (
                chunk.distance
                if chunk.distance is not None
                else float("inf")
            )
        )

        return valid_chunks[:top_k]