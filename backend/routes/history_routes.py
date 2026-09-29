"""
routes/history_routes.py

Endpoints for viewing a student's upload history.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.lecture import Lecture
from models.student import Student
from schemas.lecture_schema import LectureHistoryItem
from services.auth_service import get_current_student
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["History"])


@router.get(
    "/history",
    response_model=List[LectureHistoryItem],
    summary="Get the logged-in student's upload history",
)
def get_history(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Returns every lecture the currently logged-in student has ever
    uploaded, most recent first — including its processing status
    (Uploading / Extracting / Completed / Failed) and metadata
    (file size, page/slide count, upload timestamp).
    """
    lectures = (
        db.query(Lecture)
        .filter(Lecture.student_id == current_student.student_id)
        .order_by(Lecture.upload_time.desc())
        .all()
    )
    logger.info("Fetched %d history records for student %s", len(lectures), current_student.student_id)
    return lectures


@router.get(
    "/history/{lecture_id}",
    response_model=LectureHistoryItem,
    summary="Get details of a single lecture by its ID",
)
def get_lecture_by_id(
    lecture_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    """
    Returns the metadata for one specific lecture, as long as it
    belongs to the currently logged-in student.
    """
    lecture = (
        db.query(Lecture)
        .filter(Lecture.lecture_id == lecture_id, Lecture.student_id == current_student.student_id)
        .first()
    )
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found.")
    return lecture
