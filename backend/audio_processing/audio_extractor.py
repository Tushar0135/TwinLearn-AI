import os
import subprocess
from typing import Optional

from .config import DEFAULT_OUTPUT_DIR, SUPPORTED_VIDEO_EXTENSIONS


class AudioExtractionError(Exception):
    pass


def extract_audio_from_video(video_path: str, output_dir: Optional[str] = None) -> str:
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    if not os.path.exists(video_path):
        raise AudioExtractionError(f"Video file not found: {video_path}")

    extension = os.path.splitext(video_path)[1].lower().lstrip(".")
    if extension not in SUPPORTED_VIDEO_EXTENSIONS:
        raise AudioExtractionError(f"Unsupported video format: {extension}")

    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(video_path))[0]}.wav")
    command = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        audio_path,
    ]

    try:
        subprocess.run(command, check=True, capture_output=True)
    except subprocess.CalledProcessError as exc:
        raise AudioExtractionError(
            f"FFmpeg failed extracting audio from {video_path}: {exc.stderr.decode(errors='ignore')}"
        )

    if not os.path.exists(audio_path):
        raise AudioExtractionError(f"Audio extraction failed, output missing: {audio_path}")

    return audio_path
