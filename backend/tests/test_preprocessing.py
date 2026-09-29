"""
Automated tests for Member 1 document preprocessing.

Tests:
- PDF
- PPTX
- DOCX
- Legacy PPT
- Empty files
- Unsupported formats
- Image-only documents
- Corrupted documents
- Standard output structure
- Text cleaning
"""

from pathlib import Path

import fitz
from docx import Document
from pptx import Presentation

from preprocessing.main import process_lecture_file
from preprocessing.text_cleaner import clean_text


# ---------------------------------------------------------
# Test data directory
# ---------------------------------------------------------

TEST_DATA = Path(__file__).parent / "test_data"


def create_test_data():
    """Create temporary test documents used by the tests."""

    TEST_DATA.mkdir(exist_ok=True)

    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    pdf_path = TEST_DATA / "test.pdf"

    if not pdf_path.exists():
        doc = fitz.open()

        page1 = doc.new_page()
        page1.insert_text(
            (50, 50),
            "Introduction to Recursion\n"
            "A function that calls itself."
        )

        page2 = doc.new_page()
        page2.insert_text(
            (50, 50),
            "Base Case\n"
            "Every recursive function needs a base case."
        )

        doc.save(pdf_path)
        doc.close()

    # -----------------------------------------------------
    # PPTX
    # -----------------------------------------------------

    pptx_path = TEST_DATA / "test.pptx"

    if not pptx_path.exists():
        presentation = Presentation()

        slide_layout = presentation.slide_layouts[1]

        slide1 = presentation.slides.add_slide(slide_layout)
        slide1.shapes.title.text = "Introduction to Recursion"
        slide1.placeholders[1].text = (
            "A function that calls itself."
        )

        slide2 = presentation.slides.add_slide(slide_layout)
        slide2.shapes.title.text = "Base Case"
        slide2.placeholders[1].text = (
            "Every recursive function needs a base case."
        )

        presentation.save(pptx_path)

    # -----------------------------------------------------
    # DOCX
    # -----------------------------------------------------

    docx_path = TEST_DATA / "test.docx"

    if not docx_path.exists():
        document = Document()

        document.add_heading("Recursion", level=1)

        document.add_paragraph(
            "Recursion is a programming technique "
            "where a function calls itself."
        )

        document.add_heading("Base Case", level=2)

        document.add_paragraph(
            "Every recursive function needs a base case."
        )

        document.add_paragraph(
            "The recursive case moves toward the base case.",
            style="List Bullet",
        )

        document.save(docx_path)

    # -----------------------------------------------------
    # Image-only PDF
    # -----------------------------------------------------

    image_pdf_path = TEST_DATA / "image_only.pdf"

    if not image_pdf_path.exists():

        image_doc = fitz.open()
        image_doc.new_page()

        image_doc.save(image_pdf_path)
        image_doc.close()

    # -----------------------------------------------------
    # Empty PDF
    # -----------------------------------------------------

    empty_path = TEST_DATA / "empty.pdf"

    if not empty_path.exists():
        empty_path.touch()

    # -----------------------------------------------------
    # Unsupported file
    # -----------------------------------------------------

    txt_path = TEST_DATA / "unsupported.txt"

    if not txt_path.exists():
        txt_path.write_text(
            "This format is not supported.",
            encoding="utf-8",
        )

    # -----------------------------------------------------
    # Corrupted PDF
    # -----------------------------------------------------

    corrupted_pdf = TEST_DATA / "corrupted.pdf"

    if not corrupted_pdf.exists():
        corrupted_pdf.write_text(
            "This is not a real PDF.",
            encoding="utf-8",
        )

    # -----------------------------------------------------
    # Corrupted PPTX
    # -----------------------------------------------------

    corrupted_pptx = TEST_DATA / "corrupted.pptx"

    if not corrupted_pptx.exists():
        corrupted_pptx.write_text(
            "This is not a real PowerPoint.",
            encoding="utf-8",
        )

    # -----------------------------------------------------
    # Corrupted DOCX
    # -----------------------------------------------------

    corrupted_docx = TEST_DATA / "corrupted.docx"

    if not corrupted_docx.exists():
        corrupted_docx.write_text(
            "This is not a real Word document.",
            encoding="utf-8",
        )

    # -----------------------------------------------------
    # Legacy PPT
    # -----------------------------------------------------

    legacy_ppt = TEST_DATA / "legacy.ppt"

    if not legacy_ppt.exists():
        legacy_ppt.write_text(
            "Legacy PPT test file.",
            encoding="utf-8",
        )


