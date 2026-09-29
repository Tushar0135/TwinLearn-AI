"""
services/media_service.py

Adapter between the LearnTwin backend and Member 2's
audio/video processing pipeline.

This service does NOT duplicate Whisper, audio extraction,
or transcript cleaning logic.

It calls Member 2's existing pipeline and preserves the
complete processing result, including:

    - transcript
    - timestamps
    - combined_text
    - source
    - document_text

It also converts Member 2's TranscriptSegment objects
into JSON-serializable dictionaries so that FastAPI/Pydantic
can return them through UploadResponse.
"""

from pathlib import Path

from audio_processing.pipeline import (
    process_lecture,
    PipelineError,
)


# ==============================================================
# MEDIA PROCESSING ERROR
# ==============================================================

class MediaProcessingError(Exception):
    """
    Raised when audio/video processing fails.
    """

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


# ==============================================================
# TIMESTAMP CONVERSION
# ==============================================================

def convert_timestamp_segment(segment) -> dict:
    """
    Convert a Member 2 TranscriptSegment object into
    a normal JSON-serializable dictionary.

    Member 2 may return:

        TranscriptSegment(
            start=0.0,
            end=4.72,
            text="Hello..."
        )

    FastAPI/Pydantic should receive:

        {
            "start": 0.0,
            "end": 4.72,
            "text": "Hello..."
        }

    Supports:

        1. dict
        2. Pydantic models
        3. dataclass/object with attributes
    """

    # ----------------------------------------------------------
    # CASE 1 — Already a dictionary
    # ----------------------------------------------------------

    if isinstance(segment, dict):

        return {
            "start": float(
                segment.get(
                    "start",
                    0.0,
                )
            ),

            "end": float(
                segment.get(
                    "end",
                    0.0,
                )
            ),

            "text": str(
                segment.get(
                    "text",
                    "",
                )
            ),
        }

    # ----------------------------------------------------------
    # CASE 2 — Pydantic model
    # ----------------------------------------------------------

    if hasattr(
        segment,
        "model_dump",
    ):

        data = segment.model_dump()

        return {
            "start": float(
                data.get(
                    "start",
                    0.0,
                )
            ),

            "end": float(
                data.get(
                    "end",
                    0.0,
                )
            ),

            "text": str(
                data.get(
                    "text",
                    "",
                )
            ),
        }

    # ----------------------------------------------------------
    # CASE 3 — Dataclass / normal Python object
    # ----------------------------------------------------------

    return {
        "start": float(
            getattr(
                segment,
                "start",
                0.0,
            )
        ),

        "end": float(
            getattr(
                segment,
                "end",
                0.0,
            )
        ),

        "text": str(
            getattr(
                segment,
                "text",
                "",
            )
        ),
    }


# ==============================================================
# TIMESTAMP LIST CONVERSION
# ==============================================================

def convert_timestamps(
    timestamps,
) -> list:
    """
    Convert the complete timestamp list into
    JSON-serializable dictionaries.

    Input:

        [
            TranscriptSegment(...),
            TranscriptSegment(...),
        ]

    Output:

        [
            {
                "start": 0.0,
                "end": 4.72,
                "text": "..."
            },
            {
                "start": 4.72,
                "end": 7.12,
                "text": "..."
            }
        ]
    """

    if not timestamps:

        return []

    return [
        convert_timestamp_segment(
            segment
        )
        for segment in timestamps
    ]


# ==============================================================
# MAIN MEDIA PROCESSING FUNCTION
# ==============================================================

