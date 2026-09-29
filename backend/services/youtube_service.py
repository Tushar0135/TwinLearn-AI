"""
services/youtube_service.py

Download audio from YouTube videos.

Supports:
    - YouTube video URLs
    - YouTube Music URLs
    - YouTube Shorts URLs

Pipeline:

    YouTube URL
        ↓
    yt-dlp
        ↓
    Best available audio
        ↓
    FFmpeg
        ↓
    MP3 bytes
        ↓
    Existing lecture/audio pipeline

Returns:
    tuple[str, bytes]:
        (filename, audio_bytes)
"""

import os
import shutil
import tempfile

import yt_dlp

from utils.logger import get_logger


logger = get_logger(__name__)


# ============================================================
# RUNTIME CONFIGURATION
# ============================================================

NODE_PATH = shutil.which("node")

if NODE_PATH:
    logger.info(
        "Node.js found at: %s",
        NODE_PATH,
    )
else:
    logger.warning(
        "Node.js was not found in PATH. "
        "Modern YouTube extraction may fail."
    )


# ============================================================
# FFMPEG CONFIGURATION
# ============================================================

FFMPEG_PATH = shutil.which("ffmpeg")

if FFMPEG_PATH:

    FFMPEG_DIR = os.path.dirname(
        FFMPEG_PATH
    )

    logger.info(
        "FFmpeg found at: %s",
        FFMPEG_PATH,
    )

else:

    FFMPEG_DIR = None

    logger.warning(
        "FFmpeg was not found in PATH. "
        "MP3 conversion may fail."
    )


# ============================================================
# URL VALIDATION
# ============================================================

def is_youtube_url(url: str) -> bool:
    """
    Basic validation for supported YouTube URLs.
    """

    if not url:
        return False

    url = url.lower().strip()

    supported_domains = (
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
    )

    return any(
        domain in url
        for domain in supported_domains
    )


# ============================================================
# MAIN FUNCTION
# ============================================================

