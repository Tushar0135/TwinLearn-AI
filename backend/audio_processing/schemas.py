from typing import List, Optional

from pydantic import BaseModel, Field, validator


class TranscriptSegment(BaseModel):
    start: float = Field(..., ge=0.0)
    end: float = Field(..., ge=0.0)
    text: str

    @validator("end")
    def end_must_be_after_start(cls, value, values):
        if "start" in values and value < values["start"]:
            raise ValueError("end must be >= start")
        return value


class MemberDocument(BaseModel):
    lecture_id: str
    source: str
    text: str


class ProcessedLecture(BaseModel):
    lecture_id: str
    source: str
    document_text: Optional[str] = None
    transcript: str
    timestamps: List[TranscriptSegment]
    combined_text: str
