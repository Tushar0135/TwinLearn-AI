"""
preprocessing/text_cleaner.py

Cleans extracted lecture text while preserving:
    - headings
    - bullets
    - punctuation
    - technical terms
    - programming syntax
    - mathematical symbols

The cleaner removes extraction artifacts such as:
    - excessive spaces
    - excessive blank lines
    - literal escaped newlines
    - page/slide markers
    - control characters
    - zero-width characters
    - repeated headers/footers
"""

import re
from collections import Counter


# ==============================================================
# CLEAN ONE LINE
# ==============================================================

def clean_line(line: str) -> str:
    """
    Clean one line without destroying meaningful content.
    """

    if not line:
        return ""

    # Non-breaking space
    line = line.replace("\u00a0", " ")

    # Zero-width characters
    line = line.replace("\u200b", "")
    line = line.replace("\ufeff", "")
    line = line.replace("\u200c", "")
    line = line.replace("\u200d", "")

    # Remove unwanted control characters
    line = re.sub(
        r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]",
        "",
        line,
    )

    # Remove leading/trailing whitespace
    line = line.strip()

    # Collapse spaces/tabs
    line = re.sub(
        r"[ \t]+",
        " ",
        line,
    )

    return line


# ==============================================================
# MAIN TEXT CLEANER
# ==============================================================

def clean_text(text: str) -> str:
    """
    Clean extracted lecture text.

    Important:
        This function does NOT perform NLP operations such as
        stopword removal, stemming, or lemmatization.

    It only removes extraction/formatting noise.
    """

    if not text:
        return ""

    text = str(text)

    # ==========================================================
    # 1. REMOVE CONTROL CHARACTERS
    # ==========================================================

    text = re.sub(
        r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]",
        "",
        text,
    )

    # ==========================================================
    # 2. CONVERT LITERAL ESCAPED NEWLINES
    #
    # Example:
    #
    # "Hello\\nWorld"
    #
    # becomes:
    #
    # "Hello
    # World"
    # ==========================================================

    text = text.replace(
        "\\r\\n",
        "\n",
    )

    text = text.replace(
        "\\n",
        "\n",
    )

    text = text.replace(
        "\\r",
        "\n",
    )

    # ==========================================================
    # 3. NORMALIZE ACTUAL LINE ENDINGS
    # ==========================================================

    text = text.replace(
        "\r\n",
        "\n",
    )

    text = text.replace(
        "\r",
        "\n",
    )

    # ==========================================================
    # 4. REMOVE PAGE / SLIDE MARKERS
    #
    # [Page 1]
    # [Page 2]
    # [Slide 1]
    # ==========================================================

    text = re.sub(
        r"\[(?:Page|Slide)\s+\d+\]",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # ==========================================================
    # 5. REMOVE OTHER EXTRACTION MARKERS
    #
    # [Heading]
    # [Bullet]
    # [Paragraph]
    # ==========================================================

    text = re.sub(
        r"\[(?:Heading|Bullet|Paragraph)\]",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # ==========================================================
    # 6. PROCESS LINE BY LINE
    # ==========================================================

    lines = text.split("\n")

    cleaned_lines = []

    for line in lines:

        cleaned = clean_line(line)

        cleaned_lines.append(
            cleaned
        )

    # ==========================================================
    # 7. REMOVE EXCESSIVE BLANK LINES
    #
    # Maximum:
    #
    # text
    #
    # text
    #
    # Never 4-5 empty lines.
    # ==========================================================

    final_lines = []

    previous_blank = False

    for line in cleaned_lines:

        if line == "":

            if previous_blank:
                continue

            previous_blank = True
            final_lines.append("")

        else:

            previous_blank = False
            final_lines.append(line)

    # ==========================================================
    # 8. REMOVE BLANK LINES FROM START
    # ==========================================================

    while (
        final_lines
        and final_lines[0] == ""
    ):
        final_lines.pop(0)

    # ==========================================================
    # 9. REMOVE BLANK LINES FROM END
    # ==========================================================

    while (
        final_lines
        and final_lines[-1] == ""
    ):
        final_lines.pop()

    # ==========================================================
    # 10. FINAL TEXT
    # ==========================================================

    return "\n".join(
        final_lines
    ).strip()


# ==============================================================
# REMOVE REPEATED HEADERS / FOOTERS
# ==============================================================

def remove_repeated_lines(
    text: str,
    minimum_repetitions: int = 3,
) -> str:
    """
    Remove obvious repeated headers/footers.

    A line is removed only when:
        - it appears multiple times
        - it is relatively short
        - it is not a bullet
        - it is not meaningful structural content
    """

    if not text:
        return ""

    lines = text.split("\n")

    values = []

    for line in lines:

        value = line.strip()

        if not value:
            continue

        # Do not count bullets as repeated headers
        if value.startswith(
            ("•", "-", "*")
        ):
            continue

        values.append(value)

    counts = Counter(values)

    repeated = {
        line
        for line, count in counts.items()
        if (
            count >= minimum_repetitions
            and len(line) <= 150
        )
    }

    cleaned_lines = []

    for line in lines:

        stripped = line.strip()

        if stripped in repeated:
            continue

        cleaned_lines.append(line)

    return "\n".join(
        cleaned_lines
    )


# ==============================================================
# CHARACTER COUNT
# ==============================================================

def count_characters(
    text: str,
) -> int:
    """
    Return the number of characters
    in cleaned text.
    """

    if not text:
        return 0

    return len(text)