def download_youtube_audio(url: str):
    """
    Download audio from a YouTube URL and convert it to MP3.

    Parameters
    ----------
    url : str
        YouTube video URL.

    Returns
    -------
    tuple[str, bytes]
        Example:
            ("abc123.mp3", b"...audio bytes...")

    Raises
    ------
    RuntimeError
        If downloading or conversion fails.
    """

    # ========================================================
    # STEP 1 — VALIDATE URL
    # ========================================================

    if not url or not url.strip():

        raise RuntimeError(
            "YouTube URL cannot be empty."
        )

    url = url.strip()

    if not is_youtube_url(url):

        raise RuntimeError(
            "Please provide a valid YouTube URL."
        )

    logger.info(
        "Processing YouTube URL: %s",
        url,
    )

    # ========================================================
    # STEP 2 — CREATE TEMP DIRECTORY
    # ========================================================

    temp_dir = tempfile.mkdtemp(
        prefix="youtube_audio_"
    )

    logger.info(
        "Temporary YouTube directory: %s",
        temp_dir,
    )

    # ========================================================
    # STEP 3 — OUTPUT TEMPLATE
    # ========================================================

    output_template = os.path.join(
        temp_dir,
        "%(id)s.%(ext)s",
    )

    # ========================================================
    # STEP 4 — BUILD YT-DLP OPTIONS
    # ========================================================

    ydl_opts = {

        # ----------------------------------------------------
        # FORMAT
        # ----------------------------------------------------
        #
        # Prefer M4A.
        # If unavailable, use WebM.
        # Otherwise use best available audio.
        #
        "format": (
            "bestaudio[ext=m4a]/"
            "bestaudio[ext=webm]/"
            "bestaudio/best"
        ),

        # ----------------------------------------------------
        # OUTPUT
        # ----------------------------------------------------

        "outtmpl": output_template,

        "noplaylist": True,

        # ----------------------------------------------------
        # JAVASCRIPT RUNTIME
        # ----------------------------------------------------

        # Modern YouTube extraction can require a JS runtime.
        #
        "js_runtimes": (
            {
                "node": {
                    "path": NODE_PATH
                }
            }
            if NODE_PATH
            else {}
        ),

        # ----------------------------------------------------
        # FFMPEG
        # ----------------------------------------------------

        **(
            {
                "ffmpeg_location": FFMPEG_DIR
            }
            if FFMPEG_DIR
            else {}
        ),

        # ----------------------------------------------------
        # NETWORK
        # ----------------------------------------------------

        "socket_timeout": 120,

        "retries": 10,

        "fragment_retries": 10,

        "extractor_retries": 5,

        # ----------------------------------------------------
        # IPV4
        # ----------------------------------------------------

        "force_ipv4": True,

        # ----------------------------------------------------
        # GEO
        # ----------------------------------------------------

        "geo_bypass": True,

        # ----------------------------------------------------
        # HTTP HEADERS
        # ----------------------------------------------------

        "http_headers": {

            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/151.0.0.0 "
                "Safari/537.36"
            ),

            "Accept-Language": (
                "en-US,en;q=0.9"
            ),
        },

        # ----------------------------------------------------
        # AUDIO EXTRACTION
        # ----------------------------------------------------

        "postprocessors": [

            {
                "key": "FFmpegExtractAudio",

                "preferredcodec": "mp3",

                "preferredquality": "192",
            }

        ],

        # ----------------------------------------------------
        # LOGGING
        # ----------------------------------------------------

        "quiet": False,

        "no_warnings": False,

        "verbose": False,
    }

    # ========================================================
    # STEP 5 — DOWNLOAD
    # ========================================================

    try:

        logger.info(
            "Starting yt-dlp YouTube extraction..."
        )

        with yt_dlp.YoutubeDL(
            ydl_opts
        ) as ydl:

            info = ydl.extract_info(
                url,
                download=True,
            )

        if not info:

            raise RuntimeError(
                "yt-dlp returned no video information."
            )

        # ====================================================
        # VIDEO ID
        # ====================================================

        video_id = info.get(
            "id"
        )

        if not video_id:

            raise RuntimeError(
                "Could not determine YouTube video ID."
            )

        logger.info(
            "YouTube video ID: %s",
            video_id,
        )

        # ====================================================
        # TITLE
        # ====================================================

        title = info.get(
            "title",
            video_id,
        )

        logger.info(
            "YouTube video title: %s",
            title,
        )

        # ====================================================
        # STEP 6 — FIND MP3
        # ====================================================

        audio_path = None

        expected_mp3 = os.path.join(
            temp_dir,
            f"{video_id}.mp3",
        )

        if os.path.isfile(
            expected_mp3
        ):

            audio_path = expected_mp3

        else:

            logger.info(
                "Expected MP3 not found. "
                "Searching temporary directory..."
            )

            for file_name in os.listdir(
                temp_dir
            ):

                file_path = os.path.join(
                    temp_dir,
                    file_name,
                )

                if not os.path.isfile(
                    file_path
                ):
                    continue

                if file_name.lower().endswith(
                    ".mp3"
                ):

                    audio_path = file_path

                    break

        # ====================================================
        # STEP 7 — MP3 NOT FOUND
        # ====================================================

        if audio_path is None:

            files_found = []

            try:

                files_found = os.listdir(
                    temp_dir
                )

            except Exception:
                pass

            logger.error(
                "MP3 file was not found."
            )

            logger.error(
                "Temporary directory contents: %s",
                files_found,
            )

            raise RuntimeError(
                "YouTube audio was downloaded, "
                "but FFmpeg did not produce an MP3 file."
            )

        logger.info(
            "MP3 file found: %s",
            audio_path,
        )

        # ====================================================
        # STEP 8 — READ MP3
        # ====================================================

        with open(
            audio_path,
            "rb",
        ) as audio_file:

            audio_bytes = audio_file.read()

        # ====================================================
        # STEP 9 — VALIDATE AUDIO
        # ====================================================

        if not audio_bytes:

            raise RuntimeError(
                "Downloaded YouTube audio file is empty."
            )

        logger.info(
            "Downloaded MP3 size: %d bytes",
            len(audio_bytes),
        )

        # ====================================================
        # STEP 10 — CREATE FILENAME
        # ====================================================

        filename = (
            f"{video_id}.mp3"
        )

        # ====================================================
        # STEP 11 — SUCCESS
        # ====================================================

        logger.info(
            "YouTube audio download successful."
        )

        logger.info(
            "Filename: %s",
            filename,
        )

        logger.info(
            "Audio bytes: %d",
            len(audio_bytes),
        )

        return (
            filename,
            audio_bytes,
        )

    # ========================================================
    # STEP 12 — YT-DLP DOWNLOAD ERROR
    # ========================================================

    except yt_dlp.utils.DownloadError as exc:

        logger.exception(
            "yt-dlp download failed: %s",
            exc,
        )

        error_message = str(
            exc
        )

        error_lower = (
            error_message.lower()
        )

        # ----------------------------------------------------
        # 403
        # ----------------------------------------------------

        if (
            "403" in error_lower
            or "forbidden" in error_lower
        ):

            message = (
                "YouTube rejected the media request "
                "(HTTP 403). "
                "This is usually caused by YouTube "
                "changing its media delivery rules or "
                "the installed yt-dlp version being outdated. "
                "Update yt-dlp with "
                "'python -m pip install -U yt-dlp' "
                "and restart the backend."
            )

        # ----------------------------------------------------
        # SIGN IN
        # ----------------------------------------------------

        elif (
            "sign in" in error_lower
            or "authentication" in error_lower
            or "login required" in error_lower
        ):

            message = (
                "YouTube requires authentication for this "
                "video. The video may be private, "
                "age-restricted, or otherwise protected."
            )

        # ----------------------------------------------------
        # PRIVATE
        # ----------------------------------------------------

        elif (
            "private video" in error_lower
        ):

            message = (
                "This YouTube video is private "
                "and cannot be downloaded."
            )

        # ----------------------------------------------------
        # UNAVAILABLE
        # ----------------------------------------------------

        elif (
            "video unavailable"
            in error_lower
            or "is unavailable"
            in error_lower
        ):

            message = (
                "This YouTube video is unavailable "
                "and cannot be downloaded."
            )

        # ----------------------------------------------------
        # TIMEOUT
        # ----------------------------------------------------

        elif (
            "timed out"
            in error_lower
            or "timeout"
            in error_lower
            or "winerror 10060"
            in error_lower
        ):

            message = (
                "YouTube audio download timed out. "
                "Please check your internet connection "
                "and try again."
            )

        # ----------------------------------------------------
        # GENERIC
        # ----------------------------------------------------

        else:

            message = (
                "YouTube audio download failed: "
                f"{error_message}"
            )

        raise RuntimeError(
            message
        ) from exc

    # ========================================================
    # STEP 13 — OUR RUNTIME ERROR
    # ========================================================

    except RuntimeError:

        raise

    # ========================================================
    # STEP 14 — UNEXPECTED ERROR
    # ========================================================

    except Exception as exc:

        logger.exception(
            "Unexpected YouTube processing error: %s",
            exc,
        )

        raise RuntimeError(
            "Failed to download YouTube audio: "
            f"{exc}"
        ) from exc

    # ========================================================
    # STEP 15 — CLEANUP
    # ========================================================

    finally:

        try:

            if os.path.exists(
                temp_dir
            ):

                shutil.rmtree(
                    temp_dir,
                    ignore_errors=True,
                )

                logger.info(
                    "Removed temporary YouTube directory: %s",
                    temp_dir,
                )

        except Exception as cleanup_error:

            logger.warning(
                "Could not completely remove "
                "temporary directory %s: %s",
                temp_dir,
                cleanup_error,
            )