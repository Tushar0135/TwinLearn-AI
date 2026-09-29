from functools import lru_cache

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
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
# SUPPORTED TEACHING STRATEGIES
# ============================================================

SUPPORTED_STRATEGIES = {
    "direct",
    "story based",
    "diagram based",
    "step by step",
    "code based",
    "example based",
    "exam oriented",
    "interview oriented",
    "simple",
    "detailed",
    "analogy based",
    "socratic",
}


# ============================================================
# STRATEGY ALIASES
# ============================================================
#
# Frontend can send different versions such as:
#
# story
# story-based
# Story Based
#
# All of them become:
#
# story based
#
# ============================================================

STRATEGY_ALIASES = {

    # --------------------------------------------------------
    # DIRECT
    # --------------------------------------------------------

    "direct": "direct",
    "direct answer": "direct",

    # --------------------------------------------------------
    # STORY
    # --------------------------------------------------------

    "story": "story based",
    "story based": "story based",
    "story-based": "story based",

    # --------------------------------------------------------
    # DIAGRAM
    # --------------------------------------------------------

    "diagram": "diagram based",
    "diagram based": "diagram based",
    "diagram-based": "diagram based",

    # --------------------------------------------------------
    # STEP BY STEP
    # --------------------------------------------------------

    "step": "step by step",
    "steps": "step by step",
    "step by step": "step by step",
    "step-by-step": "step by step",

    # --------------------------------------------------------
    # CODE
    # --------------------------------------------------------

    "code": "code based",
    "code based": "code based",
    "code-based": "code based",

    # --------------------------------------------------------
    # EXAMPLE
    # --------------------------------------------------------

    "example": "example based",
    "example based": "example based",
    "example-based": "example based",

    # --------------------------------------------------------
    # EXAM
    # --------------------------------------------------------

    "exam": "exam oriented",
    "exam oriented": "exam oriented",
    "exam-oriented": "exam oriented",

    # --------------------------------------------------------
    # INTERVIEW
    # --------------------------------------------------------

    "interview": "interview oriented",
    "interview oriented": "interview oriented",
    "interview-oriented": "interview oriented",

    # --------------------------------------------------------
    # SIMPLE
    # --------------------------------------------------------

    "simple": "simple",

    # --------------------------------------------------------
    # DETAILED
    # --------------------------------------------------------

    "detailed": "detailed",

    # --------------------------------------------------------
    # ANALOGY
    # --------------------------------------------------------

    "analogy": "analogy based",
    "analogy based": "analogy based",
    "analogy-based": "analogy based",

    # --------------------------------------------------------
    # SOCRATIC
    # --------------------------------------------------------

    "socratic": "socratic",
}


# ============================================================
# NORMALIZE TEACHING STRATEGY
# ============================================================

def normalize_strategy(
    teaching_strategy: str | None,
) -> str:

    """
    Convert any frontend/adaptive strategy name into
    one canonical strategy.

    Example:

        "Story Based"
            ↓
        "story based"

        "story-based"
            ↓
        "story based"

        "diagram"
            ↓
        "diagram based"

        unknown value
            ↓
        "direct"
    """

    # --------------------------------------------------------
    # No strategy
    # --------------------------------------------------------

    if not teaching_strategy:

        return "direct"


    # --------------------------------------------------------
    # Clean input
    # --------------------------------------------------------

    strategy = (
        str(teaching_strategy)
        .strip()
        .lower()
    )


    # --------------------------------------------------------
    # Resolve alias
    # --------------------------------------------------------

    normalized = STRATEGY_ALIASES.get(
        strategy
    )


    # --------------------------------------------------------
    # Unknown strategy
    # --------------------------------------------------------

    if not normalized:

        print(
            "WARNING: Unknown teaching strategy:",
            teaching_strategy,
        )

        print(
            "Falling back to direct strategy."
        )

        return "direct"


    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if normalized not in SUPPORTED_STRATEGIES:

        print(
            "WARNING: Unsupported normalized strategy:",
            normalized,
        )

        return "direct"


    return normalized


# ============================================================
# RAG SERVICE FACTORY
# ============================================================

