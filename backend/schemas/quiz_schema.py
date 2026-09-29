from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ============================================================
# TEACHING STRATEGIES
# ============================================================

TeachingStrategy = Literal[
    "Story Based",
    "Diagram Based",
    "Step by Step",
    "Code Based",
    "Example Based",
    "Exam Oriented",
    "Interview Oriented",
    "Simple",
    "Detailed",
]


# ============================================================
# QUIZ QUESTION
# ============================================================

class QuizQuestion(BaseModel):
    """
    A single multiple-choice question.

    The correct answer is intentionally NOT returned
    during quiz generation.
    """

    question_id: str

    question: str

    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4,
    )

    explanation: str = ""

    difficulty: str = "medium"


# ============================================================
# QUIZ GENERATE REQUEST
# ============================================================

class QuizGenerateRequest(BaseModel):
    """
    Request sent by the frontend to generate a quiz.

    teaching_strategy controls how Gemini creates the
    questions.
    """

    lecture_id: str

    topic: str | None = None

    teaching_strategy: TeachingStrategy = "Simple"

    number_of_questions: int = Field(
        default=10,
        ge=5,
        le=20,
    )


# ============================================================
# QUIZ RESPONSE
# ============================================================

class QuizResponse(BaseModel):
    """
    Quiz returned to the frontend.

    IMPORTANT:
    Correct answers are NOT included here.
    """

    quiz_id: str

    lecture_id: str

    topic: str | None = None

    teaching_strategy: TeachingStrategy = "Simple"

    questions: list[QuizQuestion]


# ============================================================
# QUIZ ANSWER
# ============================================================

class QuizAnswer(BaseModel):
    """
    One answer submitted by the student.
    """

    question_id: str

    selected_answer: str = ""


# ============================================================
# QUIZ SUBMIT REQUEST
# ============================================================

class QuizSubmitRequest(BaseModel):
    """
    Complete quiz submission.
    """

    quiz_id: str

    answers: list[QuizAnswer]


# ============================================================
# QUIZ ANSWER RESULT
# ============================================================

class QuizAnswerResult(BaseModel):
    """
    Feedback for one submitted question.
    """

    question_id: str

    selected_answer: str

    correct_answer: str

    is_correct: bool

    explanation: str = ""


# ============================================================
# QUIZ SUBMIT RESPONSE
# ============================================================

class QuizSubmitResponse(BaseModel):
    """
    Complete result returned after quiz submission.

    Includes the lecture and topic information so the
    Review Results page can display which topic the quiz
    was based on.
    """

    quiz_id: str

    lecture_id: str

    topic: str | None = None

    teaching_strategy: TeachingStrategy = "Simple"

    score: float

    total_marks: float

    percentage: float

    passed: bool

    test_id: str

    results: list[QuizAnswerResult]