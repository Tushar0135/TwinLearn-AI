import os
import re
from typing import Callable, Optional, Tuple

import yt_dlp

from .config import DEFAULT_OUTPUT_DIR


class YouTubeProcessingError(Exception):
    pass


YouTubeSourceResult = Tuple[Optional[str], Optional[str]]
YouTubeCaptionRetriever = Callable[[str], Optional[str]]
YouTubeAudioDownloader = Callable[[str, Optional[str]], str]


def is_valid_youtube_url(url: str) -> bool:
    return bool(re.match(r"https?://(www\.)?(youtube\.com|youtu\.be)/", url))


def _looks_like_vtt(content: str) -> bool:
    if not content or len(content.strip()) == 0:
        return False

    normalized = content.strip().lower()
    if "<!doctype html" in normalized or "<html" in normalized or "<script" in normalized:
        return False
    if not normalized.startswith("webvtt"):
        return False

    timestamp_pattern = re.compile(
        r"(?:\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(?:\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})"
    )
    return bool(timestamp_pattern.search(content))


def fetch_youtube_captions(url: str) -> Optional[str]:
    ydl_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitlesformat": "vtt",
        "quiet": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception:
            return None

        subtitles = info.get("subtitles", {}) or {}
        automatic_captions = info.get("automatic_captions", {}) or {}

        for source in [subtitles, automatic_captions]:
            for _, tracks in source.items():
                if not tracks:
                    continue
                track = tracks[0]
                if "url" not in track:
                    continue
                try:
                    content = ydl.urlopen(track["url"]).read().decode("utf-8", errors="ignore")
                except Exception:
                    continue
                if _looks_like_vtt(content):
                    return content
    return None


def download_youtube_audio(url: str, output_dir: Optional[str] = None) -> str:
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)
    output_template = os.path.join(output_dir, "%(id)s.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "quiet": True,
        "noprogress": True,
        "retries": 3,
        "socket_timeout": 20,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception as exc:
        raise YouTubeProcessingError(f"YouTube audio download failed: {exc}") from exc

    ext = info.get("ext")
    if ext is None:
        raise YouTubeProcessingError("Unable to determine downloaded audio file extension.")

    video_id = info.get("id")
    if not video_id:
        raise YouTubeProcessingError("Unable to determine YouTube video ID after download.")

    output_path = os.path.join(output_dir, f"{video_id}.{ext}")

    if not os.path.exists(output_path):
        raise YouTubeProcessingError(f"Downloaded audio not found: {output_path}")

    return output_path


def process_youtube_source(
    url: str,
    caption_retriever: YouTubeCaptionRetriever = fetch_youtube_captions,
    audio_downloader: YouTubeAudioDownloader = download_youtube_audio,
    output_dir: Optional[str] = None,
) -> YouTubeSourceResult:
    if not is_valid_youtube_url(url):
        raise YouTubeProcessingError(f"Invalid YouTube URL: {url}")

    captions = caption_retriever(url)
    if captions:
        return captions, None

    audio_file = audio_downloader(url, output_dir)
    return None, audio_file
