from __future__ import annotations

import time

from google import genai

from rag.core.config import settings
from rag.core.exceptions import RAGException
from rag.core.logger import logger


class GeminiService:

    def __init__(self) -> None:

        if not settings.GEMINI_API_KEY:
            raise RAGException(
                "GEMINI_API_KEY is not configured."
            )

        self._client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self._model = settings.GEMINI_MODEL

        logger.info(
            "GeminiService initialized. Model=%s",
            self._model
        )

    def generate(
        self,
        prompt: str
    ) -> str:

        if not prompt or not prompt.strip():
            raise RAGException(
                "LLM prompt cannot be empty."
            )

        max_retries = 3

        for attempt in range(max_retries):

            try:

                logger.info(
                    "Gemini request attempt %d/%d",
                    attempt + 1,
                    max_retries
                )

                response = (
                    self._client.models.generate_content(
                        model=self._model,
                        contents=prompt,
                    )
                )

                answer = getattr(
                    response,
                    "text",
                    None
                )

                if not answer:

                    raise RAGException(
                        "Gemini returned an empty response."
                    )

                return answer.strip()

            except RAGException:
                raise

            except Exception as exc:

                error_text = str(exc)

                logger.exception(
                    "Gemini request failed: %s",
                    error_text
                )

                # ============================================
                # 429 — RATE LIMIT / QUOTA
                # ============================================

                if (
                    "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                ):

                    if attempt < max_retries - 1:

                        wait_time = (
                            5 * (attempt + 1)
                        )

                        logger.warning(
                            "Gemini rate limited. "
                            "Retrying in %d seconds.",
                            wait_time
                        )

                        time.sleep(
                            wait_time
                        )

                        continue

                    raise RAGException(
                        "The AI Professor has reached "
                        "the Gemini API quota. "
                        "Please try again later."
                    ) from exc

                # ============================================
                # 503 — MODEL TEMPORARILY UNAVAILABLE
                # ============================================

                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                ):

                    if attempt < max_retries - 1:

                        wait_time = (
                            5 * (attempt + 1)
                        )

                        logger.warning(
                            "Gemini model temporarily "
                            "unavailable. "
                            "Retrying in %d seconds.",
                            wait_time
                        )

                        time.sleep(
                            wait_time
                        )

                        continue

                    raise RAGException(
                        "The Gemini model is temporarily "
                        "unavailable due to high demand. "
                        "Please try again shortly."
                    ) from exc

                # ============================================
                # OTHER ERROR
                # ============================================

                raise RAGException(
                    f"Gemini API error: "
                    f"{type(exc).__name__}: {exc}"
                ) from exc

        raise RAGException(
            "Unable to generate AI response."
        )