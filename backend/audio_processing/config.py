import os
from typing import List, Optional

from dotenv import load_dotenv


# ================================================================
# LOAD ENVIRONMENT VARIABLES
# ================================================================

load_dotenv()


# ================================================================
# SUPPORTED FILE EXTENSIONS
# ================================================================

# Audio files supported by Member 2
SUPPORTED_AUDIO_EXTENSIONS = {
    "mp3",
    "wav",
    "m4a",
    "aac",
    "flac",
    "ogg",
}


# Video files supported by Member 2
SUPPORTED_VIDEO_EXTENSIONS = {
    "mp4",
    "webm",
    "mkv",
    "avi",
    "mov",
}


# Supported source types for the media pipeline
SUPPORTED_SOURCE_TYPES = {
    "audio",
    "video",
    "youtube",
}


# ================================================================
# WHISPER CONFIGURATION
# ================================================================

# Whisper model
#
# Available examples:
# tiny
# base
# small
# medium
# large-v3
#
# "base" is a reasonable choice for initial testing.
MODEL_NAME = os.getenv(
    "AUDIO_PROCESSING_MODEL",
    "base",
)


# Language of the lecture audio
MODEL_LANGUAGE = os.getenv(
    "AUDIO_PROCESSING_LANGUAGE",
    "en",
)


# Processing device
#
# For initial testing:
#     cpu
#
# Later, if CUDA/GPU is configured:
#     cuda
MODEL_DEVICE = os.getenv(
    "AUDIO_PROCESSING_DEVICE",
    "cpu",
)


# Whisper computation type
#
# CPU:
#     int8
#
# GPU:
#     float16
#
# Keep int8 for initial CPU testing.
MODEL_COMPUTE_TYPE = os.getenv(
    "AUDIO_PROCESSING_COMPUTE_TYPE",
    "int8",
)


# ================================================================
# YOUTUBE CONFIGURATION
# ================================================================

YOUTUBE_TRANSCRIPT_PROVIDERS = [
    "youtube_api",
    "yt_dlp",
]


# ================================================================
# TRANSCRIPT CLEANING
# ================================================================

# Common filler words removed from the Whisper transcript.
FILLER_WORDS = set(
    term.strip()
    for term in os.getenv(
        "AUDIO_PROCESSING_FILLER_WORDS",
        (
            "um,uh,uhm,like,so,actually,basically,"
            "right,okay,ok,hmm,ah,oh,er,eh"
        ),
    ).split(",")
    if term.strip()
)


# Technical terms that should be preserved while cleaning.
TECHNICAL_TERMS = [
    term.strip()
    for term in os.getenv(
        "AUDIO_PROCESSING_TECHNICAL_TERMS",
        (
            "CNN,RNN,LSTM,Transformer,API,SQL,Python,"
            "recursion,backpropagation,gradient descent,"
            "ChromaDB,embeddings,attention"
        ),
    ).split(",")
    if term.strip()
]


# Maximum duration of a transcript segment.
MAX_TRANSCRIPT_SEGMENT_SECONDS = float(
    os.getenv(
        "AUDIO_PROCESSING_MAX_SEGMENT_SECONDS",
        "30",
    )
)


# ================================================================
# OUTPUT DIRECTORY
# ================================================================

_default_output_dir = os.getenv(
    "AUDIO_PROCESSING_OUTPUT_DIR",
    "outputs",
)


if os.path.isabs(_default_output_dir):

    DEFAULT_OUTPUT_DIR = _default_output_dir

else:

    DEFAULT_OUTPUT_DIR = os.path.join(
        os.path.dirname(__file__),
        _default_output_dir,
    )


# Make sure the output directory exists.
os.makedirs(
    DEFAULT_OUTPUT_DIR,
    exist_ok=True,
)