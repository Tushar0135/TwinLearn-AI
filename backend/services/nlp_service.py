import json
import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas.nlp_schema import LectureMetadata
from utils.logger import get_logger


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

logger = get_logger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ============================================================
# MODEL
# ============================================================

# The model can be configured from backend/.env
#
# Example:
#
# GEMINI_MODEL=gemini-3.5-flash
#
# If GEMINI_MODEL is not present, this value is used.

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash"
)


# ============================================================
# PROMPT
# ============================================================

PROMPT_TEMPLATE = """
You are an expert educational content analyzer.

Analyze the following lecture text and extract educational metadata.

Extract:

1. Topic
2. Subtopics
3. Keywords
4. Difficulty
5. Learning Objectives
6. Prerequisites
7. Summary

Rules:

- Return ONLY valid JSON.
- Do NOT explain anything.
- Do NOT use markdown.
- Do NOT wrap the response in ```json.
- Every field must exist.
- If information is missing, return an empty list or empty string.
- Difficulty must be exactly one of:
  Easy
  Medium
  Hard

Return the following structure:

{{
  "topic": "",
  "subtopics": [],
  "keywords": [],
  "difficulty": "",
  "learning_objectives": [],
  "prerequisites": [],
  "summary": ""
}}

Lecture:

{lecture_text}
"""


# ============================================================
# GEMINI RESPONSE SCHEMA
# ============================================================

METADATA_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {

        "topic": {
            "type": "STRING"
        },

        "subtopics": {
            "type": "ARRAY",
            "items": {
                "type": "STRING"
            }
        },

        "keywords": {
            "type": "ARRAY",
            "items": {
                "type": "STRING"
            }
        },

        "difficulty": {
            "type": "STRING"
        },

        "learning_objectives": {
            "type": "ARRAY",
            "items": {
                "type": "STRING"
            }
        },

        "prerequisites": {
            "type": "ARRAY",
            "items": {
                "type": "STRING"
            }
        },

        "summary": {
            "type": "STRING"
        },
    },

    "required": [
        "topic",
        "subtopics",
        "keywords",
        "difficulty",
        "learning_objectives",
        "prerequisites",
        "summary",
    ],
}


# ============================================================
# EXTRACT METADATA
# ============================================================

