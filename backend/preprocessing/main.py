
"""
preprocessing/main.py

Main lecture preprocessing pipeline.

Supports:

    DOCUMENTS
        PDF
        PPTX
        DOCX

    MEDIA
        Audio
        Video

Pipeline:

    Raw Lecture File
          ↓
    File Type Detection
          ↓
    ┌───────────────────────┐
    │                       │
    │      Document         │     Audio / Video
    │                       │
    ↓                       ↓
 PDF/DOCX/PPTX          media_service
    │                       │
    ↓                       ↓
 Raw Text Extraction     Whisper / Audio
    │                       │
    ↓                       ↓
 Text Cleaning          Transcript Cleaning
    │                       │
    └───────────┬───────────┘
                ↓
        Standardized Output
                ↓
        API / Database
"""

from pathlib import Path
import re


# ====================================================================
# MEMBER 1 — DOCUMENT PROCESSORS
# ====================================================================

from preprocessing.file_validator import (
    FileValidationError,
    validate_file,
    detect_file_type,
)

from preprocessing.pdf_processor import (
    process_pdf,
    PDFProcessingError,
)

from preprocessing.ppt_processor import (
    process_pptx,
    process_ppt,
    PPTProcessingError,
)

from preprocessing.docx_processor import (
    process_docx,
    DOCXProcessingError,
)

from preprocessing.text_cleaner import (
    clean_text,
    count_characters,
    remove_repeated_lines,
)


# ====================================================================
# MEMBER 2 — AUDIO / VIDEO
# ====================================================================

from services.media_service import (
    process_media_file,
    MediaProcessingError,
)


# ====================================================================
# MEDIA FILE TYPES
# ====================================================================

AUDIO_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".flac",
    ".ogg",
}

VIDEO_EXTENSIONS = {
    ".mp4",
    ".webm",
    ".mkv",
    ".avi",
    ".mov",
}


# ====================================================================
# DOCUMENT CLEANING
# ====================================================================

def clean_document_text(raw_text: str) -> str:
    """
    Convert raw extracted document text into clean lecture text.

    Keeps:
        - headings
        - bullets
        - punctuation
        - mathematical symbols
        - technical terminology

    Removes:
        - page/slide extraction markers
        - structural markers
        - newline characters
        - excessive whitespace
        - repeated headers/footers

    Final output contains NO newline characters.
    """

    if not raw_text:
        return ""

    # ---------------------------------------------------------------
    # Convert input to string
    # ---------------------------------------------------------------

    cleaned = str(raw_text)

    # ---------------------------------------------------------------
    # Normalize Windows / Mac / Linux line endings
    #
    # \r\n -> \n
    # \r   -> \n
    # ---------------------------------------------------------------

    cleaned = cleaned.replace("\r\n", "\n")
    cleaned = cleaned.replace("\r", "\n")

    # ---------------------------------------------------------------
    # First cleaning
    # ---------------------------------------------------------------

    cleaned = clean_text(cleaned)

    # ---------------------------------------------------------------
    # Remove repeated headers / footers
    # ---------------------------------------------------------------

    cleaned = remove_repeated_lines(cleaned)

    # ---------------------------------------------------------------
    # Clean again after duplicate removal
    # ---------------------------------------------------------------

    cleaned = clean_text(cleaned)

    # ---------------------------------------------------------------
    # Remove page markers
    #
    # Examples:
    # [Page 1]
    # [Page 2]
    # [Slide 1]
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"\[(?:Page|Slide)\s+\d+\]",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    # ---------------------------------------------------------------
    # Remove extraction structural markers
    #
    # Examples:
    # [Heading]
    # [Bullet]
    # [Paragraph]
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"\[(?:Heading|Bullet|Paragraph)\]",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    # ---------------------------------------------------------------
    # IMPORTANT:
    #
    # Replace ALL newline characters with spaces.
    #
    # This removes:
    #
    # \n
    # \r
    # \r\n
    #
    # Example:
    #
    # "hello\nworld"
    #
    # becomes:
    #
    # "hello world"
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"[\r\n]+",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # Replace tabs with spaces
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"\t+",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # Collapse multiple spaces
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r" {2,}",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # Remove whitespace before/after text
    # ---------------------------------------------------------------

    cleaned = cleaned.strip()

    # ---------------------------------------------------------------
    # FINAL SAFETY CHECK
    #
    # Make absolutely sure no newline remains.
    # ---------------------------------------------------------------

    cleaned = cleaned.replace("\n", " ")
    cleaned = cleaned.replace("\r", " ")

    # Collapse spaces created by final replacement
    cleaned = re.sub(
        r" {2,}",
        " ",
        cleaned,
    )

    return cleaned.strip()


