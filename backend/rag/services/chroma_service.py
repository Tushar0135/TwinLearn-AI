from __future__ import annotations

from threading import Lock
from typing import Any

import chromadb

from rag.core.config import settings
from rag.core.exceptions import VectorStoreException
from rag.core.logger import logger


from rag.interfaces.vector_store import VectorStore


class ChromaService(VectorStore):
    """
    Production-oriented service responsible for
    all interactions with ChromaDB.

    Responsibilities:
        - Initialize persistent ChromaDB client
        - Manage lecture collection
        - Upsert vectors
        - Semantic search
        - Metadata filtering
        - Health checks
        - Collection management
    """

    _instance: "ChromaService | None" = None
    _instance_lock = Lock()

    def __new__(cls) -> "ChromaService":
        """
        Implement singleton behavior so that only one
        Chroma service instance exists in the application.
        """

        if cls._instance is None:

            with cls._instance_lock:

                if cls._instance is None:

                    cls._instance = super().__new__(cls)

        return cls._instance

    def __init__(self) -> None:
        """
        Initialize service without immediately creating
        the ChromaDB client.

        Client creation is lazy.
        """

        if getattr(self, "_initialized", False):

            return

        self._client = None

        self._collection = None

        self._initialized = True

        logger.info("ChromaService initialized.")

    # =========================================================
    # CLIENT
    # =========================================================

    def _get_client(self):
        """
        Lazily initialize and return the ChromaDB client.
        """

        if self._client is None:

            try:

                logger.info("Initializing ChromaDB client...")

                settings.CHROMA_PATH.mkdir(
                    parents=True,
                    exist_ok=True
                )

                self._client = chromadb.PersistentClient(
                    path=str(settings.CHROMA_PATH)
                )

                logger.info(
                    "ChromaDB client initialized successfully."
                )

            except Exception as exc:

                logger.exception(
                    "Failed to initialize ChromaDB."
                )

                raise VectorStoreException(
                    "Unable to initialize ChromaDB."
                ) from exc

        return self._client

    # =========================================================
    # COLLECTION
    # =========================================================

    def _get_collection(self):
        """
        Lazily get or create the lecture collection.

        Cosine distance is used for semantic similarity.
        """

        if self._collection is None:

            try:

                client = self._get_client()

                logger.info(
                    "Loading ChromaDB collection: %s",
                    settings.CHROMA_COLLECTION
                )

                self._collection = (
                    client.get_or_create_collection(
                        name=settings.CHROMA_COLLECTION,
                        metadata={
                            "description": (
                                "Lecture knowledge base "
                                "for TwinLearnAI"
                            ),
                            "hnsw:space": "cosine"
                        }
                    )
                )

                logger.info(
                    "ChromaDB collection ready."
                )

            except Exception as exc:

                logger.exception(
                    "Failed to create/load Chroma collection."
                )

                raise VectorStoreException(
                    "Unable to access vector collection."
                ) from exc

        return self._collection

    # =========================================================
    # UPSERT
    # =========================================================

    def upsert_documents(
        self,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]]
    ) -> None:
        """
        Insert new vectors or update existing vectors.

        Args:
            ids:
                Unique UUIDs for each chunk.

            documents:
                Original chunk text.

            embeddings:
                Vector representation of chunks.

            metadatas:
                Metadata associated with each chunk.
        """

        if not ids:

            raise VectorStoreException(
                "Cannot index an empty document list."
            )

        if not (
            len(ids)
            == len(documents)
            == len(embeddings)
            == len(metadatas)
        ):

            raise VectorStoreException(
                "IDs, documents, embeddings and metadata "
                "must have the same length."
            )

        try:

            collection = self._get_collection()

            collection.upsert(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )

            logger.info(
                "Successfully indexed %d documents.",
                len(ids)
            )

        except VectorStoreException:

            raise

        except Exception as exc:

            logger.exception(
                "Failed to upsert documents."
            )

            raise VectorStoreException(
                "Unable to index documents in ChromaDB."
            ) from exc

    # =========================================================
    # SEARCH
    # =========================================================

    def search(
        self,
        query_embedding: list[float],
        top_k: int | None = None,
        where: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Perform semantic similarity search.

        Args:
            query_embedding:
                Vector representation of user query.

            top_k:
                Number of relevant chunks to retrieve.

            where:
                Optional Chroma metadata filter.

        Returns:
            ChromaDB query response.
        """

        if not query_embedding:

            raise VectorStoreException(
                "Query embedding cannot be empty."
            )

        if top_k is None:

            top_k = settings.TOP_K

        if top_k <= 0:

            raise VectorStoreException(
                "top_k must be greater than zero."
            )

        try:

            collection = self._get_collection()

            total_documents = collection.count()

            if total_documents == 0:

                logger.warning(
                    "Vector database is empty."
                )

                return {
                    "ids": [[]],
                    "documents": [[]],
                    "metadatas": [[]],
                    "distances": [[]]
                }

            # Chroma cannot return more documents than exist.
            top_k = min(
                top_k,
                total_documents
            )

            query_kwargs: dict[str, Any] = {
                "query_embeddings": [query_embedding],
                "n_results": top_k,
                "include": [
                    "documents",
                    "metadatas",
                    "distances"
                ]
            }

            if where:

                query_kwargs["where"] = where

            results = collection.query(
                **query_kwargs
            )
            logger.info(
            "RAW CHROMA IDS: %s",
            results.get("ids")
            )

            logger.info(
            "RAW CHROMA DOCUMENTS COUNT: %d",
            len(results.get("documents", [[]])[0])
            if results.get("documents")
            else 0
            )   

            logger.info(
                "RAW CHROMA METADATA: %s",
                results.get("metadatas")
            )

            logger.info(
                "RAW CHROMA DISTANCES: %s",
                results.get("distances")
            )
            actual_count = len(
            results.get("ids", [[]])[0]
            ) if results.get("ids") else 0

            logger.info(
            "Vector search completed. "
            "Actually retrieved %d documents.",
            actual_count
            )

            return results

        except Exception as exc:

            logger.exception(
                "Vector search failed."
            )

            raise VectorStoreException(
                "Unable to perform vector search."
            ) from exc

    # =========================================================
    # COUNT
    # =========================================================

    def count(self) -> int:
        """
        Return the total number of indexed chunks.
        """

        try:

            collection = self._get_collection()

            return collection.count()

        except Exception as exc:

            logger.exception(
                "Failed to retrieve vector count."
            )

            raise VectorStoreException(
                "Unable to retrieve vector count."
            ) from exc

    # =========================================================
    # HEALTH
    # =========================================================

    def health_check(self) -> dict[str, Any]:
        """
        Check whether ChromaDB is accessible.
        """

        try:

            collection = self._get_collection()

            document_count = collection.count()

            return {
                "status": "healthy",
                "collection": (
                    settings.CHROMA_COLLECTION
                ),
                "documents": document_count
            }

        except Exception as exc:

            logger.exception(
                "ChromaDB health check failed."
            )

            return {
                "status": "unhealthy",
                "collection": (
                    settings.CHROMA_COLLECTION
                ),
                "documents": 0,
                "error": str(exc)
            }

    # =========================================================
    # RESET
    # =========================================================

    def reset_collection(self) -> None:
        """
        Delete the current collection.

        WARNING:
        This permanently removes indexed vectors.
        """

        try:

            client = self._get_client()

            client.delete_collection(
                name=settings.CHROMA_COLLECTION
            )

            self._collection = None

            logger.warning(
                "ChromaDB collection '%s' deleted.",
                settings.CHROMA_COLLECTION
            )

        except Exception as exc:

            logger.exception(
                "Failed to delete ChromaDB collection."
            )

            raise VectorStoreException(
                "Unable to reset vector collection."
            ) from exc

    def delete_by_lecture_id(self, lecture_id: str) -> None:
        """
        Delete all vectors belonging to a lecture.

        Args:
            lecture_id:
                Unique identifier of the lecture whose vectors
                should be deleted.
        """

        if not lecture_id:
            raise VectorStoreException(
                "Lecture ID cannot be empty."
            )

        try:
            collection = self._get_collection()

            collection.delete(
                where={
                    "lecture_id": lecture_id
                }
            )

            logger.info(
                "Deleted existing vectors for lecture: %s",
                lecture_id
            )

        except Exception as exc:

            logger.exception(
                "Failed to delete vectors for lecture: %s",
                lecture_id
            )

            raise VectorStoreException(
                f"Unable to delete lecture vectors: {lecture_id}"
            ) from exc