"""
preprocessing/file_validator.py

Validation and actual file-type detection for lecture documents.

Supported:
    PDF
    PPT
    PPTX
    DOCX
"""

from pathlib import Path

SUPPORTED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".docx"}

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


class FileValidationError(Exception):
    """Raised when a lecture file fails validation."""
    pass


def validate_file(file_path: str | Path) -> Path:
    """
    Validate a lecture file.

    Checks:
        - file exists
        - path is a file
        - supported extension
        - non-empty
        - maximum size
    """

    path = Path(file_path)

    if not path.exists():
        raise FileValidationError(f"File not found: {path}")

    if not path.is_file():
        raise FileValidationError(f"Provided path is not a file: {path}")

    extension = path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise FileValidationError(
            f"Unsupported file format '{extension}'. "
            f"Supported formats: {supported}"
        )

    file_size = path.stat().st_size

    if file_size == 0:
        raise FileValidationError("The uploaded file is empty.")

    if file_size > MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        raise FileValidationError(
            f"File is too large ({size_mb:.2f} MB). "
            f"Maximum allowed size is 20 MB."
        )

    return path


def detect_file_type(file_path: str | Path) -> str:
    """
    Detect the actual document type.

    Uses file signatures / container inspection rather than
    trusting only the filename extension.
    """

    path = Path(file_path)
    extension = path.suffix.lower()

    # ---------------------------------------------------------
    # PDF
    # ---------------------------------------------------------
    if extension == ".pdf":
        try:
            with open(path, "rb") as f:
                header = f.read(5)

            if header != b"%PDF-":
                raise FileValidationError(
                    "File has a .pdf extension but is not a valid PDF."
                )

            return "pdf"

        except FileValidationError:
            raise
        except Exception as exc:
            raise FileValidationError(
                f"Unable to inspect PDF file: {exc}"
            ) from exc

    # ---------------------------------------------------------
    # DOCX / PPTX
    # Both are ZIP-based Office Open XML containers.
    # We inspect their internal structure.
    # ---------------------------------------------------------
    if extension in {".docx", ".pptx"}:
        try:
            import zipfile

            if not zipfile.is_zipfile(path):
                raise FileValidationError(
                    f"File has a {extension} extension but is not "
                    "a valid Office document."
                )

            with zipfile.ZipFile(path, "r") as archive:
                names = set(archive.namelist())

                if "word/document.xml" in names:
                    actual_type = "docx"

                elif "ppt/presentation.xml" in names:
                    actual_type = "pptx"

                else:
                    raise FileValidationError(
                        "Unable to determine the actual document type. "
                        "The file may be corrupted or unsupported."
                    )

            if extension == ".docx" and actual_type != "docx":
                raise FileValidationError(
                    "File extension does not match its actual content."
                )

            if extension == ".pptx" and actual_type != "pptx":
                raise FileValidationError(
                    "File extension does not match its actual content."
                )

            return actual_type

        except FileValidationError:
            raise
        except Exception as exc:
            raise FileValidationError(
                f"Unable to inspect Office document: {exc}"
            ) from exc

    # ---------------------------------------------------------
    # Legacy PPT
    # Old .ppt is an OLE binary format.
    # ---------------------------------------------------------
    if extension == ".ppt":
        try:
            with open(path, "rb") as f:
                header = f.read(8)

            # Compound File Binary Format signature
            if header == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
                return "ppt"

            raise FileValidationError(
                "File has a .ppt extension but is not a valid legacy PPT file."
            )

        except FileValidationError:
            raise
        except Exception as exc:
            raise FileValidationError(
                f"Unable to inspect PPT file: {exc}"
            ) from exc

    raise FileValidationError(
        f"Unsupported file format: {extension}"
    )