# ====================================================================
# MEDIA TEXT CLEANING
# ====================================================================

def clean_media_text(text: str) -> str:
    """
    Clean audio/video transcript text.

    Final output contains NO newline characters.
    """

    if not text:
        return ""

    cleaned = str(text)

    # ---------------------------------------------------------------
    # Normalize line endings
    # ---------------------------------------------------------------

    cleaned = cleaned.replace("\r\n", "\n")
    cleaned = cleaned.replace("\r", "\n")

    # ---------------------------------------------------------------
    # Existing text cleaner
    # ---------------------------------------------------------------

    cleaned = clean_text(cleaned)

    # ---------------------------------------------------------------
    # Remove repeated transcript lines
    # ---------------------------------------------------------------

    cleaned = remove_repeated_lines(cleaned)

    # ---------------------------------------------------------------
    # Clean again
    # ---------------------------------------------------------------

    cleaned = clean_text(cleaned)

    # ---------------------------------------------------------------
    # REMOVE ALL NEWLINES
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"[\r\n]+",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # REMOVE TABS
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r"\t+",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # COLLAPSE MULTIPLE SPACES
    # ---------------------------------------------------------------

    cleaned = re.sub(
        r" {2,}",
        " ",
        cleaned,
    )

    # ---------------------------------------------------------------
    # FINAL SAFETY CHECK
    # ---------------------------------------------------------------

    cleaned = cleaned.replace("\n", " ")
    cleaned = cleaned.replace("\r", " ")

    cleaned = re.sub(
        r" {2,}",
        " ",
        cleaned,
    )

    return cleaned.strip()


# ====================================================================
# MEDIA RESULT NORMALIZER
# ====================================================================

def normalize_media_result(
    media_result: dict,
    file_path: Path,
    file_type: str,
) -> dict:
    """
    Normalize audio/video processing result.

    Keeps:

        transcript
        timestamps
        combined_text
        source
        document_text

    and provides:

        clean_text
        character_count
        pages_or_slides
    """

    if not isinstance(media_result, dict):

        return {
            "file_name": file_path.name,
            "file_type": file_type,
            "lecture_id": None,
            "source": file_type,
            "document_text": None,
            "transcript": "",
            "timestamps": [],
            "combined_text": "",
            "clean_text": "",
            "pages_or_slides": 0,
            "character_count": 0,
            "status": "error",
            "message": (
                "Media pipeline returned an invalid result."
            ),
        }

    # ---------------------------------------------------------------
    # SOURCE
    # ---------------------------------------------------------------

    source = media_result.get(
        "source",
        file_type,
    )

    # ---------------------------------------------------------------
    # DOCUMENT TEXT
    # ---------------------------------------------------------------

    document_text = media_result.get(
        "document_text"
    )

    # ---------------------------------------------------------------
    # TRANSCRIPT
    # ---------------------------------------------------------------

    transcript = media_result.get(
        "transcript"
    )

    if transcript is None:
        transcript = ""

    transcript = str(
        transcript
    ).strip()

    # ---------------------------------------------------------------
    # TIMESTAMPS
    # ---------------------------------------------------------------

    timestamps = media_result.get(
        "timestamps"
    )

    if timestamps is None:
        timestamps = []

    # ---------------------------------------------------------------
    # COMBINED TEXT
    # ---------------------------------------------------------------

    combined_text = media_result.get(
        "combined_text"
    )

    if not combined_text:
        combined_text = media_result.get(
            "clean_text"
        )

    if not combined_text:
        combined_text = transcript

    if combined_text is None:
        combined_text = ""

    combined_text = str(
        combined_text
    )

    # ---------------------------------------------------------------
    # CLEAN MEDIA TEXT
    # ---------------------------------------------------------------

    clean_media = clean_media_text(
        combined_text
    )

    # ---------------------------------------------------------------
    # RETURN STANDARDIZED RESULT
    # ---------------------------------------------------------------

    result = {
        "file_name": media_result.get(
            "file_name",
            file_path.name,
        ),

        "file_type": file_type,

        "lecture_id": media_result.get(
            "lecture_id"
        ),

        "source": source,

        "document_text": document_text,

        "transcript": transcript,

        "timestamps": timestamps,

        "combined_text": clean_media,

        "clean_text": clean_media,

        "pages_or_slides": media_result.get(
            "pages_or_slides",
            0,
        ),

        "character_count": count_characters(
            clean_media
        ),

        "status": media_result.get(
            "status",
            "success",
        ),
    }

    if media_result.get("message") is not None:

        result["message"] = media_result.get(
            "message"
        )

    return result


# ====================================================================
# DOCUMENT RESULT NORMALIZER
# ====================================================================

