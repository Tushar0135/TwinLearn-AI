from __future__ import annotations

from threading import Lock
from typing import List, Optional

from sentence_transformers import SentenceTransformer

from rag.core.config import settings
from rag.core.exceptions import EmbeddingException
from rag.core.logger import logger


class EmbeddingService:
    """
    Production Ready Embedding Service

    Features

    ✓ Singleton

    ✓ Lazy Loading

    ✓ Thread Safe

    ✓ Logging

    ✓ Exception Handling
    """

    _instance = None

    _lock = Lock()

    def __new__(cls):

        if cls._instance is None:

            cls._instance = super().__new__(cls)

        return cls._instance

    def __init__(self):

        if hasattr(self, "_initialized"):

            return

        self._model: Optional[SentenceTransformer] = None

        self._initialized = True

    def _get_model(self) -> SentenceTransformer:
        """
        Return the embedding model.
        Load it lazily if it has not been loaded yet.
        """

        if self._model is None:

            with self._lock:

                if self._model is None:

                    logger.info("Loading embedding model...")

                    try:

                        self._model = SentenceTransformer(
                            settings.EMBEDDING_MODEL
                        )

                        logger.info("Embedding model loaded successfully.")

                    except Exception as e:

                        logger.exception(e)

                        raise EmbeddingException(
                            "Unable to load embedding model."
                        )

        return self._model
    def embed_documents(
        self,
        documents: List[str]
    ) -> List[List[float]]:

        model = self._get_model()

        try:

            return model.encode(
                documents,
                normalize_embeddings=True,
                convert_to_numpy=True
            ).tolist()

        except Exception as e:

            logger.exception(e)

            raise EmbeddingException(
                "Document embedding failed."
            )

    def embed_query(
        self,
        query: str
    ) -> List[float]:

        model = self._get_model()

        try:

            return model.encode(
                query,
                normalize_embeddings=True,
                convert_to_numpy=True
            ).tolist()

        except Exception as e:

            logger.exception(e)

            raise EmbeddingException(
                "Query embedding failed."
            )