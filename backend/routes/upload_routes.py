"""
routes/upload_routes.py

Core endpoints of the LearnTwin AI Professor project.

Endpoints:

    POST /upload
        Upload PDF, DOCX, PPTX, audio, or video files.

    POST /upload-youtube
        Download audio from a YouTube URL and process it
        through the existing audio/Whisper pipeline.

Authentication:
    JWT required for both endpoints.
"""

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from database.db import get_db
from models.student import Student

from schemas.lecture_schema import UploadResponse

from services.auth_service import get_current_student
from services.lecture_service import process_uploaded_file
from services.extraction_service import ExtractionError
from services.youtube_service import download_youtube_audio

from utils.validators import FileValidationError
from utils.logger import get_logger


# ============================================================
# LOGGER
# ============================================================

logger = get_logger(__name__)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    tags=["Upload"]
)


# ============================================================
# YOUTUBE REQUEST MODEL
# ============================================================

class YouTubeUploadRequest(BaseModel):
    """
    Request body for YouTube lecture upload.

    This matches the frontend payload sent by:
        uploadYoutubeLecture()

    Frontend sends:

        {
            "youtube_url": "...",
            "title": "...",
            "subject": "...",
            "topic": "...",
            "description": "..."
        }
    """

    youtube_url: str

    title: str = ""

    subject: str = ""

    topic: str = ""

    description: str = ""


# ============================================================
# HELPER — BUILD UPLOAD RESPONSE
# ============================================================

def build_upload_response(lecture) -> UploadResponse:
    """
    Convert the processed Lecture object into the API response.

    Works for:

        POST /upload

    and:

        POST /upload-youtube
    """

    return UploadResponse(

        lecture_id=str(
            lecture.lecture_id
        ),

        filename=lecture.filename,

        file_type=lecture.file_type,

        source=getattr(
            lecture,
            "source",
            None,
        ),

        document_text=getattr(
            lecture,
            "document_text",
            None,
        ),

        transcript=getattr(
            lecture,
            "transcript",
            None,
        ),

        timestamps=getattr(
            lecture,
            "timestamps",
            None,
        ),

        combined_text=getattr(
            lecture,
            "combined_text",
            None,
        ),

        topic=getattr(
            lecture,
            "topic",
            None,
        ),

        subtopics=getattr(
            lecture,
            "subtopics",
            None,
        ),

        keywords=getattr(
            lecture,
            "keywords",
            None,
        ),

        difficulty=getattr(
            lecture,
            "difficulty",
            None,
        ),

        learning_objectives=getattr(
            lecture,
            "learning_objectives",
            None,
        ),

        prerequisites=getattr(
            lecture,
            "prerequisites",
            None,
        ),

        summary=getattr(
            lecture,
            "summary",
            None,
        ),

        status="Processed",
    )


# ============================================================
# FILE UPLOAD ENDPOINT
# ============================================================

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload and process a lecture",
    description="""
Upload a lecture file and automatically process it.

Supported documents:
- PDF
- DOCX
- PPTX

Supported audio:
- MP3
- WAV
- M4A
- AAC
- FLAC
- OGG

Supported video:
- MP4
- WEBM
- MKV
- AVI
- MOV

Authentication is required.
""",
)
async def upload_file(

    file: UploadFile = File(
        ...,
        description=(
            "Upload a lecture file: "
            "PDF, DOCX, PPTX, MP3, WAV, M4A, AAC, "
            "FLAC, OGG, MP4, WEBM, MKV, AVI, or MOV"
        ),
    ),

    db: Session = Depends(
        get_db
    ),

    current_student: Student = Depends(
        get_current_student
    ),
):
    """
    Complete lecture upload pipeline.
    """

    # ========================================================
    # STEP 1 — CHECK FILENAME
    # ========================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No filename provided.",
        )

    logger.info(
        "Upload received: %s",
        file.filename,
    )

    # ========================================================
    # STEP 2 — READ FILE
    # ========================================================

    try:

        file_bytes = await file.read()

    except Exception as exc:

        logger.exception(
            "Failed to read uploaded file: %s",
            exc,
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to read uploaded file.",
        )

    # ========================================================
    # STEP 3 — PROCESS COMPLETE LECTURE
    # ========================================================

    try:

        lecture = process_uploaded_file(

            db=db,

            student_id=current_student.student_id,

            filename=file.filename,

            file_bytes=file_bytes,
        )

    # ========================================================
    # STEP 4 — VALIDATION ERROR
    # ========================================================

    except FileValidationError as exc:

        logger.warning(
            "Upload rejected for student %s: %s",
            current_student.student_id,
            exc.message,
        )

        raise HTTPException(
            status_code=400,
            detail=exc.message,
        )

    # ========================================================
    # STEP 5 — EXTRACTION ERROR
    # ========================================================

    except ExtractionError as exc:

        logger.error(
            "Lecture processing failed for student %s: %s",
            current_student.student_id,
            exc.message,
        )

        raise HTTPException(
            status_code=422,
            detail=(
                f"Failed to process lecture: "
                f"{exc.message}"
            ),
        )

    # ========================================================
    # STEP 6 — UNEXPECTED ERROR
    # ========================================================

    except Exception as exc:

        logger.exception(
            "Unexpected error while processing upload: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected server error occurred.",
        )

    # ========================================================
    # STEP 7 — RETURN RESPONSE
    # ========================================================

    return build_upload_response(
        lecture
    )


