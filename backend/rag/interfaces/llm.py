from __future__ import annotations

from typing import Protocol


class LLMService(Protocol):
    """
    Contract for any LLM provider.

    Can be implemented by:
    - Gemini
    - OpenAI
    - Claude
    - Local LLM
    """

    def generate(
        self,
        prompt: str
    ) -> str:
        ...