def normalize_document_result(
    result: dict,
    file_path: Path,
    file_type: str,
) -> dict:
    """
    Normalize PDF/PPTX/DOCX extraction result.

    IMPORTANT:

        document_text
            = RAW extracted text

        combined_text
            = CLEANED lecture text

        clean_text
            = CLEANED lecture text

    document_text intentionally preserves the raw extraction.

    combined_text and clean_text contain NO newline characters.
    """

    # ---------------------------------------------------------------
    # Validate processor result
    # ---------------------------------------------------------------

    if not isinstance(result, dict):

        return {
            "file_name": file_path.name,
            "file_type": file_type,
            "source": "document",
            "document_text": "",
            "transcript": None,
            "timestamps": None,
            "combined_text": "",
            "clean_text": "",
            "pages_or_slides": 0,
            "character_count": 0,
            "status": "error",
            "message": (
                "Document processor returned "
                "an invalid result."
            ),
        }

    # ---------------------------------------------------------------
    # RAW DOCUMENT TEXT
    # ---------------------------------------------------------------

    raw_text = result.get(
        "text",
        "",
    )

    if raw_text is None:
        raw_text = ""

    raw_text = str(
        raw_text
    )

    # IMPORTANT:
    #
    # raw_text remains untouched.
    #
    # Therefore document_text can still contain:
    #
    # [Page 1]
    # \n
    # etc.
    #
    # Only combined_text / clean_text are cleaned.
    # ---------------------------------------------------------------

    # ---------------------------------------------------------------
    # CLEAN DOCUMENT TEXT
    # ---------------------------------------------------------------

    cleaned_text = clean_document_text(
        raw_text
    )

    # ---------------------------------------------------------------
    # PAGE / SLIDE COUNT
    # ---------------------------------------------------------------

    pages_or_slides = result.get(
        "pages_or_slides",
        0,
    )

    if pages_or_slides is None:
        pages_or_slides = 0

    # ---------------------------------------------------------------
    # CHECK MEANINGFUL CONTENT
    # ---------------------------------------------------------------

    meaningful_text = cleaned_text.strip()

    # ---------------------------------------------------------------
    # EMPTY DOCUMENT
    # ---------------------------------------------------------------

    if not meaningful_text:

        return {
            "file_name": file_path.name,
            "file_type": file_type,
            "source": "document",

            "document_text": raw_text,

            "transcript": None,

            "timestamps": None,

            "combined_text": "",

            "clean_text": "",

            "pages_or_slides": pages_or_slides,

            "character_count": 0,

            "status": "warning",

            "message": (
                "No extractable text found. "
                "This file may contain scanned images."
            ),
        }

    # ---------------------------------------------------------------
    # SUCCESSFUL DOCUMENT
    # ---------------------------------------------------------------

    return {
        "file_name": file_path.name,

        "file_type": file_type,

        "source": "document",

        # ===========================================================
        # RAW DOCUMENT TEXT
        # ===========================================================

        "document_text": raw_text,

        # ===========================================================
        # DOCUMENTS DO NOT HAVE AUDIO DATA
        # ===========================================================

        "transcript": None,

        "timestamps": None,

        # ===========================================================
        # CLEAN DOCUMENT TEXT
        #
        # NO \n
        # NO \r
        # ===========================================================

        "combined_text": cleaned_text,

        "clean_text": cleaned_text,

        # ===========================================================
        # METADATA
        # ===========================================================

        "pages_or_slides": pages_or_slides,

        "character_count": count_characters(
            cleaned_text
        ),

        "status": "success",
    }


# ====================================================================
# MAIN PIPELINE
# ====================================================================