# ============================================================
# YOUTUBE UPLOAD ENDPOINT
# ============================================================

@router.post(
    "/upload-youtube",
    response_model=UploadResponse,
    summary="Upload a lecture from YouTube",
    description="""
Download audio from a YouTube video and process it
through the existing lecture audio pipeline.

Pipeline:

YouTube URL
    ↓
yt-dlp
    ↓
MP3
    ↓
Existing lecture pipeline
    ↓
Faster-Whisper
    ↓
Timestamped transcript
    ↓
NLP metadata
    ↓
RAG indexing
    ↓
Completed lecture

Authentication is required.
""",
)
async def upload_youtube(

    request: YouTubeUploadRequest,

    db: Session = Depends(
        get_db
    ),

    current_student: Student = Depends(
        get_current_student
    ),
):
    """
    Process a lecture directly from a YouTube URL.

    The request model intentionally matches the frontend:

        youtube_url
        title
        subject
        topic
        description
    """

    # ========================================================
    # STEP 1 — GET YOUTUBE URL
    # ========================================================

    youtube_url = (
        request.youtube_url.strip()
    )

    if not youtube_url:

        raise HTTPException(
            status_code=400,
            detail="YouTube URL is required.",
        )

    # ========================================================
    # OPTIONAL METADATA VALIDATION
    # ========================================================

    title = request.title.strip()

    subject = request.subject.strip()

    topic = request.topic.strip()

    description = request.description.strip()

    logger.info(
        "================================================"
    )

    logger.info(
        "YOUTUBE UPLOAD REQUEST"
    )

    logger.info(
        "Student: %s",
        current_student.student_id,
    )

    logger.info(
        "YouTube URL: %s",
        youtube_url,
    )

    logger.info(
        "Title: %s",
        title,
    )

    logger.info(
        "Subject: %s",
        subject,
    )

    logger.info(
        "Topic: %s",
        topic,
    )

    logger.info(
        "Description length: %s",
        len(description),
    )

    logger.info(
        "================================================"
    )

    # ========================================================
    # STEP 2 — DOWNLOAD YOUTUBE AUDIO
    # ========================================================

    try:

        filename, file_bytes = (
            download_youtube_audio(
                youtube_url
            )
        )

    except Exception as exc:

        logger.exception(
            "Failed to download YouTube audio: %s",
            exc,
        )

        raise HTTPException(
            status_code=422,
            detail=(
                f"Failed to download YouTube audio: "
                f"{str(exc)}"
            ),
        )

    # ========================================================
    # STEP 3 — CHECK DOWNLOADED FILE
    # ========================================================

    if not file_bytes:

        logger.error(
            "YouTube download returned empty file."
        )

        raise HTTPException(
            status_code=422,
            detail=(
                "YouTube audio download returned "
                "an empty file."
            ),
        )

    logger.info(
        "YouTube audio downloaded successfully: "
        "filename=%s, size=%s bytes",
        filename,
        len(file_bytes),
    )

    # ========================================================
    # STEP 4 — PROCESS THROUGH EXISTING PIPELINE
    # ========================================================

    try:

        lecture = process_uploaded_file(

            db=db,

            student_id=current_student.student_id,

            filename=filename,

            file_bytes=file_bytes,
        )

    # ========================================================
    # STEP 5 — VALIDATION ERROR
    # ========================================================

    except FileValidationError as exc:

        logger.warning(
            "YouTube file validation failed "
            "for student %s: %s",
            current_student.student_id,
            exc.message,
        )

        raise HTTPException(
            status_code=400,
            detail=exc.message,
        )

    # ========================================================
    # STEP 6 — EXTRACTION ERROR
    # ========================================================

    except ExtractionError as exc:

        logger.error(
            "YouTube lecture processing failed "
            "for student %s: %s",
            current_student.student_id,
            exc.message,
        )

        raise HTTPException(
            status_code=422,
            detail=(
                f"Failed to process YouTube lecture: "
                f"{exc.message}"
            ),
        )

    # ========================================================
    # STEP 7 — UNEXPECTED ERROR
    # ========================================================

    except Exception as exc:

        logger.exception(
            "Unexpected YouTube processing error: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected server error occurred "
                "while processing the YouTube lecture."
            ),
        )

    # ========================================================
    # STEP 8 — APPLY FRONTEND METADATA
    # ========================================================
    #
    # IMPORTANT:
    #
    # Your current process_uploaded_file() automatically
    # extracts NLP metadata from the transcript.
    #
    # Therefore we DO NOT overwrite:
    #
    #     topic
    #     keywords
    #     difficulty
    #     learning objectives
    #
    # with empty frontend values.
    #
    # We only use frontend values when they are actually
    # provided.
    #
    # ========================================================

    try:

        if title:
            lecture.title = title

        if subject:
            lecture.subject = subject

        if topic:
            lecture.user_topic = topic

        if description:
            lecture.description = description

        db.commit()
        db.refresh(lecture)

    except Exception as exc:

        logger.warning(
            "Could not save optional YouTube metadata: %s",
            exc,
        )

        # Do not fail an otherwise successfully processed
        # YouTube lecture because optional metadata could
        # not be saved.

        db.rollback()

    # ========================================================
    # STEP 9 — RETURN COMPLETE RESPONSE
    # ========================================================

    logger.info(
        "YouTube lecture processed successfully: %s",
        lecture.lecture_id,
    )

    return build_upload_response(
        lecture
    )