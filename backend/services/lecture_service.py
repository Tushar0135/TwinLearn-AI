"""
services/lecture_service.py

The orchestrator for the complete lecture upload pipeline.

Supports:

    Documents:
        PDF
        DOCX
        PPTX

    Audio:
        MP3
        WAV
        M4A
        AAC
        FLAC
        OGG

    Video:
        MP4
        WEBM
        MKV
        AVI
        MOV

The service normalizes document and media processing results
into one common format for the API response.
"""

from sqlalchemy.orm import Session
from services.nlp_service import extract_metadata
from rag.services.indexing_service import IndexingService
from rag.models.lecture import LectureDocument
from rag.services.indexing_service import (
    IndexingService
)

from rag.models.lecture import (
    LectureDocument
)
from services.nlp_service import (
    extract_metadata
)

from rag.models.lecture import (
    LectureDocument
)

from rag.services.indexing_service import (
    IndexingService
)

from rag.services.chunk_service import (
    ChunkService
)

from rag.services.embedding_service import (
    EmbeddingService
)

from rag.services.chroma_service import (
    ChromaService
)
from config import (
    STATUS_UPLOADING,
    STATUS_EXTRACTING,
    STATUS_COMPLETED,
    STATUS_FAILED,
)

from models.lecture import Lecture

from services.file_service import (
    save_uploaded_file,
    save_extracted_text,
    get_file_size_kb,
)

from services.extraction_service import ExtractionError

from preprocessing.main import process_lecture_file

from utils.validators import (
    detect_file_type,
    validate_upload,
)

from utils.logger import get_logger


logger = get_logger(__name__)