def extract_metadata(
    lecture_text: str
) -> LectureMetadata:

    # ========================================================
    # STEP 1 — VALIDATE LECTURE TEXT
    # ========================================================

    if not lecture_text or not lecture_text.strip():

        raise ValueError(
            "Lecture text cannot be empty."
        )

    lecture_text = lecture_text.strip()

    logger.info(
        "Starting NLP metadata extraction. "
        "Lecture text length=%s",
        len(lecture_text)
    )


    # ========================================================
    # STEP 2 — VALIDATE API KEY
    # ========================================================

    if not GEMINI_API_KEY:

        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Please add GEMINI_API_KEY to backend/.env."
        )


    # ========================================================
    # STEP 3 — LOG MODEL
    # ========================================================

    logger.info(
        "Using Gemini model: %s",
        GEMINI_MODEL
    )

    print(
        f"[NLP] Using Gemini model: {GEMINI_MODEL}"
    )


    # ========================================================
    # STEP 4 — CREATE GEMINI CLIENT
    # ========================================================

    try:

        client = genai.Client(
            api_key=GEMINI_API_KEY
        )

    except Exception as exc:

        logger.exception(
            "Failed to create Gemini client."
        )

        raise RuntimeError(
            f"Failed to initialize Gemini client: {exc}"
        ) from exc


    # ========================================================
    # STEP 5 — PREPARE PROMPT
    # ========================================================

    try:

        prompt = PROMPT_TEMPLATE.format(
            lecture_text=lecture_text
        )

    except Exception as exc:

        logger.exception(
            "Failed to prepare Gemini prompt."
        )

        raise RuntimeError(
            f"Failed to prepare Gemini prompt: {exc}"
        ) from exc


    # ========================================================
    # STEP 6 — RETRY CONFIGURATION
    # ========================================================

    max_attempts = 3

    response = None


    # ========================================================
    # STEP 7 — CALL GEMINI
    # ========================================================

    for attempt in range(
        1,
        max_attempts + 1
    ):

        try:

            logger.info(
                "Calling Gemini for NLP metadata "
                "using model=%s "
                "(attempt %s/%s)",
                GEMINI_MODEL,
                attempt,
                max_attempts
            )

            print(
                f"[NLP] Calling Gemini "
                f"(attempt {attempt}/{max_attempts})"
            )


            response = client.models.generate_content(

                model=GEMINI_MODEL,

                contents=prompt,

                config=types.GenerateContentConfig(

                    temperature=0.2,

                    response_mime_type=(
                        "application/json"
                    ),

                    response_schema=(
                        METADATA_RESPONSE_SCHEMA
                    ),
                )
            )


            # =================================================
            # VALIDATE RESPONSE
            # =================================================

            if response is None:

                raise RuntimeError(
                    "Gemini returned no response."
                )


            if not response.text:

                raise RuntimeError(
                    "Gemini returned an empty response."
                )


            logger.info(
                "Gemini response received successfully."
            )


            print(
                "[NLP] Gemini response received."
            )


            break


        except Exception as exc:

            error_text = str(exc)

            logger.error(
                "Gemini request failed "
                "(attempt %s/%s): %s",
                attempt,
                max_attempts,
                error_text,
                exc_info=True
            )


            # =================================================
            # DO NOT RETRY QUOTA ERRORS
            # =================================================

            is_quota_error = (
                "429" in error_text
                or "RESOURCE_EXHAUSTED"
                in error_text.upper()
            )


            if is_quota_error:

                logger.error(
                    "Gemini quota exhausted. "
                    "Not retrying automatically."
                )

                raise RuntimeError(
                    "Gemini API quota exhausted. "
                    "Please check your Gemini API quota "
                    "or billing/plan limits."
                ) from exc


            # =================================================
            # TEMPORARY SERVER ERRORS
            # =================================================

            retryable = (
                "500" in error_text
                or "502" in error_text
                or "503" in error_text
                or "504" in error_text
                or "INTERNAL"
                in error_text.upper()
                or "UNAVAILABLE"
                in error_text.upper()
            )


            if (
                retryable
                and attempt < max_attempts
            ):

                wait_time = 2 ** (
                    attempt - 1
                )

                logger.warning(
                    "Temporary Gemini error. "
                    "Retrying in %s seconds...",
                    wait_time
                )

                time.sleep(
                    wait_time
                )

                continue


            # =================================================
            # PERMANENT ERROR
            # =================================================

            raise RuntimeError(
                "Gemini NLP metadata extraction failed: "
                f"{error_text}"
            ) from exc


    # ========================================================
    # STEP 8 — MAKE SURE RESPONSE EXISTS
    # ========================================================

    if response is None:

        raise RuntimeError(
            "Gemini did not return a response."
        )


    # ========================================================
    # STEP 9 — GET RAW RESPONSE
    # ========================================================

    raw_response = response.text.strip()

    logger.info(
        "Raw Gemini NLP response received."
    )


    # ========================================================
    # STEP 10 — PARSE JSON
    # ========================================================

    try:

        metadata_dict = json.loads(
            raw_response
        )

    except json.JSONDecodeError as exc:

        logger.error(
            "Gemini returned invalid JSON."
        )

        logger.error(
            "RAW GEMINI RESPONSE: %r",
            raw_response
        )

        raise ValueError(
            "Gemini returned invalid JSON."
        ) from exc


    # ========================================================
    # STEP 11 — VALIDATE RESPONSE TYPE
    # ========================================================

    if not isinstance(
        metadata_dict,
        dict
    ):

        logger.error(
            "Gemini response is not a JSON object: %r",
            metadata_dict
        )

        raise ValueError(
            "Gemini response must be a JSON object."
        )


    # ========================================================
    # STEP 12 — REQUIRED FIELDS
    # ========================================================

    required_fields = [

        "topic",

        "subtopics",

        "keywords",

        "difficulty",

        "learning_objectives",

        "prerequisites",

        "summary",

    ]


    for field in required_fields:

        if field not in metadata_dict:

            logger.error(
                "Gemini response missing field: %s",
                field
            )

            logger.error(
                "Metadata received: %s",
                metadata_dict
            )

            raise ValueError(
                "Gemini response missing required "
                f"field: {field}"
            )


    # ========================================================
    # STEP 13 — NORMALIZE TOPIC
    # ========================================================

    metadata_dict["topic"] = str(
        metadata_dict.get("topic")
        or ""
    ).strip()


    # ========================================================
    # STEP 14 — NORMALIZE SUBTOPICS
    # ========================================================

    subtopics = (
        metadata_dict.get("subtopics")
        or []
    )

    if not isinstance(
        subtopics,
        list
    ):

        subtopics = []

    metadata_dict["subtopics"] = [

        str(item).strip()

        for item in subtopics

        if item is not None

    ]


    # ========================================================
    # STEP 15 — NORMALIZE KEYWORDS
    # ========================================================

    keywords = (
        metadata_dict.get("keywords")
        or []
    )

    if not isinstance(
        keywords,
        list
    ):

        keywords = []

    metadata_dict["keywords"] = [

        str(item).strip()

        for item in keywords

        if item is not None

    ]


    # ========================================================
    # STEP 16 — NORMALIZE LEARNING OBJECTIVES
    # ========================================================

    learning_objectives = (
        metadata_dict.get(
            "learning_objectives"
        )
        or []
    )

    if not isinstance(
        learning_objectives,
        list
    ):

        learning_objectives = []

    metadata_dict[
        "learning_objectives"
    ] = [

        str(item).strip()

        for item in learning_objectives

        if item is not None

    ]


    # ========================================================
    # STEP 17 — NORMALIZE PREREQUISITES
    # ========================================================

    prerequisites = (
        metadata_dict.get(
            "prerequisites"
        )
        or []
    )

    if not isinstance(
        prerequisites,
        list
    ):

        prerequisites = []

    metadata_dict[
        "prerequisites"
    ] = [

        str(item).strip()

        for item in prerequisites

        if item is not None

    ]


    # ========================================================
    # STEP 18 — NORMALIZE SUMMARY
    # ========================================================

    metadata_dict["summary"] = str(
        metadata_dict.get("summary")
        or ""
    ).strip()


    # ========================================================
    # STEP 19 — NORMALIZE DIFFICULTY
    # ========================================================

    difficulty = (
        metadata_dict.get("difficulty")
        or "Medium"
    )

    difficulty = str(
        difficulty
    ).strip().capitalize()


    if difficulty not in {
        "Easy",
        "Medium",
        "Hard",
    }:

        logger.warning(
            "Invalid difficulty returned by Gemini: %s. "
            "Using Medium.",
            difficulty
        )

        difficulty = "Medium"


    metadata_dict["difficulty"] = (
        difficulty
    )


    # ========================================================
    # STEP 20 — PYDANTIC VALIDATION
    # ========================================================

    try:

        metadata = LectureMetadata(
            **metadata_dict
        )

    except Exception as exc:

        logger.error(
            "Invalid NLP metadata structure: %s",
            exc
        )

        logger.error(
            "Metadata received: %s",
            metadata_dict
        )

        raise ValueError(
            "Invalid NLP metadata returned by Gemini: "
            f"{exc}"
        ) from exc


    # ========================================================
    # STEP 21 — SUCCESS
    # ========================================================

    logger.info(
        "NLP metadata extracted successfully: "
        "topic=%s, difficulty=%s",
        metadata.topic,
        metadata.difficulty
    )

    print(
        "[NLP] Metadata extraction successful:"
    )

    print(
        f"      Topic: {metadata.topic}"
    )

    print(
        f"      Difficulty: {metadata.difficulty}"
    )


    return metadata