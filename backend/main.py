"""
main.py

Entry point of the LearnTwin AI Professor backend.

Run from the backend directory:

    python -m uvicorn main:app --reload

Then open:

    http://127.0.0.1:8000/
    http://127.0.0.1:8000/docs
    http://127.0.0.1:8000/redoc
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.db import init_db

# ============================================================
# ROUTES
# ============================================================

from routes import (
    auth_routes,
    upload_routes,
    history_routes,
    rag_routes,
    adaptive_routes,
    dashboard_routes,
)

from routes.quiz_routes import router as quiz_router

from utils.logger import get_logger


# ============================================================
# LOGGER
# ============================================================

logger = get_logger(__name__)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.

    Startup:
        - Initialize database
        - Load all SQLAlchemy models
        - Start backend

    Shutdown:
        - Log backend shutdown
    """

    # --------------------------------------------------------
    # STARTUP
    # --------------------------------------------------------

    try:

        init_db()

        logger.info(
            "Database initialized successfully."
        )

        logger.info(
            "LearnTwin AI Professor backend "
            "started successfully."
        )

    except Exception as exc:

        logger.exception(
            "Database initialization failed: %s",
            exc,
        )

        raise

    # --------------------------------------------------------
    # APPLICATION RUNNING
    # --------------------------------------------------------

    yield

    # --------------------------------------------------------
    # SHUTDOWN
    # --------------------------------------------------------

    logger.info(
        "LearnTwin AI Professor backend "
        "is shutting down."
    )


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(

    title=(
        "LearnTwin AI Professor — "
        "Learning & Performance API"
    ),

    description="""
Backend service for the LearnTwin AI Professor project.

The API handles:

- Student authentication
- Lecture uploads
- PDF extraction
- DOCX extraction
- PPTX extraction
- Audio transcription
- Video audio extraction
- Whisper transcription
- Timestamp generation
- Transcript cleaning
- Combined lecture text generation
- Lecture upload history
- Adaptive learning
- Quiz generation
- Quiz submission
- Test result storage
- Student performance analytics
- Learning progress
- Topic mastery
- Weak topic detection
- Learning history
- Dashboard data

### Supported document files

- PDF
- DOCX
- PPTX

### Supported audio files

- MP3
- WAV
- M4A
- AAC
- FLAC
- OGG

### Supported video files

- MP4
- WEBM
- MKV
- AVI
- MOV

### YouTube

The backend can also download lecture audio from
a YouTube URL and send it through the same
audio-processing pipeline.
""",

    version="1.0.0",

    lifespan=lifespan,

    swagger_ui_parameters={
        "persistAuthorization": True
    },
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "*"
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ============================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================

@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    """
    Catch unexpected exceptions.

    The complete exception is logged on the backend,
    while the frontend receives a safe error message.
    """

    logger.exception(

        "Unhandled exception on %s %s: %s",

        request.method,

        request.url.path,

        exc,
    )

    return JSONResponse(

        status_code=500,

        content={
            "detail": (
                "An unexpected internal server error "
                "occurred."
            )
        },
    )


# ============================================================
# ROUTERS
# ============================================================


# ------------------------------------------------------------
# AUTHENTICATION
# ------------------------------------------------------------

app.include_router(
    auth_routes.router
)


# ------------------------------------------------------------
# ADAPTIVE LEARNING
# ------------------------------------------------------------

app.include_router(
    adaptive_routes.router
)


# ------------------------------------------------------------
# DASHBOARD / LEARNING PROGRESS
# ------------------------------------------------------------

app.include_router(
    dashboard_routes.router
)


# ------------------------------------------------------------
# UPLOAD
# ------------------------------------------------------------

app.include_router(
    upload_routes.router
)


# ------------------------------------------------------------
# HISTORY
# ------------------------------------------------------------

app.include_router(
    history_routes.router
)


# ------------------------------------------------------------
# RAG
# ------------------------------------------------------------

app.include_router(
    rag_routes.router
)


# ------------------------------------------------------------
# QUIZ
# ------------------------------------------------------------

app.include_router(
    quiz_router
)


# ============================================================
# ROOT / HEALTH CHECK
# ============================================================

@app.get(
    "/",
    tags=[
        "Health"
    ],
    summary="Health check",
)
def root():

    return {

        "status": "ok",

        "service": (
            "LearnTwin AI Professor"
        ),

        "version": "1.0.0",

        "docs": "/docs",

        "redoc": "/redoc",
    }


# ============================================================
# DETAILED HEALTH CHECK
# ============================================================

@app.get(
    "/health",
    tags=[
        "Health"
    ],
    summary="Detailed health check",
)
def health_check():

    return {

        "status": "healthy",

        "service": (
            "LearnTwin AI Professor"
        ),

        "backend": "running",

    }