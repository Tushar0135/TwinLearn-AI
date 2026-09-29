"""
services/file_service.py

Handles all raw file-system operations related to uploaded files:
    - Saving uploaded bytes into /uploads with a safe, unique filename
    - Computing file size
    - Saving the merged extracted text into /extracted_text

This module deliberately knows NOTHING about FastAPI, databases, or
text extraction logic — it only deals with the filesystem. This
separation makes it trivial to unit test or swap for cloud storage
(e.g. S3) later without touching the rest of the app.
"""

import os
import uuid

from config import UPLOAD_DIR, EXTRACTED_TEXT_DIR
from utils.logger import get_logger

logger = get_logger(__name__)


def save_uploaded_file(original_filename: str, file_bytes: bytes) -> str:
    """
    Saves raw file bytes to the /uploads directory using a unique
    filename (UUID prefix) so two students uploading files with the
    same name ("notes.pdf") never overwrite each other.

    Args:
        original_filename: The filename provided by the client.
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        The full path where the file was saved on disk.
    """
    _, ext = os.path.splitext(original_filename)
    unique_name = f"{uuid.uuid4().hex}{ext.lower()}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(save_path, "wb") as f:
        f.write(file_bytes)

    logger.info("Saved uploaded file '%s' -> '%s'", original_filename, save_path)
    return save_path


def save_extracted_text(lecture_id: str, text: str) -> str:
    """
    Saves the merged extracted text into a .txt file inside
    /extracted_text, named after the lecture's unique ID.

    Args:
        lecture_id: The unique lecture ID this text belongs to.
        text: The full merged extracted text.

    Returns:
        The full path of the saved .txt file.
    """
    save_path = os.path.join(EXTRACTED_TEXT_DIR, f"{lecture_id}.txt")
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(text)

    logger.info("Saved extracted text for lecture %s -> '%s'", lecture_id, save_path)
    return save_path


def get_file_size_kb(file_bytes: bytes) -> int:
    """Returns file size in whole kilobytes (rounded up so 0-byte-only files show 0)."""
    return max(1, len(file_bytes) // 1024) if file_bytes else 0
