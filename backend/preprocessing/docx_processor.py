"""
DOCX lecture processor.

Extracts paragraphs from Word documents while preserving
headings, paragraphs, and bullet points.
"""

from pathlib import Path

from docx import Document


class DOCXProcessingError(Exception):
    """Raised when a DOCX file cannot be processed."""
    pass


def get_paragraph_type(paragraph) -> str:
    """
    Determine the meaningful type of a DOCX paragraph.

    Returns:
        'Heading', 'Bullet', or 'Paragraph'
    """

    style_name = paragraph.style.name.lower()

    if style_name.startswith("heading"):
        return "Heading"

    # Common Word bullet/list styles.
    if "list bullet" in style_name or "bullet" in style_name:
        return "Bullet"

    return "Paragraph"


def process_docx(file_path: str | Path) -> dict:
    """
    Extract text from a DOCX file while preserving document structure.

    Returns:
        {
            "pages_or_slides": int,
            "text": str
        }

    Note:
        DOCX files do not reliably expose physical page boundaries
        through python-docx. Therefore, the returned count represents
        the number of meaningful paragraphs/sections rather than pages.
    """

    path = Path(file_path)

    try:
        document = Document(str(path))
    except Exception as exc:
        raise DOCXProcessingError(
            f"Unable to open DOCX file: {exc}"
        ) from exc

    sections = []

    try:
        for paragraph in document.paragraphs:
            text = paragraph.text.strip()

            # Ignore completely empty paragraphs.
            if not text:
                continue

            paragraph_type = get_paragraph_type(paragraph)

            sections.append(
                f"[{paragraph_type}]\n{text}"
            )

    except Exception as exc:
        raise DOCXProcessingError(
            f"Failed while extracting DOCX text: {exc}"
        ) from exc

    if not sections:
        raise DOCXProcessingError(
            "DOCX contains no extractable text."
        )

    return {
        "pages_or_slides": len(sections),
        "text": "\n\n".join(sections)
    }