def process_lecture_file(
    file_path: str | Path,
    lecture_id: str | None = None,
) -> dict:
    """
    Process PDF, PPTX, DOCX, audio, or video.

    DOCUMENTS:

        document_text
            -> raw extracted text

        combined_text
            -> cleaned text WITHOUT newlines

        clean_text
            -> cleaned text WITHOUT newlines

    AUDIO / VIDEO:

        transcript
            -> Whisper transcript

        timestamps
            -> timestamp segments

        combined_text
            -> cleaned text WITHOUT newlines
    """

    path = Path(
        file_path
    )

    # =================================================================
    # STEP 1 — FILE EXISTS
    # =================================================================

    if not path.exists():

        return {
            "file_name": path.name,
            "file_type": path.suffix.lower().lstrip("."),
            "source": None,
            "document_text": None,
            "transcript": None,
            "timestamps": None,
            "combined_text": "",
            "clean_text": "",
            "status": "error",
            "pages_or_slides": 0,
            "character_count": 0,
            "message": (
                f"File does not exist: {path}"
            ),
        }

    extension = path.suffix.lower()

    # =================================================================
    # STEP 2 — AUDIO
    # =================================================================

    if extension in AUDIO_EXTENSIONS:

        if not lecture_id:

            return {
                "file_name": path.name,
                "file_type": "audio",
                "source": "audio",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    "lecture_id is required "
                    "for audio processing."
                ),
            }

        try:

            media_result = process_media_file(
                file_path=str(path),
                file_type="audio",
                lecture_id=str(
                    lecture_id
                ),
            )

            return normalize_media_result(
                media_result,
                path,
                "audio",
            )

        except MediaProcessingError as exc:

            return {
                "file_name": path.name,
                "file_type": "audio",
                "source": "audio",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": str(exc),
            }

        except Exception as exc:

            return {
                "file_name": path.name,
                "file_type": "audio",
                "source": "audio",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    f"Unexpected audio processing error: {exc}"
                ),
            }

    # =================================================================
    # STEP 3 — VIDEO
    # =================================================================

    if extension in VIDEO_EXTENSIONS:

        if not lecture_id:

            return {
                "file_name": path.name,
                "file_type": "video",
                "source": "video",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    "lecture_id is required "
                    "for video processing."
                ),
            }

        try:

            media_result = process_media_file(
                file_path=str(path),
                file_type="video",
                lecture_id=str(
                    lecture_id
                ),
            )

            return normalize_media_result(
                media_result,
                path,
                "video",
            )

        except MediaProcessingError as exc:

            return {
                "file_name": path.name,
                "file_type": "video",
                "source": "video",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": str(exc),
            }

        except Exception as exc:

            return {
                "file_name": path.name,
                "file_type": "video",
                "source": "video",
                "document_text": None,
                "transcript": "",
                "timestamps": [],
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    f"Unexpected video processing error: {exc}"
                ),
            }

    # =================================================================
    # STEP 4 — DOCUMENT VALIDATION
    # =================================================================

    try:

        validated_path = validate_file(
            path
        )

    except FileValidationError as exc:

        return {
            "file_name": path.name,
            "file_type": extension.lstrip("."),
            "source": "document",
            "document_text": None,
            "transcript": None,
            "timestamps": None,
            "combined_text": "",
            "clean_text": "",
            "status": "error",
            "pages_or_slides": 0,
            "character_count": 0,
            "message": str(exc),
        }

    # =================================================================
    # STEP 5 — DOCUMENT TYPE DETECTION
    # =================================================================

    try:

        file_type = detect_file_type(
            validated_path
        )

    except FileValidationError as exc:

        return {
            "file_name": path.name,
            "file_type": "unknown",
            "source": "document",
            "document_text": None,
            "transcript": None,
            "timestamps": None,
            "combined_text": "",
            "clean_text": "",
            "status": "error",
            "pages_or_slides": 0,
            "character_count": 0,
            "message": str(exc),
        }

    # =================================================================
    # STEP 6 — DOCUMENT EXTRACTION
    # =================================================================

    try:

        if file_type == "pdf":

            result = process_pdf(
                validated_path
            )

        elif file_type == "pptx":

            result = process_pptx(
                validated_path
            )

        elif file_type == "ppt":

            return {
                "file_name": validated_path.name,
                "file_type": file_type,
                "source": "document",
                "document_text": None,
                "transcript": None,
                "timestamps": None,
                "combined_text": "",
                "clean_text": "",
                "status": "warning",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    "Legacy .ppt files require "
                    "conversion to .pptx before "
                    "text extraction."
                ),
            }

        elif file_type == "docx":

            result = process_docx(
                validated_path
            )

        else:

            return {
                "file_name": validated_path.name,
                "file_type": file_type,
                "source": "document",
                "document_text": None,
                "transcript": None,
                "timestamps": None,
                "combined_text": "",
                "clean_text": "",
                "status": "error",
                "pages_or_slides": 0,
                "character_count": 0,
                "message": (
                    "Unsupported document type."
                ),
            }

    except (
        PDFProcessingError,
        PPTProcessingError,
        DOCXProcessingError,
    ) as exc:

        return {
            "file_name": validated_path.name,
            "file_type": file_type,
            "source": "document",
            "document_text": None,
            "transcript": None,
            "timestamps": None,
            "combined_text": "",
            "clean_text": "",
            "status": "error",
            "pages_or_slides": 0,
            "character_count": 0,
            "message": str(exc),
        }

    # =================================================================
    # STEP 7 — NORMALIZE DOCUMENT RESULT
    # =================================================================

    return normalize_document_result(
        result,
        validated_path,
        file_type,
    )