def process_media_file(
    file_path: str,
    file_type: str,
    lecture_id: str,
) -> dict:
    """
    Process an audio or video lecture using Member 2's pipeline.

    Args:
        file_path:
            Path to the uploaded audio/video file.

        file_type:
            Either:
                "audio"
                "video"

        lecture_id:
            ID of the Lecture database record.

    Returns:
        Dictionary containing:

            - standardized fields required by
              preprocessing/main.py

            - complete Member 2 processing result

            - JSON-safe timestamps
    """

    # ==============================================================
    # STEP 1 — VALIDATE SOURCE TYPE
    # ==============================================================

    file_type = (
        file_type
        .lower()
        .strip()
    )

    if file_type not in {
        "audio",
        "video",
    }:

        raise MediaProcessingError(
            f"Unsupported media type: {file_type}"
        )

    # ==============================================================
    # STEP 2 — VALIDATE FILE
    # ==============================================================

    path = Path(
        file_path
    )

    if not path.exists():

        raise MediaProcessingError(
            f"Media file does not exist: {file_path}"
        )

    # ==============================================================
    # STEP 3 — CALL MEMBER 2 PIPELINE
    # ==============================================================

    try:

        processed = process_lecture(

            source_type=file_type,

            input_data=str(
                path
            ),

            lecture_id=str(
                lecture_id
            ),
        )

    except PipelineError as exc:

        raise MediaProcessingError(
            str(exc)
        ) from exc

    except Exception as exc:

        raise MediaProcessingError(
            f"Unexpected media processing error: {exc}"
        ) from exc

    # ==============================================================
    # STEP 4 — EXTRACT MEMBER 2 RESULT
    # ==============================================================

    source = getattr(
        processed,
        "source",
        file_type,
    )

    document_text = getattr(
        processed,
        "document_text",
        None,
    )

    transcript = getattr(
        processed,
        "transcript",
        "",
    )

    raw_timestamps = getattr(
        processed,
        "timestamps",
        [],
    )

    combined_text = getattr(
        processed,
        "combined_text",
        "",
    )

    # ==============================================================
    # STEP 5 — NORMALIZE TEXT VALUES
    # ==============================================================

    if transcript is None:

        transcript = ""

    if combined_text is None:

        combined_text = ""

    if document_text is not None:

        document_text = str(
            document_text
        )

    transcript = str(
        transcript
    ).strip()

    combined_text = str(
        combined_text
    ).strip()

    # ==============================================================
    # STEP 6 — CONVERT TIMESTAMPS
    # ==============================================================

    """
    THIS IS THE IMPORTANT FIX.

    Previously:

        timestamps = raw_timestamps

    which meant the response contained:

        TranscriptSegment(...)

    objects.

    Now:

        TranscriptSegment
                ↓
        convert_timestamp_segment()
                ↓
        normal dictionary
                ↓
        Pydantic TimestampItem
                ↓
        JSON
    """

    try:

        timestamps = convert_timestamps(
            raw_timestamps
        )

    except Exception as exc:

        raise MediaProcessingError(
            f"Failed to convert transcript timestamps: {exc}"
        ) from exc

    # ==============================================================
    # STEP 7 — DETERMINE FINAL CLEAN TEXT
    # ==============================================================

    """
    combined_text is normally the final cleaned lecture text.

    If combined_text is empty but transcript exists,
    transcript is used as the fallback.
    """

    clean_text = combined_text

    if (
        not clean_text
        and transcript
    ):

        clean_text = transcript

    clean_text = clean_text.strip()

    # ==============================================================
    # STEP 8 — NO TEXT GENERATED
    # ==============================================================

    if not clean_text:

        return {

            # ------------------------------------------------------
            # Standardized preprocessing fields
            # ------------------------------------------------------

            "file_name": path.name,

            "file_type": file_type,

            "status": "warning",

            "pages_or_slides": 0,

            "clean_text": "",

            "character_count": 0,

            # ------------------------------------------------------
            # Complete Member 2 result
            # ------------------------------------------------------

            "lecture_id": str(
                lecture_id
            ),

            "source": source,

            "document_text": document_text,

            "transcript": transcript,

            "timestamps": timestamps,

            "combined_text": combined_text,

            "message": (
                "No transcript could be generated "
                "from the media file."
            ),
        }

    # ==============================================================
    # STEP 9 — RETURN COMPLETE RESULT
    # ==============================================================

    return {

        # ==========================================================
        # STANDARDIZED FIELDS
        # ==========================================================

        "file_name": path.name,

        "file_type": file_type,

        "status": "success",

        "pages_or_slides": 0,

        "clean_text": clean_text,

        "character_count": len(
            clean_text
        ),

        # ==========================================================
        # COMPLETE MEMBER 2 RESULT
        # ==========================================================

        "lecture_id": str(
            lecture_id
        ),

        "source": source,

        "document_text": document_text,

        "transcript": transcript,

        "timestamps": timestamps,

        "combined_text": combined_text,
    }