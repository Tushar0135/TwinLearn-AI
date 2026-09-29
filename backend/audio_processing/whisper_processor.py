import os
from typing import List

from faster_whisper import WhisperModel

from .config import MODEL_COMPUTE_TYPE, MODEL_DEVICE, MODEL_LANGUAGE, MODEL_NAME
from .schemas import TranscriptSegment


class WhisperProcessingError(Exception):
    pass


def transcribe_audio(audio_path: str) -> List[TranscriptSegment]:
    if not os.path.exists(audio_path):
        raise WhisperProcessingError(f"Audio file not found: {audio_path}")

    try:
        model = WhisperModel(MODEL_NAME, device=MODEL_DEVICE, compute_type=MODEL_COMPUTE_TYPE)
        segments, _ = model.transcribe(audio_path, language=MODEL_LANGUAGE, beam_size=5)
    except Exception as exc:
        raise WhisperProcessingError(f"Whisper transcription failed: {exc}") from exc

    if not segments:
        raise WhisperProcessingError("Transcription returned no segments.")

    transcript_segments: List[TranscriptSegment] = []
    for segment in segments:
        start = float(segment.start)
        end = float(segment.end)
        text = segment.text.strip()
        transcript_segments.append(TranscriptSegment(start=start, end=end, text=text))

    return transcript_segments


def parse_vtt_transcript(raw_vtt: str) -> List[TranscriptSegment]:
    lines = raw_vtt.splitlines()
    segments: List[TranscriptSegment] = []
    buffer_text = []
    start = end = None

    def flush_segment():
        nonlocal buffer_text, start, end
        if start is not None and end is not None and buffer_text:
            segments.append(
                TranscriptSegment(start=start, end=end, text=" ".join(buffer_text).strip())
            )
        buffer_text = []
        start = end = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            flush_segment()
            continue

        if "-->" in stripped:
            parts = stripped.split("-->")
            if len(parts) != 2:
                raise WhisperProcessingError(f"Invalid VTT cue: {stripped}")
            start = parse_vtt_timestamp(parts[0].strip())
            end = parse_vtt_timestamp(parts[1].strip())
            continue

        if stripped.isdigit():
            continue

        buffer_text.append(stripped)

    flush_segment()
    return segments


def parse_vtt_timestamp(timestamp: str) -> float:
    parts = timestamp.split(":")
    if len(parts) == 3:
        hours, minutes, rest = parts
    elif len(parts) == 2:
        hours = 0
        minutes, rest = parts
    else:
        raise WhisperProcessingError(f"Unsupported VTT timestamp: {timestamp}")

    if "." in rest:
        seconds, milliseconds = rest.split(".", 1)
    else:
        seconds, milliseconds = rest, "0"

    return float(hours) * 3600 + float(minutes) * 60 + float(seconds) + float(milliseconds) / 1000


def segments_to_text(segments: List[TranscriptSegment]) -> str:
    return " ".join(segment.text for segment in segments).strip()
