from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.db import get_db

from models.student import Student

from schemas.quiz_schema import (
    QuizGenerateRequest,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)

from services.auth_service import get_current_student
from services.quiz_service import QuizService

from rag.services.embedding_service import EmbeddingService
from rag.services.chroma_service import ChromaService
from rag.services.retrieval_service import RetrievalService
from rag.services.context_service import ContextService
from rag.services.llm_service import GeminiService


router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"],
)


# ============================================================
# QUIZ SERVICE FACTORY
# ============================================================

@lru_cache(maxsize=1)
def get_quiz_service() -> QuizService:
    """
    Create one shared QuizService instance.

    The service contains:
        EmbeddingService
        ChromaService
        RetrievalService
        ContextService
        GeminiService
    """

    embedding_service = EmbeddingService()

    vector_store = ChromaService()

    retrieval_service = RetrievalService(
        embedding_service=embedding_service,
        vector_store=vector_store,
    )

    context_service = ContextService()

    llm_service = GeminiService()

    return QuizService(
        retrieval_service=retrieval_service,
        context_service=context_service,
        llm_service=llm_service,
    )


# ============================================================
# GENERATE QUIZ
# ============================================================

@router.post(
    "/generate",
    response_model=QuizResponse,
)
def generate_quiz(
    request: QuizGenerateRequest,
    current_student: Student = Depends(
        get_current_student
    ),
    db: Session = Depends(
        get_db
    ),
):
    """
    Generate a strategy-aware MCQ quiz.

    Example request:

    {
        "lecture_id": "lecture-uuid",
        "topic": "CNN",
        "teaching_strategy": "Example Based",
        "number_of_questions": 10
    }
    """

    quiz_service = get_quiz_service()

    return quiz_service.generate_quiz(
        db=db,
        student=current_student,
        lecture_id=request.lecture_id,
        topic=request.topic,
        teaching_strategy=request.teaching_strategy,
        number_of_questions=request.number_of_questions,
    )


# ============================================================
# SUBMIT QUIZ
# ============================================================

@router.post(
    "/submit",
    response_model=QuizSubmitResponse,
)
def submit_quiz(
    request: QuizSubmitRequest,
    current_student: Student = Depends(
        get_current_student
    ),
    db: Session = Depends(
        get_db
    ),
):
    """
    Evaluate a submitted quiz and save the result.
    """

    quiz_service = get_quiz_service()

    return quiz_service.submit_quiz(
        db=db,
        student=current_student,
        quiz_id=request.quiz_id,
        answers=request.answers,
    )


# ============================================================
# QUIZ HISTORY
# ============================================================

@router.get(
    "/lecture/{lecture_id}/history",
)
def get_quiz_history(
    lecture_id: str,
    current_student: Student = Depends(
        get_current_student
    ),
    db: Session = Depends(
        get_db
    ),
):
    """
    Get the quiz attempt history for one lecture.

    This is used by the My Lectures page to display
    previously attempted quizzes underneath each lecture.

    Example:

        GET /quiz/lecture/{lecture_id}/history

    Returns the quizzes attempted by the current student
    for the requested lecture.
    """

    quiz_service = get_quiz_service()

    return quiz_service.get_quiz_history(
        db=db,
        student=current_student,
        lecture_id=lecture_id,
    )