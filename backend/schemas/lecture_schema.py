"""
schemas/lecture_schema.py

Pydantic models describing the JSON shape of upload / history responses.
"""

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel


class TimestampItem(BaseModel):
    """
    A single timestamped segment from audio/video transcription.
    """

    start: float
    end: float
    text: str


class UploadResponse(BaseModel):
    """
    Shape of the JSON returned by POST /upload
    and POST /upload-youtube.

    Supports:

        - PDF
        - DOCX
        - PPTX
        - Audio
        - Video

    Audio/video example:

    {
        "lecture_id": "...",
        "filename": "lecture.mp3",
        "file_type": "audio",
        "source": "audio",
        "document_text": null,
        "transcript": "...",
        "timestamps": [
            {
                "start": 0.0,
                "end": 4.72,
                "text": "..."
            }
        ],
        "combined_text": "...",
        "status": "Processed"
    }
    """

    lecture_id: str

    filename: str

    file_type: str

    # ==============================================================
    # AUDIO / VIDEO FIELDS
    # ==============================================================

    source: Optional[str] = None

    document_text: Optional[str] = None

    transcript: Optional[str] = None

    timestamps: Optional[List[TimestampItem]] = None

    combined_text: Optional[str] = None
    
    # ==============================================================
    # PROCESSING STATUS
    # ==============================================================
        # ==============================================================
    # NLP METADATA
    # ==============================================================

    topic: Optional[str] = None

    subtopics: Optional[List[str]] = None

    keywords: Optional[List[str]] = None

    difficulty: Optional[str] = None

    learning_objectives: Optional[List[str]] = None

    prerequisites: Optional[List[str]] = None

    summary: Optional[str] = None

    # ==============================================================
    # PROCESSING STATUS
    # ==============================================================

    status: str


class LectureHistoryItem(BaseModel):
    """
    A single row returned by GET /history.
    """

    lecture_id: str

    student_id: str

    filename: str

    file_type: str

    file_size_kb: Optional[int] = None

    page_count: Optional[int] = None

    upload_time: datetime

    processing_status: str

    error_message: Optional[str] = None
    topic: Optional[str] = None

    subtopics: Optional[List[str]] = None

    keywords: Optional[List[str]] = None

    difficulty: Optional[str] = None

    learning_objectives: Optional[List[str]] = None

    prerequisites: Optional[List[str]] = None

    summary: Optional[str] = None

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """
    Standard error payload shape used across the API.
    """

    detail: str