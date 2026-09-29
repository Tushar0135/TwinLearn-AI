from functools import lru_cache

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from database.db import get_db

from models.student import Student

from services.auth_service import get_current_student
from services.decision_service import DecisionService

from rag.models.rag import (
    RAGQuery,
    RAGResponse,
)

from rag.services.rag_service import RAGService
from rag.services.chroma_service import ChromaService
from rag.services.embedding_service import EmbeddingService
from rag.services.retrieval_service import RetrievalService
from rag.services.context_service import ContextService
from rag.services.prompt_service import PromptService
from rag.services.llm_service import GeminiService


router = APIRouter(
    prefix="/rag",
    tags=["RAG"],
)


# ============================================================
# RAG SERVICE FACTORY
# ============================================================

@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:

    embedding_service = EmbeddingService()

    vector_store = ChromaService()

    retrieval_service = RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store,
    )

    context_service = ContextService()

    prompt_service = PromptService()

    llm_service = GeminiService()

    rag_service = RAGService(
        retrieval_service=retrieval_service,
        context_service=context_service,
        prompt_service=prompt_service,
        llm_service=llm_service,
    )

    return rag_service


# ============================================================
# ASK LECTURE
# ============================================================

@router.post(
    "/ask",
    response_model=RAGResponse,
)
def ask_lecture(
    query: RAGQuery,

    teaching_strategy: str | None = Query(
        default=None,
        description=(
            "Optional teaching strategy override."
        ),
    ),

    current_student: Student = Depends(
        get_current_student
    ),

    db: Session = Depends(
        get_db
    ),
):

    try:

        # ====================================================
        # STEP 1 — GET RAG SERVICE
        # ====================================================

        rag_service = get_rag_service()

        # ====================================================
        # STEP 2 — GET ADAPTIVE STRATEGY
        # ====================================================

        decision = DecisionService.select_strategy(
            db=db,
            student_db_id=current_student.id,
        )

        selected_strategy = (
            decision["strategy"]
        )

        # ====================================================
        # STEP 3 — MANUAL OVERRIDE
        # ====================================================

        if teaching_strategy:

            requested_strategy = (
                teaching_strategy
                .strip()
                .lower()
            )

            # ----------------------------------------------
            # Optional strategy validation
            # ----------------------------------------------

            allowed_strategies = {
                "step",
                "simple",
                "example",
                "code",
                "analogy",
            }

            if requested_strategy in allowed_strategies:

                selected_strategy = (
                    requested_strategy
                )

        # ====================================================
        # STEP 4 — LOG STRATEGY
        # ====================================================

        print(
            f"RAG strategy selected: "
            f"{selected_strategy}"
        )

        # ====================================================
        # STEP 5 — GENERATE ANSWER
        # ====================================================

        response = rag_service.answer(
            query=query,
            teaching_strategy=selected_strategy,
        )

        # ====================================================
        # STEP 6 — RETURN
        # ====================================================

        return response

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to generate "
                f"RAG response: {exc}"
            ),
        )