import os
import re
from pathlib import Path
from typing import Any, Dict, Optional, Union

from .audio_extractor import (
    AudioExtractionError,
    extract_audio_from_video,
)

from .config import DEFAULT_OUTPUT_DIR

from .schemas import (
    MemberDocument,
    ProcessedLecture,
)

from .transcript_cleaner import (
    TranscriptCleaningError,
    clean_transcript_segments,
)

from .transcript_merger import (
    merge_document_with_transcript,
)

from .whisper_processor import (
    WhisperProcessingError,
    parse_vtt_transcript,
    transcribe_audio,
)

from .youtube_processor import (
    YouTubeProcessingError,
    process_youtube_source,
)


class PipelineError(Exception):
    pass


def sanitize_text(
    value: str
) -> str:

    sanitized = re.sub(
        r"[^a-zA-Z0-9]+",
        "_",
        value,
    ).strip("_")

    return (
        sanitized.lower()
        if sanitized
        else "lecture"
    )


def generate_output_filename(
    lecture_id: str,
    lecture_title: Optional[str] = None,
    output_dir: Optional[
        Union[str, os.PathLike]
    ] = None,
) -> Path:

    output_dir = Path(
        output_dir or DEFAULT_OUTPUT_DIR
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    base_name = lecture_id.lower()

    if lecture_title:

        base_name = (
            f"{base_name}_"
            f"{sanitize_text(lecture_title)}"
        )

    candidate = (
        output_dir
        / f"{base_name}.json"
    )

    if not candidate.exists():
        return candidate

    suffix = 1

    while True:

        candidate = (
            output_dir
            / f"{base_name}_{suffix}.json"
        )

        if not candidate.exists():
            return candidate

        suffix += 1


def save_processed_lecture(
    result: ProcessedLecture,
    lecture_title: Optional[str] = None,
    output_dir: Optional[
        Union[str, os.PathLike]
    ] = None,
) -> Path:

    output_path = generate_output_filename(
        result.lecture_id,
        lecture_title,
        output_dir,
    )

    output_path.write_text(
        result.model_dump_json(
            indent=2
        ),
        encoding="utf-8",
    )

    return output_path


def process_lecture(
    source_type: str,
    input_data: str,
    lecture_id: str,
    document_data: Optional[
        Dict[str, Any]
    ] = None,
) -> ProcessedLecture:

    source_type = source_type.lower()

    if source_type not in {
        "audio",
        "video",
        "youtube",
    }:

        raise PipelineError(
            f"Unsupported source_type: "
            f"{source_type}"
        )

    # --------------------------------------------------------------
    # Optional document information
    # --------------------------------------------------------------

    document_model = None

    if document_data is not None:

        document_model = MemberDocument(
            **document_data
        )

        if (
            document_model.lecture_id
            != lecture_id
        ):

            raise PipelineError(
                "lecture_id mismatch between "
                "input and document_data."
            )

    transcript_segments = []

    source = source_type

    # --------------------------------------------------------------
    # TRANSCRIPTION
    # --------------------------------------------------------------

    try:

        if source_type == "audio":

            transcript_segments = (
                transcribe_audio(
                    input_data
                )
            )

        elif source_type == "video":

            audio_file = (
                extract_audio_from_video(
                    input_data
                )
            )

            transcript_segments = (
                transcribe_audio(
                    audio_file
                )
            )

        else:

            captions, audio_file = (
                process_youtube_source(
                    input_data
                )
            )

            if captions:

                transcript_segments = (
                    parse_vtt_transcript(
                        captions
                    )
                )

            elif audio_file:

                transcript_segments = (
                    transcribe_audio(
                        audio_file
                    )
                )

            else:

                raise PipelineError(
                    "Unable to obtain YouTube "
                    "transcript or audio."
                )

        # ----------------------------------------------------------
        # CLEAN TRANSCRIPT
        # ----------------------------------------------------------

        cleaned_segments = (
            clean_transcript_segments(
                transcript_segments
            )
        )

    except (
        AudioExtractionError,
        TranscriptCleaningError,
        YouTubeProcessingError,
        WhisperProcessingError,
    ) as exc:

        raise PipelineError(
            str(exc)
        ) from exc

    # --------------------------------------------------------------
    # MERGE DOCUMENT + TRANSCRIPT
    # --------------------------------------------------------------

    processed = (
        merge_document_with_transcript(
            lecture_id=lecture_id,
            source=source,
            cleaned_segments=cleaned_segments,
            document_data=document_model,
        )
    )

    # --------------------------------------------------------------
    # SAVE JSON RESULT
    # --------------------------------------------------------------

    save_processed_lecture(
        processed,
        lecture_title=None,
    )

    return processed