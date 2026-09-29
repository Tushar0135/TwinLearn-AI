"""
services/extraction_service.py

Contains all logic for extracting raw text out of the three supported
file formats:
    - PDF  -> PyMuPDF (imported as `fitz`)
    - DOCX -> python-docx
    - PPTX -> python-pptx

Each extractor returns a tuple: (merged_text: str, page_count: int | None)

All extractors raise `ExtractionError` on failure (e.g. corrupted /
password-protected / malformed files) so the calling service can mark
the lecture's processing_status as "Failed" with a clear message.
"""

from typing import Tuple, Optional

import pymupdf  # PyMuPDF
from docx import Document
from pptx import Presentation

from utils.logger import get_logger

logger = get_logger(__name__)


class ExtractionError(Exception):
    """Raised when text cannot be extracted from a file (e.g. it is corrupted)."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def extract_pdf_text(file_path: str) -> Tuple[str, Optional[int]]:
    """
    Extracts text from every page of a PDF using PyMuPDF and merges
    it into a single string, with pages separated by a clear marker.

    Returns:
        (merged_text, page_count)

    Raises:
        ExtractionError: if the PDF cannot be opened/parsed (corrupted
        or encrypted file, invalid PDF structure, etc.)
    """
    try:
        doc = pymupdf.open(file_path)
    except Exception as exc:
        logger.error("Failed to open PDF '%s': %s", file_path, exc)
        raise ExtractionError(f"Could not open PDF file — it may be corrupted: {exc}")

    try:
        if doc.is_encrypted:
            raise ExtractionError("The PDF is password-protected and cannot be read.")

        page_texts = []
        for page_number in range(len(doc)):
            page = doc.load_page(page_number)
            page_texts.append(page.get_text("text").strip())

        page_count = len(doc)
        merged_text = "\n\n".join(
            f"--- Page {i + 1} ---\n{text}" for i, text in enumerate(page_texts)
        ).strip()

        if not merged_text:
            logger.warning("PDF '%s' produced no extractable text.", file_path)

        return merged_text, page_count
    except ExtractionError:
        raise
    except Exception as exc:
        logger.error("Error reading PDF pages '%s': %s", file_path, exc)
        raise ExtractionError(f"Error while reading PDF content: {exc}")
    finally:
        doc.close()


def extract_docx_text(file_path: str) -> Tuple[str, Optional[int]]:
    """
    Extracts text from a DOCX file's paragraphs (and table cells) using
    python-docx, merging everything into a single string.

    Note: DOCX files do not store a fixed "page count" the way PDFs do
    (pagination depends on the rendering engine/printer), so page_count
    is returned as None.

    Returns:
        (merged_text, page_count=None)

    Raises:
        ExtractionError: if the DOCX cannot be opened/parsed.
    """
    try:
        document = Document(file_path)
    except Exception as exc:
        logger.error("Failed to open DOCX '%s': %s", file_path, exc)
        raise ExtractionError(f"Could not open DOCX file — it may be corrupted: {exc}")

    try:
        parts = []

        # Regular paragraphs
        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                parts.append(paragraph.text.strip())

        # Text inside tables (often used for structured lecture notes)
        for table in document.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells)
                if row_text.strip(" |"):
                    parts.append(row_text)

        merged_text = "\n".join(parts).strip()

        if not merged_text:
            logger.warning("DOCX '%s' produced no extractable text.", file_path)

        return merged_text, None
    except Exception as exc:
        logger.error("Error reading DOCX content '%s': %s", file_path, exc)
        raise ExtractionError(f"Error while reading DOCX content: {exc}")


def extract_pptx_text(file_path: str) -> Tuple[str, Optional[int]]:
    """
    Extracts text from every slide of a PPTX file using python-pptx,
    merging it into a single string with slide markers.

    Returns:
        (merged_text, slide_count)

    Raises:
        ExtractionError: if the PPTX cannot be opened/parsed.
    """
    try:
        presentation = Presentation(file_path)
    except Exception as exc:
        logger.error("Failed to open PPTX '%s': %s", file_path, exc)
        raise ExtractionError(f"Could not open PPTX file — it may be corrupted: {exc}")

    try:
        slide_texts = []
        for slide in presentation.slides:
            texts_on_slide = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = "".join(run.text for run in paragraph.runs).strip()
                        if text:
                            texts_on_slide.append(text)
                # Extract text from tables on the slide, if present
                if shape.has_table:
                    for row in shape.table.rows:
                        row_text = " | ".join(cell.text.strip() for cell in row.cells)
                        if row_text.strip(" |"):
                            texts_on_slide.append(row_text)
            slide_texts.append("\n".join(texts_on_slide))

        slide_count = len(presentation.slides)

        merged_text = "\n\n".join(
            f"--- Slide {i + 1} ---\n{text}" for i, text in enumerate(slide_texts)
        ).strip()

        if not merged_text:
            logger.warning("PPTX '%s' produced no extractable text.", file_path)

        return merged_text, slide_count
    except Exception as exc:
        logger.error("Error reading PPTX content '%s': %s", file_path, exc)
        raise ExtractionError(f"Error while reading PPTX content: {exc}")


def extract_text(file_path: str, file_type: str) -> Tuple[str, Optional[int]]:
    """
    Dispatcher function — routes to the correct extractor based on
    `file_type` ("pdf" | "docx" | "pptx").

    Returns:
        (merged_text, page_count)

    Raises:
        ExtractionError: propagated from the underlying extractor, or
        raised directly if `file_type` is unrecognized.
    """
    if file_type == "pdf":
        return extract_pdf_text(file_path)
    elif file_type == "docx":
        return extract_docx_text(file_path)
    elif file_type == "pptx":
        return extract_pptx_text(file_path)
    else:
        raise ExtractionError(f"No extractor available for file type '{file_type}'.")
