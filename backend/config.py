"""
config.py

Central configuration file for the LearnTwin AI Professor backend.

Keeping all constants (file paths, size limits, security keys,
allowed file types) in ONE place makes the project easy to maintain.
"""

import os


# --------------------------------------------------------------------
# BASE DIRECTORY
# --------------------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# --------------------------------------------------------------------
# FOLDER PATHS
# --------------------------------------------------------------------

UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "uploads"
)

EXTRACTED_TEXT_DIR = os.path.join(
    BASE_DIR,
    "extracted_text"
)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)


# Make sure these folders exist.
os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    EXTRACTED_TEXT_DIR,
    exist_ok=True
)

os.makedirs(
    LOG_DIR,
    exist_ok=True
)


# --------------------------------------------------------------------
# FILE EXTENSIONS
# --------------------------------------------------------------------

# -------------------------
# Document files
# -------------------------

DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".docx",
}


# -------------------------
# Presentation files
# -------------------------

PRESENTATION_EXTENSIONS = {
    ".pptx",
}


# -------------------------
# Audio files
# -------------------------

AUDIO_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".flac",
    ".ogg",
}


# -------------------------
# Video files
# -------------------------

VIDEO_EXTENSIONS = {
    ".mp4",
    ".webm",
    ".mkv",
    ".avi",
    ".mov",
}


# --------------------------------------------------------------------
# ALL ALLOWED EXTENSIONS
# --------------------------------------------------------------------

ALLOWED_EXTENSIONS = (
    DOCUMENT_EXTENSIONS
    | PRESENTATION_EXTENSIONS
    | AUDIO_EXTENSIONS
    | VIDEO_EXTENSIONS
)


# --------------------------------------------------------------------
# EXTENSION → FILE TYPE
# --------------------------------------------------------------------

EXTENSION_TO_TYPE = {

    # Documents
    ".pdf": "pdf",
    ".docx": "docx",

    # Presentation
    ".pptx": "pptx",

    # Audio
    ".mp3": "audio",
    ".wav": "audio",
    ".m4a": "audio",
    ".aac": "audio",
    ".flac": "audio",
    ".ogg": "audio",

    # Video
    ".mp4": "video",
    ".webm": "video",
    ".mkv": "video",
    ".avi": "video",
    ".mov": "video",
}


# --------------------------------------------------------------------
# FILE SIZE LIMITS
# --------------------------------------------------------------------

# PDF / DOCX
MAX_DOCUMENT_SIZE_BYTES = (
    20 * 1024 * 1024
)  # 20 MB


# PPTX
MAX_PPTX_SIZE_BYTES = (
    50 * 1024 * 1024
)  # 50 MB


# Audio
MAX_AUDIO_SIZE_BYTES = (
    100 * 1024 * 1024
)  # 100 MB


# Video
MAX_VIDEO_SIZE_BYTES = (
    500 * 1024 * 1024
)  # 500 MB


# --------------------------------------------------------------------
# PROCESSING STATUS CONSTANTS
# --------------------------------------------------------------------

STATUS_UPLOADING = "Uploading"

STATUS_EXTRACTING = "Extracting"

STATUS_COMPLETED = "Completed"

STATUS_FAILED = "Failed"


# --------------------------------------------------------------------
# SECURITY / AUTH SETTINGS
# --------------------------------------------------------------------

SECRET_KEY = os.getenv(
    "LEARNTWIN_SECRET_KEY",
    "learntwin-super-secret-key-change-me"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = (
    60 * 24
)  # 24 hours


# --------------------------------------------------------------------
# DATABASE
# --------------------------------------------------------------------

DATABASE_URL = (
    f"sqlite:///"
    f"{os.path.join(BASE_DIR, 'learntwin.db')}"
)