# ---------------------------------------------------------
# Pytest setup
# ---------------------------------------------------------


def setup_module():
    """Create all required test files before running tests."""

    create_test_data()


# ---------------------------------------------------------
# Tests
# ---------------------------------------------------------


def test_pdf_processing():

    result = process_lecture_file(
        TEST_DATA / "test.pdf"
    )

    assert result["status"] == "success"
    assert result["file_type"] == "pdf"
    assert result["pages_or_slides"] == 2
    assert result["character_count"] > 0
    assert "[Page 1]" in result["clean_text"]
    assert "[Page 2]" in result["clean_text"]


def test_pptx_processing():

    result = process_lecture_file(
        TEST_DATA / "test.pptx"
    )

    assert result["status"] == "success"
    assert result["file_type"] == "pptx"
    assert result["pages_or_slides"] == 2
    assert result["character_count"] > 0
    assert "[Slide 1]" in result["clean_text"]
    assert "[Slide 2]" in result["clean_text"]


def test_docx_processing():

    result = process_lecture_file(
        TEST_DATA / "test.docx"
    )

    assert result["status"] == "success"
    assert result["file_type"] == "docx"
    assert result["pages_or_slides"] > 0
    assert result["character_count"] > 0

    assert "[Heading]" in result["clean_text"]
    assert "[Paragraph]" in result["clean_text"]
    assert "[Bullet]" in result["clean_text"]


def test_image_only_pdf():

    result = process_lecture_file(
        TEST_DATA / "image_only.pdf"
    )

    assert result["status"] == "warning"
    assert result["file_type"] == "pdf"
    assert result["character_count"] == 0
    assert result["clean_text"] == ""

    assert "No extractable text" in result["message"]


def test_empty_file():

    result = process_lecture_file(
        TEST_DATA / "empty.pdf"
    )

    assert result["status"] == "error"
    assert result["character_count"] == 0
    assert "empty" in result["message"].lower()


def test_unsupported_format():

    result = process_lecture_file(
        TEST_DATA / "unsupported.txt"
    )

    assert result["status"] == "error"
    assert result["file_type"] == "txt"
    assert "Unsupported file format" in result["message"]


def test_corrupted_pdf():

    result = process_lecture_file(
        TEST_DATA / "corrupted.pdf"
    )

    assert result["status"] == "error"
    assert result["file_type"] == "pdf"
    assert result["character_count"] == 0


def test_corrupted_pptx():

    result = process_lecture_file(
        TEST_DATA / "corrupted.pptx"
    )

    assert result["status"] == "error"
    assert result["file_type"] == "pptx"
    assert result["character_count"] == 0


def test_corrupted_docx():

    result = process_lecture_file(
        TEST_DATA / "corrupted.docx"
    )

    assert result["status"] == "error"
    assert result["file_type"] == "docx"
    assert result["character_count"] == 0


def test_legacy_ppt():

    result = process_lecture_file(
        TEST_DATA / "legacy.ppt"
    )

    assert result["status"] == "warning"
    assert result["file_type"] == "ppt"
    assert result["character_count"] == 0
    assert "conversion" in result["message"].lower()


def test_text_cleaning():

    raw_text = """
        What   is   Recursion?


        A function   that calls itself.

        • Base Case
        • Recursive Case
    """

    cleaned = clean_text(raw_text)

    assert "What is Recursion?" in cleaned
    assert "A function that calls itself." in cleaned
    assert "• Base Case" in cleaned
    assert "• Recursive Case" in cleaned


def test_standard_output_structure():

    result = process_lecture_file(
        TEST_DATA / "test.pdf"
    )

    required_fields = {
        "file_name",
        "file_type",
        "status",
        "pages_or_slides",
        "clean_text",
        "character_count",
    }

    assert required_fields.issubset(result.keys())


def test_real_lecture_pdf():

    real_pdf = Path(
        "uploads/462d61c9fc9846a898c598c87ba6e702.pdf"
    )

    if not real_pdf.exists():
        return

    result = process_lecture_file(real_pdf)

    assert result["status"] == "success"
    assert result["file_type"] == "pdf"
    assert result["pages_or_slides"] == 193
    assert result["character_count"] > 0
    assert "[Page 1]" in result["clean_text"]
    assert "[Page 193]" in result["clean_text"]