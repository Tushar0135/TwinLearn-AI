from __future__ import annotations

from rag.services.chunk_service import ChunkService
from rag.services.embedding_service import EmbeddingService
from rag.services.chroma_service import ChromaService
from rag.services.indexing_service import IndexingService

from rag.services.retrieval_service import RetrievalService
from rag.services.context_service import ContextService
from rag.services.prompt_service import PromptService
from rag.services.llm_service import GeminiService
from rag.services.rag_service import RAGService


class ServiceContainer:
    """
    Central application service container.

    Services are initialized once and reused by
    FastAPI routes.
    """

    def __init__(self) -> None:

        # -----------------------------------------
        # Core services
        # -----------------------------------------

        self.embedding_service = (
            EmbeddingService()
        )

        self.vector_store = (
            ChromaService()
        )

        self.chunk_service = (
            ChunkService()
        )

        # -----------------------------------------
        # Indexing
        # -----------------------------------------

        self.indexing_service = (
            IndexingService(

                chunk_service=(
                    self.chunk_service
                ),

                embedding_service=(
                    self.embedding_service
                ),

                vector_store=(
                    self.vector_store
                ),
            )
        )

        # -----------------------------------------
        # Retrieval
        # -----------------------------------------

        self.retrieval_service = (
            RetrievalService(

                embedding_service=(
                    self.embedding_service
                ),

                vector_store=(
                    self.vector_store
                ),
            )
        )

        # -----------------------------------------
        # RAG
        # -----------------------------------------

        self.context_service = (
            ContextService()
        )

        self.prompt_service = (
            PromptService()
        )

        self.llm_service = (
            GeminiService()
        )

        self.rag_service = (
            RAGService(

                retrieval_service=(
                    self.retrieval_service
                ),

                context_service=(
                    self.context_service
                ),

                prompt_service=(
                    self.prompt_service
                ),

                llm_service=(
                    self.llm_service
                ),
            )
        )