def process_uploaded_file(
    db: Session,
    student_id: str,
    filename: str,
    file_bytes: bytes,
) -> Lecture:
    """
    Runs the complete upload -> processing -> storage pipeline.

    Supports documents, audio, and video.

    For documents:

        clean_text
            ->
        document_text
            ->
        combined_text

    For audio/video:

        transcript
        timestamps
        combined_text
            ->
        final response
    """

    # ==============================================================
    # STEP 0 — VALIDATE UPLOAD
    # ==============================================================

    validate_upload(
        filename,
        file_bytes,
    )

    file_type = detect_file_type(
        filename
    )

    logger.info(
        "Upload validated: filename=%s, file_type=%s, student=%s",
        filename,
        file_type,
        student_id,
    )

    # ==============================================================
    # STEP 1 — CREATE LECTURE DATABASE RECORD
    # ==============================================================

    lecture = Lecture(
        student_id=student_id,
        filename=filename,
        file_type=file_type,
        file_size_kb=get_file_size_kb(
            file_bytes
        ),
        processing_status=STATUS_UPLOADING,
    )

    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    logger.info(
        "Lecture %s created for student %s",
        lecture.lecture_id,
        student_id,
    )

    # ==============================================================
    # STEP 2 — SAVE ORIGINAL UPLOADED FILE
    # ==============================================================

    try:

        saved_path = save_uploaded_file(
            filename,
            file_bytes,
        )

    except Exception as exc:

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = str(exc)

        db.commit()

        logger.exception(
            "Failed to save uploaded file for lecture %s",
            lecture.lecture_id,
        )

        raise ExtractionError(
            f"Failed to save uploaded file: {exc}"
        ) from exc

    logger.info(
        "Lecture %s raw file saved at %s",
        lecture.lecture_id,
        saved_path,
    )

    # ==============================================================
    # STEP 3 — CHANGE STATUS TO EXTRACTING
    # ==============================================================

    lecture.processing_status = STATUS_EXTRACTING

    db.commit()

    logger.info(
        "Lecture %s status=Extracting",
        lecture.lecture_id,
    )

    # ==============================================================
    # STEP 4 — PROCESS LECTURE
    # ==============================================================

    try:

        preprocessing_result = process_lecture_file(
            saved_path,
            lecture_id=str(
                lecture.lecture_id
            ),
        )

    except Exception as exc:

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = str(exc)

        db.commit()

        logger.exception(
            "Lecture %s preprocessing failed",
            lecture.lecture_id,
        )

        raise ExtractionError(
            str(exc)
        ) from exc

    # ==============================================================
    # STEP 5 — VALIDATE PROCESSING RESULT
    # ==============================================================

    if not isinstance(
        preprocessing_result,
        dict,
    ):

        error_message = (
            "Lecture preprocessing returned "
            "an invalid result."
        )

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = error_message

        db.commit()

        logger.error(
            "Lecture %s returned invalid preprocessing result",
            lecture.lecture_id,
        )

        raise ExtractionError(
            error_message
        )

    logger.info(
        "Lecture %s preprocessing keys: %s",
        lecture.lecture_id,
        list(preprocessing_result.keys()),
    )

    # ==============================================================
    # STEP 6 — HANDLE PROCESSING ERROR
    # ==============================================================

    if preprocessing_result.get(
        "status"
    ) == "error":

        error_message = preprocessing_result.get(
            "message",
            "Lecture preprocessing failed.",
        )

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = error_message

        db.commit()

        logger.error(
            "Lecture %s preprocessing failed: %s",
            lecture.lecture_id,
            error_message,
        )

        raise ExtractionError(
            error_message
        )

    # ==============================================================
    # STEP 7 — HANDLE WARNING
    # ==============================================================

    if preprocessing_result.get(
        "status"
    ) == "warning":

        warning_message = preprocessing_result.get(
            "message",
            "No extractable text found.",
        )

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = warning_message

        db.commit()

        logger.warning(
            "Lecture %s preprocessing warning: %s",
            lecture.lecture_id,
            warning_message,
        )

        raise ExtractionError(
            warning_message
        )

    # ==============================================================
    # STEP 8 — DETERMINE MEDIA OR DOCUMENT
    # ==============================================================

    source = preprocessing_result.get(
        "source"
    )

    is_media = (
        file_type in {
            "audio",
            "video",
        }
        or source in {
            "audio",
            "video",
        }
    )

    # ==============================================================
    # STEP 9 — GET ALL POSSIBLE TEXT FIELDS
    # ==============================================================

    clean_text = preprocessing_result.get(
        "clean_text",
        "",
    )

    document_text = preprocessing_result.get(
        "document_text",
        None,
    )

    transcript = preprocessing_result.get(
        "transcript",
        "",
    )

    combined_text = preprocessing_result.get(
        "combined_text",
        "",
    )

    # ==============================================================
    # STEP 10 — NORMALIZE NONE VALUES
    # ==============================================================

    if clean_text is None:
        clean_text = ""

    if transcript is None:
        transcript = ""

    if combined_text is None:
        combined_text = ""

    if document_text is not None:
        document_text = str(
            document_text
        ).strip()

    # Convert everything to strings

    clean_text = str(
        clean_text
    ).strip()

    transcript = str(
        transcript
    ).strip()

    combined_text = str(
        combined_text
    ).strip()

    # ==============================================================
    # STEP 11 — DOCUMENT MAPPING
    # ==============================================================

    """
    IMPORTANT FIX

    Document processors return:

        clean_text

    Example:

        {
            "file_type": "pdf",
            "status": "success",
            "clean_text": "Activation functions..."
        }

    They do NOT necessarily return:

        document_text
        combined_text

    Therefore for documents:

        clean_text
            ↓
        document_text
            ↓
        combined_text
    """

    if not is_media:

        # ----------------------------------------------------------
        # Document text
        # ----------------------------------------------------------

        if not document_text:

            document_text = clean_text

        # ----------------------------------------------------------
        # Combined text
        # ----------------------------------------------------------

        if not combined_text:

            combined_text = clean_text

    # ==============================================================
    # STEP 12 — MEDIA MAPPING
    # ==============================================================

    else:

        """
        Audio/video processors normally provide:

            transcript
            timestamps
            combined_text

        If combined_text is unavailable, use transcript.
        """

        if not combined_text:

            combined_text = transcript

        if not clean_text:

            clean_text = combined_text

    # ==============================================================
    # STEP 13 — DETERMINE FINAL TEXT
    # ==============================================================

    final_text = ""

    if clean_text:

        final_text = clean_text

    elif combined_text:

        final_text = combined_text

    elif transcript:

        final_text = transcript

    elif document_text:

        final_text = document_text

    final_text = str(
        final_text
    ).strip()

    # ==============================================================
    # STEP 14 — CHECK EMPTY TEXT
    # ==============================================================

    if not final_text:

        error_message = (
            "No text could be extracted "
            "from the lecture."
        )

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = error_message

        db.commit()

        logger.warning(
            "Lecture %s produced empty text",
            lecture.lecture_id,
        )

        raise ExtractionError(
            error_message
        )

      #     # ==============================================================
    # # STEP 15 — EXTRACT NLP METADATA
    # # ==============================================================

    try:

        metadata = extract_metadata(
            final_text
        )

    except Exception as exc:

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = str(exc)

        db.commit()

        logger.exception(
            "Lecture %s NLP metadata extraction failed",
            lecture.lecture_id,
        )

        raise ExtractionError(
            f"NLP metadata extraction failed: {exc}"
        ) from exc
        # ==============================================================
    # STEP 16 — STORE NLP METADATA
    # ==============================================================

    lecture.topic = metadata.topic

    lecture.subtopics = metadata.subtopics

    lecture.keywords = metadata.keywords

    lecture.difficulty = metadata.difficulty

    lecture.learning_objectives = (
        metadata.learning_objectives
    )

    lecture.prerequisites = (
        metadata.prerequisites
    )

    lecture.summary = metadata.summary
    # ==============================================================
    # RAG INDEXING
    # ==============================================================

    try:

        logger.info(
            "Starting RAG indexing for lecture: %s",
            lecture.lecture_id,
        )

        # ----------------------------------------------------------
        # Create RAG LectureDocument
        # ----------------------------------------------------------

        rag_lecture = LectureDocument(

            lecture_id=str(
                lecture.lecture_id
            ),

            title=(
                lecture.topic
                or lecture.filename
            ),

            source_file=(
                lecture.filename
            ),

            text=final_text,

            # ------------------------------------------------------
            # NLP metadata
            # ------------------------------------------------------

            topic=lecture.topic,

            subtopics=(
                lecture.subtopics
                or []
            ),

            keywords=(
                lecture.keywords
                or []
            ),

            difficulty=(
                lecture.difficulty
            ),

            learning_objectives=(
                lecture.learning_objectives
                or []
            ),

            prerequisites=(
                lecture.prerequisites
                or []
            ),

            summary=(
                lecture.summary
            ),
        )

        # ----------------------------------------------------------
        # Create indexing service
        # ----------------------------------------------------------

        indexing_service = IndexingService(
            chunk_service=ChunkService(),
            embedding_service=EmbeddingService(),
            vector_store=ChromaService(),
        )

        # ----------------------------------------------------------
        # Index lecture
        # ----------------------------------------------------------

        rag_index_result = (
            indexing_service.index_lecture(
                rag_lecture
            )
        )

        logger.info(
            "RAG indexing successful: %s",
            rag_index_result.model_dump(),
        )

    except Exception as exc:

        logger.exception(
            "RAG indexing failed for lecture %s",
            lecture.lecture_id,
        )

        lecture.processing_status = STATUS_FAILED

        lecture.error_message = (
            f"RAG indexing failed: {exc}"
        )

        db.commit()

        raise ExtractionError(
            f"RAG indexing failed: {exc}"
        ) from exc

    # ==============================================================
    # STEP 15 — GET PAGE / SLIDE COUNT
    # ==============================================================

    page_count = preprocessing_result.get(
        "pages_or_slides",
        0,
    )

    if page_count is None:

        page_count = 0

    # ==============================================================
    # STEP 16 — SAVE FINAL TEXT
    # ==============================================================

    try:

        text_path = save_extracted_text(
            lecture.lecture_id,
            final_text,
        )

    except Exception as exc:

        lecture.processing_status = STATUS_FAILED
        lecture.error_message = str(exc)

        db.commit()

        logger.exception(
            "Failed to save extracted text "
            "for lecture %s",
            lecture.lecture_id,
        )

        raise ExtractionError(
            f"Failed to save extracted text: {exc}"
        ) from exc

    # ==============================================================
    # STEP 17 — UPDATE DATABASE
    # ==============================================================

    lecture.page_count = page_count

    lecture.extracted_text_path = text_path

    lecture.processing_status = (
        STATUS_COMPLETED
    )

    lecture.error_message = None

    db.commit()
    db.refresh(lecture)

    logger.info(
        "Lecture %s status=Completed, page_count=%s",
        lecture.lecture_id,
        page_count,
    )

    # ==============================================================
    # STEP 18 — ATTACH RAW TEXT
    # ==============================================================

    """
    raw_text is a temporary Python attribute.

    It is not necessarily a database column.
    """

    lecture.raw_text = final_text

    # ==============================================================
    # STEP 19 — ATTACH COMPLETE PROCESSING RESULT
    # ==============================================================

    lecture.processing_result = (
        preprocessing_result
    )

    # ==============================================================
    # STEP 20 — ATTACH SOURCE
    # ==============================================================

    if is_media:

        lecture.source = (
            source or file_type
        )

    else:

        lecture.source = None

    # ==============================================================
    # STEP 21 — ATTACH DOCUMENT TEXT
    # ==============================================================

    if is_media:

        lecture.document_text = (
            document_text
        )

    else:

        lecture.document_text = (
            document_text
            or final_text
        )

    # ==============================================================
    # STEP 22 — ATTACH TRANSCRIPT
    # ==============================================================

    if is_media:

        lecture.transcript = (
            transcript
        )

    else:

        lecture.transcript = None

    # ==============================================================
    # STEP 23 — ATTACH TIMESTAMPS
    # ==============================================================

    if is_media:

        lecture.timestamps = (
            preprocessing_result.get(
                "timestamps",
                [],
            )
        )

    else:

        lecture.timestamps = None

    # ==============================================================
    # STEP 24 — ATTACH COMBINED TEXT
    # ==============================================================

    lecture.combined_text = (
        combined_text
    )

    # ==============================================================
    # STEP 25 — LOG FINAL RESPONSE
    # ==============================================================

    logger.info(
        "Lecture %s final response prepared: "
        "file_type=%s, source=%s, "
        "document_text_length=%s, "
        "transcript_length=%s, "
        "combined_text_length=%s, "
        "timestamps=%s",
        lecture.lecture_id,
        file_type,
        lecture.source,
        len(
            lecture.document_text or ""
        ),
        len(
            lecture.transcript or ""
        ),
        len(
            lecture.combined_text or ""
        ),
        len(
            lecture.timestamps or []
        ),
    )

    # ==============================================================
    # STEP 26 — RETURN
    # ==============================================================

    return lecture