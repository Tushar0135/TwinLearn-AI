"""
utils/validators.py

Reusable validation helpers and custom exception classes for file
uploads.

Validation is kept here instead of inside the FastAPI routes so that
the service layer remains clean and framework-independent.
"""

import os

from config import (
    ALLOWED_EXTENSIONS,
    EXTENSION_TO_TYPE,
    MAX_DOCUMENT_SIZE_BYTES,
    MAX_PPTX_SIZE_BYTES,
    MAX_AUDIO_SIZE_BYTES,
    MAX_VIDEO_SIZE_BYTES,
)


# ====================================================================
# CUSTOM EXCEPTION
# ====================================================================

class FileValidationError(Exception):
    """
    Raised whenever an uploaded file fails validation.

    Possible reasons:

        - Unsupported extension
        - Empty file
        - File exceeds maximum allowed size
    """

    def __init__(
        self,
        message: str
    ):
        self.message = message
        super().__init__(message)


# ====================================================================
# GET FILE EXTENSION
# ====================================================================

def get_file_extension(
    filename: str
) -> str:
    """
    Return the lowercase file extension including the dot.

    Examples:

        lecture.pdf
            → .pdf

        lecture.MP4
            → .mp4

        lecture
            → ""
    """

    return os.path.splitext(
        filename
    )[1].lower()


# ====================================================================
# DETECT FILE TYPE
# ====================================================================

def detect_file_type(
    filename: str
) -> str:
    """
    Convert a filename extension into a friendly file type.

    Examples:

        .pdf
            → pdf

        .docx
            → docx

        .pptx
            → pptx

        .mp3
            → audio

        .wav
            → audio

        .mp4
            → video

        .mov
            → video

    Raises:
        FileValidationError:
            If the extension is unsupported.
    """

    ext = get_file_extension(
        filename
    )

    if ext not in EXTENSION_TO_TYPE:

        raise FileValidationError(
            f"Unsupported file type "
            f"'{ext or 'unknown'}'. "
            f"Allowed types: "
            f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    return EXTENSION_TO_TYPE[
        ext
    ]


# ====================================================================
# GET MAXIMUM SIZE FOR FILE
# ====================================================================

def get_max_file_size(
    filename: str
) -> int:
    """
    Return the maximum allowed file size in bytes.

    Limits:

        PDF/DOCX → 20 MB
        PPTX     → 50 MB
        Audio    → 100 MB
        Video    → 500 MB
    """

    ext = get_file_extension(
        filename
    )

    if ext not in EXTENSION_TO_TYPE:

        raise FileValidationError(
            f"Unsupported file type "
            f"'{ext or 'unknown'}'."
        )

    file_type = EXTENSION_TO_TYPE[
        ext
    ]

    # Audio
    if file_type == "audio":

        return MAX_AUDIO_SIZE_BYTES

    # Video
    if file_type == "video":

        return MAX_VIDEO_SIZE_BYTES

    # PPTX
    if file_type == "pptx":

        return MAX_PPTX_SIZE_BYTES

    # PDF / DOCX
    return MAX_DOCUMENT_SIZE_BYTES


# ====================================================================
# VALIDATE UPLOAD
# ====================================================================

def validate_upload(
    filename: str,
    file_bytes: bytes
) -> None:
    """
    Validate an uploaded lecture file.

    Validation checks:

        1. File extension
        2. Empty file
        3. Maximum file size

    Supported files:

        Documents:
            PDF
            DOCX

        Presentation:
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

    Raises:
        FileValidationError:
            If validation fails.
    """

    # ================================================================
    # 1. EXTENSION CHECK
    # ================================================================

    ext = get_file_extension(
        filename
    )

    if ext not in ALLOWED_EXTENSIONS:

        raise FileValidationError(
            f"File type "
            f"'{ext or 'unknown'}' "
            f"is not supported. "
            f"Allowed types: "
            f"{', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    # ================================================================
    # 2. EMPTY FILE CHECK
    # ================================================================

    if len(file_bytes) == 0:

        raise FileValidationError(
            "The uploaded file is empty."
        )

    # ================================================================
    # 3. GET MAXIMUM SIZE
    # ================================================================

    max_size = get_max_file_size(
        filename
    )

    # ================================================================
    # 4. FILE SIZE CHECK
    # ================================================================

    file_size = len(
        file_bytes
    )

    if file_size > max_size:

        size_mb = (
            file_size
            / (1024 * 1024)
        )

        max_size_mb = (
            max_size
            / (1024 * 1024)
        )

        file_type = EXTENSION_TO_TYPE[
            ext
        ]

        raise FileValidationError(
            f"File is too large "
            f"({size_mb:.2f} MB). "
            f"Maximum allowed size for "
            f"{file_type} files is "
            f"{max_size_mb:.0f} MB."
        )