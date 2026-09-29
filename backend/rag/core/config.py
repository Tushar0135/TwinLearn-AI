from pathlib import Path
import os

from dotenv import load_dotenv


# ============================================================
# PATHS
# ============================================================

RAG_DIR = Path(__file__).resolve().parents[1]

BACKEND_DIR = RAG_DIR.parent


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(
    BACKEND_DIR / ".env"
)


# ============================================================
# SETTINGS
# ============================================================

class Settings:
    RAG_MAX_DISTANCE: float = 0.8

    # --------------------------------------------------------
    # ChromaDB
    # --------------------------------------------------------

    CHROMA_PATH: Path = (
        BACKEND_DIR / "chroma_db"
    )

    CHROMA_COLLECTION: str = os.getenv(
        "CHROMA_COLLECTION",
        "lecture_notes"
    )

    # --------------------------------------------------------
    # Embeddings
    # --------------------------------------------------------

    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL",
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    # --------------------------------------------------------
    # Retrieval
    # --------------------------------------------------------

    TOP_K: int = int(
        os.getenv(
            "RAG_TOP_K",
            "5"
        )
    )

    RELEVANCE_THRESHOLD: float = float(
        os.getenv(
            "RAG_RELEVANCE_THRESHOLD",
            "0.65"
        )
    )

    # --------------------------------------------------------
    # Chunking
    # --------------------------------------------------------

    CHUNK_SIZE: int = int(
        os.getenv(
            "RAG_CHUNK_SIZE",
            "800"
        )
    )

    CHUNK_OVERLAP: int = int(
        os.getenv(
            "RAG_CHUNK_OVERLAP",
            "120"
        )
    )

    # --------------------------------------------------------
    # Gemini
    # --------------------------------------------------------

    GEMINI_API_KEY: str | None = os.getenv(
        "GEMINI_API_KEY"
    )

    GEMINI_MODEL: str = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.6-flash"
    )


# ============================================================
# SETTINGS INSTANCE
# ============================================================

settings = Settings()


# ============================================================
# CREATE CHROMA DIRECTORY
# ============================================================

settings.CHROMA_PATH.mkdir(
    parents=True,
    exist_ok=True
)