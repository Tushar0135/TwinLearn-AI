from typing import List

from .schemas import MemberDocument, ProcessedLecture, TranscriptSegment
from .transcript_cleaner import build_combined_text


def merge_document_with_transcript(
    lecture_id: str,
    source: str,
    cleaned_segments: List[TranscriptSegment],
    document_data: MemberDocument | None = None,
) -> ProcessedLecture:
    transcript_text = " ".join(segment.text for segment in cleaned_segments).strip()
    document_text = document_data.text if document_data else None
    combined_text = build_combined_text(document_text or "", cleaned_segments)

    return ProcessedLecture(
        lecture_id=lecture_id,
        source=source,
        document_text=document_text,
        transcript=transcript_text,
        timestamps=cleaned_segments,
        combined_text=combined_text,
    )
