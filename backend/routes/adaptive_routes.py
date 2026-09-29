"""
routes/adaptive_routes.py

API endpoints for the TwinLearnAI Adaptive Engine.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.db import get_db
from models.student import Student
from models.test_result import TestResult
from services.decision_service import DecisionService


# ============================================================
# REQUEST MODEL
# ============================================================

class TestResultCreate(BaseModel):
    topic: str | None = None
    test_name: str | None = None
    score: float
    total_marks: float
    diagram_questions: int = 0
    diagram_correct: int = 0


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/adaptive",
    tags=["Adaptive Engine"],
)


# ============================================================
# GET TEACHING STRATEGY
# ============================================================

@router.get(
    "/strategy/{student_id}",
    summary="Get teaching strategy for a student",
)
def get_teaching_strategy(
    student_id: str,
    db: Session = Depends(get_db),
):
    """
    Select the appropriate teaching strategy
    for a student based on performance.
    """

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.student_id == student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # DECISION ENGINE
    # --------------------------------------------------------

    decision = DecisionService.select_strategy(
        db=db,
        student_db_id=student.id,
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "student_id": student.student_id,
        "strategy": decision["strategy"],
        "reason": decision["reason"],
        "score": decision["score"],
    }


# ============================================================
# CREATE TEST RESULT
# ============================================================

@router.post(
    "/test-result/{student_id}",
    summary="Save a student's test result",
)
def create_test_result(
    student_id: str,
    result: TestResultCreate,
    db: Session = Depends(get_db),
):
    """
    Save a test result for a student.

    The percentage and pass/fail status are calculated
    automatically.
    """

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.student_id == student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # VALIDATE TOTAL MARKS
    # --------------------------------------------------------

    if result.total_marks <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total marks must be greater than zero.",
        )

    # --------------------------------------------------------
    # VALIDATE SCORE
    # --------------------------------------------------------

    if result.score < 0:
        raise HTTPException(
            status_code=400,
            detail="Score cannot be negative.",
        )

    if result.score > result.total_marks:
        raise HTTPException(
            status_code=400,
            detail="Score cannot be greater than total marks.",
        )

    # --------------------------------------------------------
    # VALIDATE DIAGRAM DATA
    # --------------------------------------------------------

    if result.diagram_questions < 0:
        raise HTTPException(
            status_code=400,
            detail="Diagram question count cannot be negative.",
        )

    if result.diagram_correct < 0:
        raise HTTPException(
            status_code=400,
            detail="Diagram correct count cannot be negative.",
        )

    if result.diagram_correct > result.diagram_questions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Diagram correct count cannot be greater "
                "than diagram question count."
            ),
        )

    # --------------------------------------------------------
    # CALCULATE PERCENTAGE
    # --------------------------------------------------------

    percentage = (
        result.score / result.total_marks
    ) * 100

    # --------------------------------------------------------
    # CALCULATE PASS/FAIL
    # --------------------------------------------------------

    passed = percentage >= 40

    # --------------------------------------------------------
    # CREATE TEST RESULT
    # --------------------------------------------------------

    test_result = TestResult(
        student_id=student.id,
        topic=result.topic,
        test_name=result.test_name,
        score=result.score,
        total_marks=result.total_marks,
        percentage=percentage,
        diagram_questions=result.diagram_questions,
        diagram_correct=result.diagram_correct,
        passed=passed,
    )

    # --------------------------------------------------------
    # SAVE TO DATABASE
    # --------------------------------------------------------

    db.add(test_result)
    db.commit()
    db.refresh(test_result)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": "Test result saved successfully.",
        "test_id": test_result.test_id,
        "student_id": student.student_id,
        "topic": test_result.topic,
        "score": test_result.score,
        "total_marks": test_result.total_marks,
        "percentage": test_result.percentage,
        "passed": test_result.passed,
    }