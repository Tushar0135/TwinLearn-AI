"""
PDF lecture processor.

Extracts text page-by-page while preserving page structure.
"""

import pymupdf


class PDFProcessingError(Exception):
    """Raised when a PDF cannot be processed."""
    pass


def process_pdf(file_path: str) -> dict:
    """
    Extract text from a PDF while preserving page boundaries.

    Returns:
        {
            "pages_or_slides": int,
            "text": str
        }
    """

    try:
        document = pymupdf.open(file_path)
    except Exception as exc:
        raise PDFProcessingError(
            f"Unable to open PDF: {exc}"
        ) from exc

    if document.page_count == 0:
        document.close()
        raise PDFProcessingError("PDF contains no pages.")

    pages = []

    try:
        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text")

            pages.append(
                f"[Page {page_number}]\n{text}"
            )

    except Exception as exc:
        raise PDFProcessingError(
            f"Failed while extracting PDF text: {exc}"
        ) from exc

    finally:
        document.close()

    return {
        "pages_or_slides": len(pages),
        "text": "\n\n".join(pages)
    }