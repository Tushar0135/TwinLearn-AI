from __future__ import annotations

from typing import Any

from rag.core.exceptions import RetrievalException
from rag.core.logger import logger

from rag.models.rag import (
    RAGQuery,
    RAGResponse,
    SourceReference,
)

from rag.services.context_service import ContextService
from rag.services.prompt_service import PromptService
from rag.services.retrieval_service import RetrievalService

from rag.interfaces.llm import LLMService


class RAGService:
    """
    Complete Retrieval-Augmented Generation pipeline.

    Flow:

        Question
            ↓
        Retrieval
            ↓
        Context
            ↓
        Teaching Strategy
            ↓
        Prompt
            ↓
        Gemini
            ↓
        Answer
    """


    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        retrieval_service: RetrievalService,
        context_service: ContextService,
        prompt_service: PromptService,
        llm_service: LLMService,
    ) -> None:

        self._retrieval_service = (
            retrieval_service
        )

        self._context_service = (
            context_service
        )

        self._prompt_service = (
            prompt_service
        )

        self._llm_service = (
            llm_service
        )

        logger.info(
            "RAGService initialized."
        )


    # ========================================================
    # ANSWER
    # ========================================================

    def answer(
        self,
        query: RAGQuery,
        teaching_strategy: str | None = None,
    ) -> RAGResponse:

        try:

            logger.info(
                "========================================"
            )

            logger.info(
                "RAG REQUEST STARTED"
            )

            logger.info(
                "Question: %s",
                query.question,
            )

            logger.info(
                "Lecture ID: %s",
                query.lecture_id,
            )

            logger.info(
                "Teaching Strategy: %s",
                teaching_strategy,
            )

            logger.info(
                "========================================"
            )


            # ====================================================
            # STEP 1 — BUILD METADATA FILTER
            # ====================================================

            metadata_filter = (
                self._build_metadata_filter(
                    query
                )
            )


            logger.info(
                "Metadata filter: %s",
                metadata_filter,
            )


            # ====================================================
            # STEP 2 — RETRIEVE
            # ====================================================

            logger.info(
                "Starting retrieval..."
            )


            retrieval_result = (
                self._retrieval_service.retrieve(

                    query=query.question,

                    top_k=query.top_k,

                    metadata_filter=
                        metadata_filter,

                )
            )


            if retrieval_result is None:

                raise ValueError(
                    "Retrieval service returned None."
                )


            chunks = (
                retrieval_result.chunks
            )


            logger.info(
                "Retrieved %d chunks.",
                len(chunks),
            )


            # ====================================================
            # STEP 3 — NO CONTEXT
            # ====================================================

            if not chunks:

                return RAGResponse(

                    answer=(
                        "I couldn't find enough "
                        "information about this topic "
                        "in the uploaded lecture."
                    ),

                    sources=[],

                    retrieved_chunks=0,

                    grounded=False,

                    teaching_strategy=
                        teaching_strategy,

                )


            # ====================================================
            # STEP 4 — BUILD CONTEXT
            # ====================================================

            logger.info(
                "Building lecture context..."
            )


            context = (
                self._context_service.build_context(
                    chunks
                )
            )


            if context is None:

                raise ValueError(
                    "Context service returned None."
                )


            context = str(
                context
            ).strip()


            if not context:

                return RAGResponse(

                    answer=(
                        "I couldn't extract enough "
                        "usable information from the "
                        "uploaded lecture."
                    ),

                    sources=[],

                    retrieved_chunks=0,

                    grounded=False,

                    teaching_strategy=
                        teaching_strategy,

                )


            logger.info(
                "Context length: %d",
                len(context),
            )


            # ====================================================
            # STEP 5 — BUILD PROMPT
            # ====================================================

            logger.info(
                "Building teaching prompt..."
            )


            logger.info(
                "Strategy sent to PromptService: %s",
                teaching_strategy,
            )


            prompt = (
                self._prompt_service.build_prompt(

                    question=query.question,

                    context=context,

                    teaching_strategy=
                        teaching_strategy,

                )
            )


            if not prompt:

                raise ValueError(
                    "PromptService returned "
                    "an empty prompt."
                )


            logger.info(
                "Prompt length: %d",
                len(prompt),
            )


            # ====================================================
            # STEP 6 — GEMINI
            # ====================================================

            logger.info(
                "Calling Gemini..."
            )


            answer = (
                self._llm_service.generate(
                    prompt
                )
            )


            if answer is None:

                raise ValueError(
                    "LLM service returned None."
                )


            answer = str(
                answer
            ).strip()


            if not answer:

                raise ValueError(
                    "LLM service returned "
                    "an empty answer."
                )


            logger.info(
                "Gemini response generated."
            )


            # ====================================================
            # STEP 7 — SOURCES
            # ====================================================

            sources = (
                self._build_sources(
                    chunks
                )
            )


            # ====================================================
            # STEP 8 — RESPONSE
            # ====================================================

            response = RAGResponse(

                answer=answer,

                sources=sources,

                retrieved_chunks=
                    len(chunks),

                grounded=True,

                teaching_strategy=
                    teaching_strategy,

            )


            logger.info(
                "========================================"
            )

            logger.info(
                "RAG REQUEST COMPLETED"
            )

            logger.info(
                "Final Teaching Strategy: %s",
                teaching_strategy,
            )

            logger.info(
                "========================================"
            )


            return response


        except Exception as exc:

            logger.exception(
                "========================================"
            )

            logger.exception(
                "RAG PIPELINE FAILED"
            )

            logger.exception(
                "Error: %s",
                str(exc),
            )

            logger.exception(
                "========================================"
            )


            raise RetrievalException(
                f"Unable to generate RAG response: {exc}"
            ) from exc


    # ========================================================
    # METADATA FILTER
    # ========================================================

    @staticmethod
    def _build_metadata_filter(
        query: RAGQuery,
    ) -> dict[str, Any] | None:

        if not query.lecture_id:

            logger.warning(
                "No lecture_id provided."
            )

            return None


        return {

            "lecture_id":
                str(query.lecture_id),

        }


    # ========================================================
    # BUILD SOURCES
    # ========================================================

    @staticmethod
    def _build_sources(
        chunks,
    ) -> list[SourceReference]:

        sources: list[
            SourceReference
        ] = []


        for chunk in chunks:

            metadata = (
                getattr(
                    chunk,
                    "metadata",
                    {},
                )
                or {}
            )


            chunk_id = getattr(
                chunk,
                "id",
                None,
            )


            source = SourceReference(

                chunk_id=str(
                    chunk_id
                    or ""
                ),

                lecture_id=str(
                    metadata.get(
                        "lecture_id",
                        "",
                    )
                ),

                lecture_title=str(
                    metadata.get(
                        "lecture_title",
                        "Unknown",
                    )
                ),

                source_file=str(
                    metadata.get(
                        "source_file",
                        "Unknown",
                    )
                ),

                chunk_number=
                    metadata.get(
                        "chunk_number"
                    ),

            )


            sources.append(
                source
            )


        return sources