@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:

    """
    Create and cache the complete RAG pipeline.

    Pipeline:

        Question
            ↓
        Embedding
            ↓
        ChromaDB
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

    # --------------------------------------------------------
    # EMBEDDING
    # --------------------------------------------------------

    embedding_service = EmbeddingService()


    # --------------------------------------------------------
    # VECTOR STORE
    # --------------------------------------------------------

    vector_store = ChromaService()


    # --------------------------------------------------------
    # RETRIEVAL
    # --------------------------------------------------------

    retrieval_service = RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store,
    )


    # --------------------------------------------------------
    # CONTEXT
    # --------------------------------------------------------

    context_service = ContextService()


    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt_service = PromptService()


    # --------------------------------------------------------
    # LLM
    # --------------------------------------------------------

    llm_service = GeminiService()


    # --------------------------------------------------------
    # RAG SERVICE
    # --------------------------------------------------------

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

    current_student: Student = Depends(
        get_current_student
    ),

    db: Session = Depends(
        get_db
    ),

):

    """
    Ask a question about indexed lecture content.

    Teaching strategy priority:

        1. User-selected strategy
        2. Adaptive DecisionService strategy
        3. Direct fallback

    Example:

        {
            "lecture_id": "...",
            "question": "Explain CNN",
            "top_k": 5,
            "teaching_strategy": "story based"
        }
    """

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


        adaptive_strategy = None


        if decision:

            adaptive_strategy = (
                decision.get("strategy")
            )


        # ====================================================
        # STEP 3 — GET USER SELECTED STRATEGY
        # ====================================================

        requested_strategy = getattr(

            query,

            "teaching_strategy",

            None,

        )


        # ====================================================
        # STEP 4 — SELECT STRATEGY
        # ====================================================
        #
        # IMPORTANT:
        #
        # User selection ALWAYS has priority.
        #
        # If the user selected Story Based:
        #
        # Story Based
        #      ↓
        # requested_strategy
        #      ↓
        # selected_strategy
        #
        # DecisionService must NOT override it.
        #
        # ====================================================

        if requested_strategy:

            selected_strategy = (
                requested_strategy
            )

        elif adaptive_strategy:

            selected_strategy = (
                adaptive_strategy
            )

        else:

            selected_strategy = "direct"


        # ====================================================
        # STEP 5 — NORMALIZE STRATEGY
        # ====================================================

        selected_strategy = normalize_strategy(

            selected_strategy

        )


        # ====================================================
        # STEP 6 — DEBUG INFORMATION
        # ====================================================

        print(
            "\n========================================"
        )

        print(
            "AI PROFESSOR TEACHING STRATEGY"
        )

        print(
            "========================================"
        )

        print(
            "User requested strategy:",
            requested_strategy,
        )

        print(
            "Adaptive strategy:",
            adaptive_strategy,
        )

        print(
            "Final selected strategy:",
            selected_strategy,
        )

        print(
            "Lecture ID:",
            query.lecture_id,
        )

        print(
            "Question:",
            query.question,
        )

        print(
            "========================================\n"
        )


        # ====================================================
        # STEP 7 — FORCE NORMALIZED STRATEGY INTO QUERY
        # ====================================================
        #
        # This is important.
        #
        # RAGService receives the same canonical strategy
        # that the route selected.
        #
        # ====================================================

        query.teaching_strategy = (
            selected_strategy
        )


        # ====================================================
        # STEP 8 — GENERATE GROUNDED ANSWER
        # ====================================================

        response = rag_service.answer(

            query=query,

            teaching_strategy=selected_strategy,

        )


        # ====================================================
        # STEP 9 — SAFETY: RETURN ACTUAL STRATEGY
        # ====================================================

        response.teaching_strategy = (
            selected_strategy
        )


        # ====================================================
        # STEP 10 — RETURN RESPONSE
        # ====================================================

        return response


    except Exception as exc:

        # ====================================================
        # ERROR LOG
        # ====================================================

        print(
            "\n========================================"
        )

        print(
            "RAG REQUEST ERROR"
        )

        print(
            "========================================"
        )

        print(
            "Error:",
            str(exc),
        )

        print(
            "========================================\n"
        )


        # ====================================================
        # HTTP ERROR
        # ====================================================

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to generate "
                f"RAG response: {exc}"
            ),

        )