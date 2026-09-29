from __future__ import annotations

import re

from typing import List

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)

from rag.core.config import settings
from rag.core.logger import logger
from rag.core.exceptions import ChunkingException
from rag.models.chunk import Chunk


class ChunkService:

    def __init__(self):

        self.splitter = RecursiveCharacterTextSplitter(

            chunk_size=settings.CHUNK_SIZE,

            chunk_overlap=settings.CHUNK_OVERLAP
        )

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Remove unnecessary spaces.
        """

        text = re.sub(r"\s+", " ", text)

        return text.strip()

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Approximate token count.
        """

        return len(text.split())

    def create_chunks(

        self,

        lecture_id: str,

        lecture_title: str,

        source_file: str,

        text: str

    ) -> List[Chunk]:

        try:

            cleaned = self.clean_text(text)

            raw_chunks = self.splitter.split_text(cleaned)

            chunks = []

            for idx, chunk in enumerate(raw_chunks):

                chunks.append(

                    Chunk(

                        lecture_id=lecture_id,

                        lecture_title=lecture_title,

                        chunk_number=idx + 1,

                        source_file=source_file,

                        text=chunk,

                        token_count=self.estimate_tokens(chunk)

                    )

                )

            logger.info(

                f"{len(chunks)} chunks created."

            )

            return chunks

        except Exception as e:

            logger.exception(e)

            raise ChunkingException(
                "Chunk generation failed."
            )