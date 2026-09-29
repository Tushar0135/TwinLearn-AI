"""
utils/logger.py

Centralized logging setup. Every module in the project imports
`get_logger(__name__)` from here instead of calling `print()`.

Benefits over print():
    - Log messages include timestamps, severity level, and module name.
    - Logs are written both to the console AND to a rotating log file
      (logs/app.log), so nothing is lost after the terminal is closed.
    - Severity levels (INFO, WARNING, ERROR) let you filter noise.
"""

import logging
import os
from logging.handlers import RotatingFileHandler

from config import LOG_DIR

LOG_FILE_PATH = os.path.join(LOG_DIR, "app.log")

# A consistent format used by every log line across the whole app.
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def _build_root_logger() -> None:
    """
    Configures the root logger exactly once with:
      1. A console handler (so logs are visible while running `uvicorn`).
      2. A rotating file handler (keeps log files from growing forever —
         rotates after 2 MB, keeps 3 backup files).
    """
    root_logger = logging.getLogger()
    if root_logger.handlers:
        # Already configured (e.g. module imported twice) — skip.
        return

    root_logger.setLevel(logging.INFO)
    formatter = logging.Formatter(LOG_FORMAT)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        LOG_FILE_PATH, maxBytes=2 * 1024 * 1024, backupCount=3
    )
    file_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)


# Configure the root logger as soon as this module is first imported.
_build_root_logger()


def get_logger(name: str) -> logging.Logger:
    """
    Returns a named logger (e.g. `get_logger(__name__)`), so log lines
    show exactly which file/module produced them, e.g.:

        2026-08-07 10:00:00 | INFO | services.file_service | File saved.
    """
    return logging.getLogger(name)
