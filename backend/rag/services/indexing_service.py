from __future__ import annotations

from rag.core.exceptions import VectorStoreException
from rag.core.logger import logger

from rag.interfaces.vector_store import VectorStore

from rag.models.indexing import IndexingResult
from rag.models.lecture import LectureDocument

from rag.services.chunk_service import ChunkService
from rag.services.embedding_service import EmbeddingService


class IndexingService:
    """
    Orchestrates the lecture ingestion pipeline.

    Pipeline:

        Lecture
           ↓
        Chunking
           ↓
        Embeddings
           ↓
        Vector Store
    """

    def __init__(
        self,
        chunk_service: ChunkService,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
    ) -> None:

        self._chunk_service = chunk_service

        self._embedding_service = embedding_service

        self._vector_store = vector_store

        logger.info(
            "IndexingService initialized."
        )

    def index_lecture(
        self,
        lecture: LectureDocument,
    ) -> IndexingResult:
        """
        Index one lecture into the vector database.
        """

        logger.info(
            "Starting indexing for lecture: %s",
            lecture.lecture_id,
        )

        # =====================================================
        # STEP 1 — CREATE CHUNKS
        # =====================================================

        chunks = self._chunk_service.create_chunks(

            lecture_id=lecture.lecture_id,

            lecture_title=lecture.title,

            source_file=lecture.source_file,

            text=lecture.text,
        )

        if not chunks:

            raise VectorStoreException(
                "No chunks were generated."
            )

        logger.info(
            "Created %d chunks.",
            len(chunks),
        )

        # =====================================================
        # STEP 2 — EXTRACT DOCUMENT TEXT
        # =====================================================

        documents = [
            chunk.text
            for chunk in chunks
        ]

        # =====================================================
        # STEP 3 — GENERATE EMBEDDINGS
        # =====================================================

        logger.info(
            "Generating embeddings for %d chunks.",
            len(documents),
        )

        embeddings = (
            self._embedding_service
            .embed_documents(
                documents
            )
        )

        # =====================================================
        # STEP 4 — PREPARE IDS
        # =====================================================

        ids = [
            chunk.id
            for chunk in chunks
        ]

        # =====================================================
        # STEP 5 — PREPARE METADATA
        # =====================================================
        logger.info(
            "INDEXING NLP METADATA: topic=%r, difficulty=%r",
            lecture.topic,
            lecture.difficulty,
        )
        metadatas = [

            {
                # -------------------------------
                # Existing chunk metadata
                # -------------------------------

                "lecture_id": (
                    chunk.lecture_id
                ),

                "lecture_title": (
                    chunk.lecture_title
                ),

                "chunk_number": (
                    chunk.chunk_number
                ),

                "source_file": (
                    chunk.source_file
                ),

                "token_count": (
                    chunk.token_count
                ),

                # -------------------------------
                # NLP metadata
                # -------------------------------

                "topic": (
                    lecture.topic.strip().lower()
                    if lecture.topic
                else ""
                    ),

                "difficulty": (
                    lecture.difficulty
                    or ""
                ),

                "keywords": (
                    ", ".join(
                        lecture.keywords
                    )
                ),

                "subtopics": (
                    ", ".join(
                        lecture.subtopics
                    )
                ),

            }

            for chunk in chunks
        ]

        # =====================================================
        # STEP 6 — STORE IN VECTOR DATABASE
        # =====================================================

        logger.info(
            "Indexing vectors into vector store."
        )

        self._vector_store.upsert_documents(

            ids=ids,

            documents=documents,

            embeddings=embeddings,

            metadatas=metadatas,
        )

        logger.info(
            "Lecture indexing completed successfully."
        )

        # =====================================================
        # STEP 7 — RETURN RESULT
        # =====================================================

        return IndexingResult(

            lecture_id=(
                lecture.lecture_id
            ),

            lecture_title=(
                lecture.title
            ),

            chunks_created=(
                len(chunks)
            ),

            vectors_indexed=(
                len(embeddings)
            ),

            status="success",
        )