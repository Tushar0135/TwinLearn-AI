from __future__ import annotations

import json
import traceback
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.lecture import Lecture
from models.quiz import Quiz
from models.student import Student
from models.test_result import TestResult

from rag.services.retrieval_service import RetrievalService
from rag.services.context_service import ContextService
from rag.services.llm_service import GeminiService

from schemas.quiz_schema import (
    QuizAnswer,
    QuizQuestion,
)


class QuizService:
    """
    Handles quiz generation, evaluation, quiz submission,
    and quiz history.

    Quiz lifecycle:

        Lecture
            ↓
        RAG Retrieval
            ↓
        Context
            ↓
        Gemini
            ↓
        Validate Questions
            ↓
        Save Quiz
            ↓
        Return Public Quiz
            ↓
        Student Submission
            ↓
        Load Quiz
            ↓
        Evaluate
            ↓
        Save TestResult
            ↓
        Mark Quiz Submitted
            ↓
        Quiz History
    """

    # ========================================================
    # INIT
    # ========================================================

    def __init__(
        self,
        retrieval_service: RetrievalService,
        context_service: ContextService,
        llm_service: GeminiService,
    ) -> None:

        self._retrieval_service = retrieval_service
        self._context_service = context_service
        self._llm_service = llm_service

    # ========================================================
    # GENERATE QUIZ
    # ========================================================

    def generate_quiz(
        self,
        db: Session,
        student: Student,
        lecture_id: str,
        topic: str | None,
        teaching_strategy: str | None,
        number_of_questions: int,
    ) -> dict[str, Any]:

        # ----------------------------------------------------
        # 1. VALIDATE QUESTION COUNT
        # ----------------------------------------------------

        if number_of_questions < 5:
            raise HTTPException(
                status_code=400,
                detail="At least 5 questions are required.",
            )

        if number_of_questions > 20:
            raise HTTPException(
                status_code=400,
                detail="A maximum of 20 questions is allowed.",
            )

        # ----------------------------------------------------
        # 2. NORMALIZE TEACHING STRATEGY
        # ----------------------------------------------------

        strategy = self._normalize_strategy(
            teaching_strategy
        )

        # ----------------------------------------------------
        # 3. NORMALIZE LECTURE ID
        # ----------------------------------------------------

        lecture_id = str(lecture_id).strip()

        if not lecture_id:
            raise HTTPException(
                status_code=400,
                detail="Lecture ID is required.",
            )

        # ----------------------------------------------------
        # 4. FIND LECTURE
        # ----------------------------------------------------

        lecture = (
            db.query(Lecture)
            .filter(
                Lecture.lecture_id == lecture_id
            )
            .first()
        )

        if lecture is None:
            raise HTTPException(
                status_code=404,
                detail="Lecture not found.",
            )

        # ----------------------------------------------------
        # 5. VERIFY LECTURE OWNERSHIP
        # ----------------------------------------------------

        if str(lecture.student_id) != str(
            student.student_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this lecture.",
            )

        # ----------------------------------------------------
        # 6. DETERMINE TOPIC
        # ----------------------------------------------------

        quiz_topic: str | None = None

        if topic and str(topic).strip():

            quiz_topic = str(topic).strip()

        elif getattr(lecture, "topic", None):

            lecture_topic = str(
                lecture.topic
            ).strip()

            if lecture_topic:
                quiz_topic = lecture_topic

        # ----------------------------------------------------
        # 7. BUILD RETRIEVAL QUERY
        # ----------------------------------------------------

        if quiz_topic:

            retrieval_query = (
                f"Generate quiz questions about {quiz_topic}. "
                "Focus on important concepts, definitions, "
                "relationships, examples, applications, "
                "and explanations from this lecture."
            )

        else:

            retrieval_query = (
                "Identify the most important concepts, "
                "definitions, relationships, examples, "
                "applications, and explanations from this "
                "lecture for quiz generation."
            )

        # ----------------------------------------------------
        # 8. RETRIEVE LECTURE CONTENT
        # ----------------------------------------------------

        try:

            retrieval_result = (
                self._retrieval_service.retrieve(
                    query=retrieval_query,
                    top_k=10,
                    metadata_filter={
                        "lecture_id": lecture_id,
                    },
                )
            )

        except Exception as exc:

            print(
                "\n========== QUIZ RETRIEVAL ERROR =========="
            )

            traceback.print_exc()

            print(
                "==========================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to retrieve lecture content "
                    "for quiz generation."
                ),
            ) from exc

        # ----------------------------------------------------
        # 9. EXTRACT CHUNKS
        # ----------------------------------------------------

        chunks = getattr(
            retrieval_result,
            "chunks",
            None,
        )

        if not chunks:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No relevant lecture content was found "
                    "for quiz generation."
                ),
            )

        # ----------------------------------------------------
        # 10. BUILD CONTEXT
        # ----------------------------------------------------

        try:

            context = (
                self._context_service.build_context(
                    chunks
                )
            )

        except Exception as exc:

            print(
                "\n========== QUIZ CONTEXT ERROR =========="
            )

            traceback.print_exc()

            print(
                "========================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to build lecture context "
                    "for quiz generation."
                ),
            ) from exc

        if not context or not str(context).strip():

            raise HTTPException(
                status_code=404,
                detail="Lecture context is empty.",
            )

        # ----------------------------------------------------
        # 11. GENERATE QUESTIONS
        # ----------------------------------------------------

        generation_count = min(
            number_of_questions + 3,
            20,
        )

        prompt = self._build_quiz_prompt(
            context=context,
            topic=quiz_topic,
            teaching_strategy=strategy,
            number_of_questions=generation_count,
        )

        questions = self._generate_and_parse(
            prompt=prompt,
            required_count=number_of_questions,
        )

        # ----------------------------------------------------
        # 12. RETRY IF NECESSARY
        # ----------------------------------------------------

        if len(questions) < number_of_questions:

            retry_count = min(
                number_of_questions + 5,
                20,
            )

            retry_prompt = self._build_quiz_prompt(
                context=context,
                topic=quiz_topic,
                teaching_strategy=strategy,
                number_of_questions=retry_count,
            )

            questions = self._generate_and_parse(
                prompt=retry_prompt,
                required_count=number_of_questions,
            )

        # ----------------------------------------------------
        # 13. FINAL VALIDATION
        # ----------------------------------------------------

        if len(questions) < number_of_questions:

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Only {len(questions)} valid questions "
                    f"were generated. Please try again."
                ),
            )

        questions = questions[:number_of_questions]

        # ----------------------------------------------------
        # 14. CREATE QUIZ ID
        # ----------------------------------------------------

        quiz_id = str(uuid.uuid4())

        # ----------------------------------------------------
        # 15. CREATE DATABASE QUIZ
        # ----------------------------------------------------

        quiz = Quiz(
            quiz_id=quiz_id,

            # Quiz.student_id references students.id
            student_id=student.id,

            lecture_id=lecture_id,

            topic=quiz_topic,

            test_name="Lecture Quiz",

            teaching_strategy=strategy,

            number_of_questions=number_of_questions,

            questions=questions,

            status="generated",
        )

        # ----------------------------------------------------
        # 16. SAVE QUIZ
        # ----------------------------------------------------

        try:

            db.add(quiz)

            db.commit()

            db.refresh(quiz)

        except SQLAlchemyError as exc:

            db.rollback()

            print(
                "\n========== QUIZ SAVE ERROR =========="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            traceback.print_exc()

            print(
                "=====================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz was generated, "
                    "but could not be saved to the database."
                ),
            ) from exc

        except Exception as exc:

            db.rollback()

            print(
                "\n========== QUIZ SAVE UNKNOWN ERROR =========="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            traceback.print_exc()

            print(
                "=============================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz was generated, "
                    "but could not be saved."
                ),
            ) from exc

        # ----------------------------------------------------
        # 17. PUBLIC QUESTIONS
        # ----------------------------------------------------

        public_questions: list[QuizQuestion] = []

        for question in questions:

            public_questions.append(
                QuizQuestion(
                    question_id=str(
                        question["question_id"]
                    ),

                    question=str(
                        question["question"]
                    ),

                    options=list(
                        question["options"]
                    ),

                    # Correct answer MUST NOT be sent
                    # during quiz generation.
                    explanation="",

                    difficulty=str(
                        question.get(
                            "difficulty",
                            "medium",
                        )
                    ),
                )
            )

        # ----------------------------------------------------
        # 18. RETURN QUIZ
        # ----------------------------------------------------

        return {
            "quiz_id": str(
                quiz.quiz_id
            ),

            "lecture_id": str(
                quiz.lecture_id
            ),

            "topic": quiz.topic,

            "teaching_strategy": (
                quiz.teaching_strategy
            ),

            "questions": public_questions,
        }

    # ========================================================
    # GEMINI GENERATION HELPER
    # ========================================================

    def _generate_and_parse(
        self,
        prompt: str,
        required_count: int,
    ) -> list[dict[str, Any]]:

        try:

            raw_response = (
                self._llm_service.generate(
                    prompt
                )
            )

        except Exception as exc:

            print(
                "\n========== GEMINI QUIZ ERROR =========="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            traceback.print_exc()

            print(
                "=======================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate quiz using Gemini."
                ),
            ) from exc

        if not raw_response:
            return []

        questions = self._parse_questions(
            raw_response
        )

        # ----------------------------------------------------
        # REMOVE DUPLICATE QUESTIONS
        # ----------------------------------------------------

        unique_questions: list[
            dict[str, Any]
        ] = []

        seen: set[str] = set()

        for question in questions:

            question_text = str(
                question.get(
                    "question",
                    "",
                )
            ).strip()

            key = question_text.casefold()

            if not key:
                continue

            if key in seen:
                continue

            seen.add(key)

            unique_questions.append(
                question
            )

        return unique_questions[:required_count]

    # ========================================================
    # NORMALIZE TEACHING STRATEGY
    # ========================================================

    @staticmethod
    def _normalize_strategy(
        teaching_strategy: str | None,
    ) -> str:

        allowed_strategies = {
            "Story Based",
            "Diagram Based",
            "Step by Step",
            "Code Based",
            "Example Based",
            "Exam Oriented",
            "Interview Oriented",
            "Simple",
            "Detailed",
        }

        if not teaching_strategy:
            return "Simple"

        strategy = str(
            teaching_strategy
        ).strip()

        normalized_lookup = {
            value.casefold(): value
            for value in allowed_strategies
        }

        normalized_strategy = normalized_lookup.get(
            strategy.casefold()
        )

        if normalized_strategy is None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid teaching strategy. "
                    f"Allowed strategies: "
                    f"{', '.join(sorted(allowed_strategies))}"
                ),
            )

        return normalized_strategy

    # ========================================================
    # STRATEGY INSTRUCTIONS
    # ========================================================

    @staticmethod
    def _get_strategy_instruction(
        teaching_strategy: str,
    ) -> str:

        instructions = {

            "Story Based": """
Create questions using short stories,
scenarios, or real-world narratives based
strictly on the lecture content.

The scenario must test the lecture concept,
not unrelated general knowledge.
""",

            "Diagram Based": """
Create questions about diagrams, architectures,
workflows, pipelines, layers, components,
relationships, or visual structures described
in the lecture.

Do not invent diagrams that are not supported
by the lecture content.
""",

            "Step by Step": """
Create questions about sequences, procedures,
algorithms, workflows, pipelines, and ordered
processes from the lecture.

Focus on understanding the correct sequence
and why each step occurs.
""",

            "Code Based": """
Create questions around code, pseudocode,
programming logic, algorithms, syntax, or
implementation concepts only when supported
by the lecture.

Do not invent code concepts absent from the
lecture.
""",

            "Example Based": """
Create questions using examples and practical
situations from the lecture.

Test whether the learner can apply the concept
to a similar situation.
""",

            "Exam Oriented": """
Create examination-style questions focused on
definitions, key concepts, distinctions,
applications, comparisons, and important facts.

Questions should resemble useful university
examination preparation.
""",

            "Interview Oriented": """
Create technical interview-style questions focused
on why concepts are used, how they work, trade-offs,
comparisons, and practical reasoning.

Avoid trivia unrelated to the lecture.
""",

            "Simple": """
Create beginner-friendly questions using simple
language and focusing on fundamental understanding.

Avoid unnecessary complexity.
""",

            "Detailed": """
Create deeper conceptual questions testing
relationships, mechanisms, reasoning, applications,
comparisons, limitations, and implications.
""",
        }

        return instructions.get(
            teaching_strategy,
            instructions["Simple"],
        )

    # ========================================================
    # QUIZ PROMPT
    # ========================================================

    @classmethod
    def _build_quiz_prompt(
        cls,
        context: str,
        topic: str | None,
        teaching_strategy: str,
        number_of_questions: int,
    ) -> str:

        if topic:

            topic_instruction = (
                f"Focus specifically on the topic: {topic}."
            )

        else:

            topic_instruction = (
                "Cover the most important concepts "
                "from the lecture."
            )

        strategy_instruction = (
            cls._get_strategy_instruction(
                teaching_strategy
            )
        )

        return f"""
You are an educational quiz generator for
LearnTwin AI Professor.

Generate exactly {number_of_questions} valid
multiple-choice questions.

TEACHING STRATEGY:
{teaching_strategy}

STRATEGY INSTRUCTIONS:
{strategy_instruction}

TOPIC:
{topic_instruction}

==================================================
STRICT SOURCE RULE
==================================================

Use ONLY the provided lecture context.

Do NOT use outside knowledge.

Do NOT invent facts.

Do NOT add information that is not supported
by the lecture context.

==================================================
QUESTION REQUIREMENTS
==================================================

1. Generate exactly {number_of_questions} questions.

2. Every question must have exactly 4 options.

3. Every option must be a non-empty string.

4. All four options must be different.

5. There must be exactly ONE correct answer.

6. correct_answer must exactly match one option.

7. Every question must have an explanation.

8. difficulty must be one of:
   easy
   medium
   hard

9. Do not duplicate questions.

10. Do not duplicate options.

11. Do not use "All of the above".

12. Do not use "None of the above".

13. Do not create ambiguous questions.

14. Do not create questions whose answer is not
    supported by the lecture context.

15. Do not use outside knowledge.

16. Return ONLY valid JSON.

17. Do NOT return Markdown.

18. Do NOT use ```json.

19. Do NOT add any text before or after the JSON.

==================================================
OUTPUT FORMAT
==================================================

{{
  "questions": [
    {{
      "question_id": "1",
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option B",
      "explanation": "Short explanation based on the lecture.",
      "difficulty": "medium"
    }}
  ]
}}

==================================================
LECTURE CONTEXT
==================================================

{context}
"""

    # ========================================================
    # PARSE QUESTIONS
    # ========================================================

    @staticmethod
    def _parse_questions(
        raw_response: str,
    ) -> list[dict[str, Any]]:

        if not raw_response:
            return []

        try:

            cleaned = str(
                raw_response
            ).strip()

            # ------------------------------------------------
            # REMOVE CODE FENCES
            # ------------------------------------------------

            if cleaned.startswith(
                "```json"
            ):

                cleaned = cleaned[7:]

            elif cleaned.startswith(
                "```"
            ):

                cleaned = cleaned[3:]

            if cleaned.endswith(
                "```"
            ):

                cleaned = cleaned[:-3]

            cleaned = cleaned.strip()

            # ------------------------------------------------
            # EXTRACT JSON OBJECT
            # ------------------------------------------------

            first_brace = cleaned.find(
                "{"
            )

            last_brace = cleaned.rfind(
                "}"
            )

            if (
                first_brace == -1
                or last_brace == -1
                or last_brace <= first_brace
            ):

                return []

            cleaned = cleaned[
                first_brace:
                last_brace + 1
            ]

            # ------------------------------------------------
            # LOAD JSON
            # ------------------------------------------------

            data = json.loads(
                cleaned
            )

            if not isinstance(
                data,
                dict,
            ):

                return []

            questions = data.get(
                "questions",
                [],
            )

            if not isinstance(
                questions,
                list,
            ):

                return []

            validated_questions: list[
                dict[str, Any]
            ] = []

            # ------------------------------------------------
            # VALIDATE EACH QUESTION
            # ------------------------------------------------

            for index, question in enumerate(
                questions,
                start=1,
            ):

                if not isinstance(
                    question,
                    dict,
                ):
                    continue

                # --------------------------------------------
                # QUESTION TEXT
                # --------------------------------------------

                question_text = str(
                    question.get(
                        "question",
                        "",
                    )
                    or ""
                ).strip()

                if not question_text:
                    continue

                # --------------------------------------------
                # OPTIONS
                # --------------------------------------------

                options = question.get(
                    "options"
                )

                if not isinstance(
                    options,
                    list,
                ):
                    continue

                if len(options) != 4:
                    continue

                normalized_options: list[str] = []

                for option in options:

                    if option is None:
                        normalized_options = []
                        break

                    value = str(
                        option
                    ).strip()

                    if not value:
                        normalized_options = []
                        break

                    normalized_options.append(
                        value
                    )

                if len(
                    normalized_options
                ) != 4:
                    continue

                # --------------------------------------------
                # DUPLICATE OPTIONS
                # --------------------------------------------

                option_keys = {
                    option.casefold()
                    for option in normalized_options
                }

                if len(option_keys) != 4:
                    continue

                # --------------------------------------------
                # FORBIDDEN OPTIONS
                # --------------------------------------------

                forbidden_options = {
                    "all of the above",
                    "none of the above",
                }

                if any(
                    option.casefold()
                    in forbidden_options
                    for option in normalized_options
                ):
                    continue

                # --------------------------------------------
                # CORRECT ANSWER
                # --------------------------------------------

                correct_answer = str(
                    question.get(
                        "correct_answer",
                        "",
                    )
                    or ""
                ).strip()

                if not correct_answer:
                    continue

                matching_option: str | None = None

                for option in normalized_options:

                    if (
                        option.casefold()
                        ==
                        correct_answer.casefold()
                    ):

                        matching_option = option
                        break

                if matching_option is None:
                    continue

                # --------------------------------------------
                # EXPLANATION
                # --------------------------------------------

                explanation = str(
                    question.get(
                        "explanation",
                        "",
                    )
                    or ""
                ).strip()

                if not explanation:

                    explanation = (
                        "The correct answer is supported "
                        "by the lecture content."
                    )

                # --------------------------------------------
                # DIFFICULTY
                # --------------------------------------------

                difficulty = str(
                    question.get(
                        "difficulty",
                        "medium",
                    )
                    or "medium"
                ).strip().lower()

                difficulty_mapping = {
                    "beginner": "easy",
                    "intermediate": "medium",
                    "advanced": "hard",
                }

                difficulty = difficulty_mapping.get(
                    difficulty,
                    difficulty,
                )

                if difficulty not in {
                    "easy",
                    "medium",
                    "hard",
                }:

                    difficulty = "medium"

                # --------------------------------------------
                # ADD VALID QUESTION
                # --------------------------------------------

                validated_questions.append(
                    {
                        "question_id": str(index),

                        "question": question_text,

                        "options": normalized_options,

                        "correct_answer": matching_option,

                        "explanation": explanation,

                        "difficulty": difficulty,
                    }
                )

            return validated_questions

        except json.JSONDecodeError as exc:

            print(
                "\n========== QUIZ JSON PARSE ERROR =========="
            )

            print(
                f"ERROR: {exc}"
            )

            print(
                "===========================================\n"
            )

            return []

        except Exception as exc:

            print(
                "\n========== QUIZ PARSE ERROR =========="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            traceback.print_exc()

            print(
                "=======================================\n"
            )

            return []

    # ========================================================
    # SUBMIT QUIZ
    # ========================================================

    def submit_quiz(
        self,
        db: Session,
        student: Student,
        quiz_id: str,
        answers: list[QuizAnswer],
    ) -> dict[str, Any]:

        print(
            "\n========== QUIZ SUBMISSION START =========="
        )

        print(
            f"DEBUG quiz_id = {quiz_id}"
        )

        print(
            f"DEBUG student.id = {student.id}"
        )

        print(
            f"DEBUG student.student_id = "
            f"{student.student_id}"
        )

        # ----------------------------------------------------
        # 1. FIND QUIZ
        # ----------------------------------------------------

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.quiz_id == str(quiz_id).strip()
            )
            .first()
        )

        if quiz is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Quiz not found. "
                    "Please generate a new quiz."
                ),
            )

        print(
            f"DEBUG quiz found = {quiz.quiz_id}"
        )

        print(
            f"DEBUG quiz.student_id = "
            f"{quiz.student_id}"
        )

        print(
            f"DEBUG quiz.lecture_id = "
            f"{quiz.lecture_id}"
        )

        print(
            f"DEBUG quiz.topic = "
            f"{quiz.topic}"
        )

        print(
            f"DEBUG quiz.teaching_strategy = "
            f"{quiz.teaching_strategy}"
        )

        print(
            f"DEBUG quiz.status = "
            f"{quiz.status}"
        )

        # ----------------------------------------------------
        # 2. VERIFY QUIZ OWNERSHIP
        # ----------------------------------------------------

        if str(quiz.student_id) != str(student.id):

            print(
                "DEBUG - Quiz ownership failed"
            )

            raise HTTPException(
                status_code=403,
                detail="You cannot submit this quiz.",
            )

        # ----------------------------------------------------
        # 3. FIND ASSOCIATED LECTURE
        # ----------------------------------------------------

        lecture = (
            db.query(Lecture)
            .filter(
                Lecture.lecture_id
                == str(quiz.lecture_id)
            )
            .first()
        )

        if lecture is None:

            raise HTTPException(
                status_code=404,
                detail="Associated lecture not found.",
            )

        print(
            f"DEBUG lecture found = "
            f"{lecture.lecture_id}"
        )

        # ----------------------------------------------------
        # 4. VERIFY LECTURE OWNERSHIP
        # ----------------------------------------------------

        if str(lecture.student_id) != str(
            student.student_id
        ):

            print(
                "DEBUG - Lecture ownership failed"
            )

            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have access to "
                    "this quiz's lecture."
                ),
            )

        # ----------------------------------------------------
        # 5. CHECK QUIZ STATUS
        # ----------------------------------------------------

        if quiz.status == "submitted":

            raise HTTPException(
                status_code=400,
                detail="This quiz has already been submitted.",
            )

        # ----------------------------------------------------
        # 6. LOAD QUESTIONS
        # ----------------------------------------------------

        questions = quiz.questions

        print(
            f"DEBUG question count = "
            f"{len(questions) if isinstance(questions, list) else 'INVALID'}"
        )

        if not isinstance(
            questions,
            list,
        ) or not questions:

            raise HTTPException(
                status_code=400,
                detail="This quiz contains no questions.",
            )

        # ----------------------------------------------------
        # 7. BUILD SUBMITTED ANSWER LOOKUP
        # ----------------------------------------------------

        submitted_answers: dict[str, str] = {}

        for answer in answers:

            question_id = str(
                answer.question_id
            ).strip()

            selected_answer = str(
                answer.selected_answer or ""
            ).strip()

            if question_id:

                submitted_answers[
                    question_id
                ] = selected_answer

        print(
            f"DEBUG submitted answers = "
            f"{submitted_answers}"
        )

        # ----------------------------------------------------
        # 8. EVALUATE QUESTIONS
        # ----------------------------------------------------

        score = 0

        results: list[dict[str, Any]] = []

        valid_question_count = 0

        for question in questions:

            if not isinstance(
                question,
                dict,
            ):
                continue

            question_id = str(
                question.get(
                    "question_id",
                    "",
                )
                or ""
            ).strip()

            if not question_id:
                continue

            valid_question_count += 1

            selected_answer = (
                submitted_answers.get(
                    question_id,
                    "",
                )
            )

            correct_answer = str(
                question.get(
                    "correct_answer",
                    "",
                )
                or ""
            ).strip()

            is_correct = (
                bool(selected_answer)
                and
                bool(correct_answer)
                and
                selected_answer.casefold()
                ==
                correct_answer.casefold()
            )

            if is_correct:
                score += 1

            results.append(
                {
                    "question_id": question_id,

                    "selected_answer": selected_answer,

                    "correct_answer": correct_answer,

                    "is_correct": is_correct,

                    "explanation": str(
                        question.get(
                            "explanation",
                            "",
                        )
                        or ""
                    ),
                }
            )

        # ----------------------------------------------------
        # 9. VALIDATE QUESTION COUNT
        # ----------------------------------------------------

        if valid_question_count <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "This quiz contains no valid questions."
                ),
            )

        # ----------------------------------------------------
        # 10. CALCULATE SCORE
        # ----------------------------------------------------

        total_marks = valid_question_count

        percentage = (
            score / total_marks
        ) * 100

        passed = percentage >= 40

        print(
            f"DEBUG score = {score}"
        )

        print(
            f"DEBUG total_marks = {total_marks}"
        )

        print(
            f"DEBUG percentage = {percentage}"
        )

        print(
            f"DEBUG passed = {passed}"
        )

        # ----------------------------------------------------
        # 11. CREATE TEST RESULT
        # ----------------------------------------------------

        test_result = TestResult(

            student_id=student.id,

            quiz_id=str(
                quiz.quiz_id
            ),

            lecture_id=str(
                quiz.lecture_id
            ),

            # IMPORTANT:
            # Save topic so Review Results / History
            # can display the quiz topic.
            topic=quiz.topic,

            test_name=(
                quiz.test_name
                or "Lecture Quiz"
            ),

            teaching_strategy=(
                quiz.teaching_strategy
            ),

            score=float(score),

            total_marks=float(
                total_marks
            ),

            percentage=float(
                round(
                    percentage,
                    2,
                )
            ),

            diagram_questions=0,

            diagram_correct=0,

            passed=passed,

            results=results,
        )

        # ----------------------------------------------------
        # 12. UPDATE QUIZ STATUS
        # ----------------------------------------------------

        quiz.status = "submitted"

        # ----------------------------------------------------
        # 13. SAVE TEST RESULT + QUIZ STATUS
        # ----------------------------------------------------

        try:

            print(
                "DEBUG - Adding TestResult..."
            )

            db.add(
                test_result
            )

            print(
                "DEBUG - Flushing database..."
            )

            db.flush()

            print(
                "DEBUG - TestResult flush successful"
            )

            print(
                "DEBUG - Committing database..."
            )

            db.commit()

            print(
                "DEBUG - Database commit successful"
            )

            db.refresh(
                test_result
            )

            print(
                "DEBUG - TestResult refreshed"
            )

        except SQLAlchemyError as exc:

            db.rollback()

            print(
                "\n"
                "===================================================="
            )

            print(
                "DATABASE ERROR WHILE SUBMITTING QUIZ"
            )

            print(
                "===================================================="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            print(
                "----------------------------------------------------"
            )

            print(
                "FULL TRACEBACK:"
            )

            traceback.print_exc()

            print(
                "====================================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz was evaluated, "
                    "but the result could not be saved."
                ),
            ) from exc

        except Exception as exc:

            db.rollback()

            print(
                "\n"
                "===================================================="
            )

            print(
                "UNKNOWN ERROR WHILE SUBMITTING QUIZ"
            )

            print(
                "===================================================="
            )

            print(
                f"ERROR TYPE: {type(exc).__name__}"
            )

            print(
                f"ERROR: {exc}"
            )

            print(
                "FULL TRACEBACK:"
            )

            traceback.print_exc()

            print(
                "====================================================\n"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz submission failed unexpectedly."
                ),
            ) from exc

        # ----------------------------------------------------
        # 14. RETURN RESULT
        # ----------------------------------------------------

        print(
            "========== QUIZ SUBMISSION SUCCESS ==========\n"
        )

        # IMPORTANT:
        # The frontend Review Results page needs topic.
        # Previously topic was saved in TestResult but was
        # NOT returned from submit_quiz().
        return {

            "quiz_id": str(
                quiz.quiz_id
            ),

            "lecture_id": str(
                quiz.lecture_id
            ),

            "topic": quiz.topic,

            "test_name": (
                quiz.test_name
                or "Lecture Quiz"
            ),

            "teaching_strategy": (
                quiz.teaching_strategy
            ),

            "score": float(
                score
            ),

            "total_marks": float(
                total_marks
            ),

            "percentage": float(
                round(
                    percentage,
                    2,
                )
            ),

            "passed": passed,

            "test_id": str(
                test_result.test_id
            ),

            "results": results,
        }

    # ========================================================
    # QUIZ HISTORY
    # ========================================================

    def get_quiz_history(
        self,
        db: Session,
        student: Student,
        lecture_id: str,
    ) -> list[dict[str, Any]]:

        # ----------------------------------------------------
        # 1. NORMALIZE LECTURE ID
        # ----------------------------------------------------

        lecture_id = str(
            lecture_id
        ).strip()

        if not lecture_id:

            raise HTTPException(
                status_code=400,
                detail="Lecture ID is required.",
            )

        # ----------------------------------------------------
        # 2. FIND LECTURE
        # ----------------------------------------------------

        lecture = (
            db.query(Lecture)
            .filter(
                Lecture.lecture_id == lecture_id
            )
            .first()
        )

        if lecture is None:

            raise HTTPException(
                status_code=404,
                detail="Lecture not found.",
            )

        # ----------------------------------------------------
        # 3. VERIFY LECTURE OWNERSHIP
        # ----------------------------------------------------

        if str(lecture.student_id) != str(
            student.student_id
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have access "
                    "to this lecture."
                ),
            )

        # ----------------------------------------------------
        # 4. FIND SUBMITTED QUIZ RESULTS
        # ----------------------------------------------------

        results = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student.id,
                TestResult.lecture_id == lecture_id,
            )
            .all()
        )

        # ----------------------------------------------------
        # 5. BUILD HISTORY RESPONSE
        # ----------------------------------------------------

        history: list[dict[str, Any]] = []

        for result in results:

            history.append(
                {
                    "test_id": str(
                        result.test_id
                    ),

                    "quiz_id": str(
                        result.quiz_id
                    ),

                    "lecture_id": str(
                        result.lecture_id
                    ),

                    # IMPORTANT:
                    # Topic is included here for Review Results
                    # and Quiz History.
                    "topic": result.topic,

                    "test_name": result.test_name,

                    "teaching_strategy": (
                        result.teaching_strategy
                    ),

                    "score": float(
                        result.score or 0
                    ),

                    "total_marks": float(
                        result.total_marks or 0
                    ),

                    "percentage": float(
                        result.percentage or 0
                    ),

                    "passed": bool(
                        result.passed
                    ),

                    "results": (
                        result.results
                        if result.results
                        else []
                    ),
                }
            )

        return history