from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from models.student import Student
from services.auth_service import get_current_student
from services.performance.performance_service import PerformanceService
from services.decision_service import DecisionService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# OVERALL PERFORMANCE
# ============================================================

@router.get("/performance")
def get_performance(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Return overall performance analytics
    for the currently logged-in student.
    """

    return PerformanceService.get_overall_performance(
        db=db,
        student_db_id=current_student.id,
    )


# ============================================================
# TOPIC MASTERY
# ============================================================

@router.get("/topic-mastery")
def get_topic_mastery(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Return topic-wise mastery for the
    currently logged-in student.
    """

    return PerformanceService.get_topic_mastery(
        db=db,
        student_db_id=current_student.id,
    )


# ============================================================
# WEAK TOPICS
# ============================================================

@router.get("/weak-topics")
def get_weak_topics(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Return weak topics for the
    currently logged-in student.
    """

    return PerformanceService.get_weak_topics(
        db=db,
        student_db_id=current_student.id,
    )


# ============================================================
# CURRENT LEARNING STRATEGY
# ============================================================

@router.get("/current-strategy")
def get_current_strategy(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Return the current adaptive teaching strategy
    and the reason for selecting it.
    """

    return DecisionService.select_strategy(
        db=db,
        student_db_id=current_student.id,
    )

# ============================================================
# LEARNING HISTORY
# ============================================================

@router.get("/learning-history")
def get_learning_history(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Return the learning/test history
    for the currently logged-in student.
    """

    return PerformanceService.get_learning_history(
        db=db,
        student_db_id=current_student.id,
    )