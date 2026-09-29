from __future__ import annotations

from rag.models.retrieval import RetrievedChunk


class ContextService:
    """
    Converts retrieved chunks into a clean LLM context.
    """

    def build_context(
        self,
        chunks: list[RetrievedChunk]
    ) -> str:
        """
        Build structured context from retrieved chunks.
        """

        if not chunks:

            return ""

        context_parts: list[str] = []

        for index, chunk in enumerate(
            chunks,
            start=1
        ):

            metadata = chunk.metadata

            lecture_title = metadata.get(
                "lecture_title",
                "Unknown Lecture"
            )

            source_file = metadata.get(
                "source_file",
                "Unknown Source"
            )

            chunk_number = metadata.get(
                "chunk_number",
                "Unknown"
            )

            context_parts.append(
                f"""
--- SOURCE {index} ---

Lecture: {lecture_title}

Source: {source_file}

Chunk: {chunk_number}

Content:
{chunk.text}
"""
            )

        return "\n".join(context_parts)