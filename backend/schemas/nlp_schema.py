from typing import List

from pydantic import BaseModel, Field


class LectureMetadata(BaseModel):

    topic: str

    subtopics: List[str]

    keywords: List[str]

    difficulty: str = Field(
        pattern="^(Easy|Medium|Hard)$"
    )

    learning_objectives: List[str]

    prerequisites: List[str]

    summary: str