"""
services/decision_service.py

Adaptive decision engine for TwinLearnAI.

The DecisionService analyzes recent student performance
and selects an appropriate teaching strategy.
"""

from sqlalchemy.orm import Session

from models.test_result import TestResult


class DecisionService:
    """
    Responsible for selecting the teaching strategy
    based on recent student performance.
    """

    # ========================================================
    # DEFAULT STRATEGY
    # ========================================================

    DEFAULT_STRATEGY = "story based"

    # ========================================================
    # THRESHOLDS
    # ========================================================

    VERY_LOW_SCORE_THRESHOLD = 50.0

    RECENT_TEST_THRESHOLD = 80.0

    DIAGRAM_ACCURACY_THRESHOLD = 50.0

    RECENT_TEST_COUNT = 3

    # ========================================================
    # MAIN DECISION FUNCTION
    # ========================================================

    @staticmethod
    def select_strategy(
        db: Session,
        student_db_id: int,
    ) -> dict:
        """
        Select the appropriate teaching strategy
        based on recent student performance.

        Decision priority:

        Rule 1:
            Mean of recent tests < 50%
            -> story based

        Rule 2:
            Mean of last 3 tests < 80%
            -> diagram based

        Rule 3:
            Latest diagram accuracy < 50%
            -> diagram based

        Rule 4:
            Otherwise
            -> story based
        """

        # ====================================================
        # FETCH RECENT TEST RESULTS
        # ====================================================

        recent_tests = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student_db_id
            )
            .order_by(
                TestResult.created_at.desc()
            )
            .limit(
                DecisionService.RECENT_TEST_COUNT
            )
            .all()
        )

        # ====================================================
        # NO TEST DATA
        # ====================================================

        if not recent_tests:

            return {
                "strategy": DecisionService.DEFAULT_STRATEGY,
                "reason": (
                    "No test performance data is available. "
                    "Using the default story-based teaching strategy."
                ),
                "score": None,
                "mean_score": None,
                "rule": "default",
            }

        # ====================================================
        # CALCULATE MEAN SCORE
        # ====================================================

        scores = [
            float(test.percentage)
            for test in recent_tests
        ]

        mean_score = sum(scores) / len(scores)

        # ====================================================
        # LATEST TEST
        # ====================================================

        latest_test = recent_tests[0]

        # ====================================================
        # RULE 1
        # MEAN SCORE < 50%
        # ====================================================

        if (
            mean_score
            < DecisionService.VERY_LOW_SCORE_THRESHOLD
        ):

            return {
                "strategy": "story based",
                "reason": (
                    f"The student's mean score across "
                    f"the recent tests is {mean_score:.1f}%, "
                    "which is below 50%. "
                    "A story-based strategy is selected "
                    "to simplify the concept."
                ),
                "score": round(mean_score, 2),
                "mean_score": round(mean_score, 2),
                "rule": "mean_score_below_50",
            }

        # ====================================================
        # RULE 2
        # MEAN OF LAST 3 TESTS < 80%
        # ====================================================

        if (
            len(recent_tests)
            >= DecisionService.RECENT_TEST_COUNT
        ):

            rounded_scores = [
                round(test.percentage, 1)
                for test in recent_tests
            ]

            if (
                mean_score
                < DecisionService.RECENT_TEST_THRESHOLD
            ):

                return {
                    "strategy": "diagram based",
                    "reason": (
                        "The student's recent mean performance "
                        f"is {mean_score:.1f}%, calculated from "
                        f"the last 3 test scores "
                        f"{rounded_scores}. "
                        "Since the mean is below 80%, a "
                        "diagram-based strategy is selected."
                    ),
                    "score": round(mean_score, 2),
                    "mean_score": round(mean_score, 2),
                    "rule": "recent_mean_below_80",
                }

        # ====================================================
        # RULE 3
        # DIAGRAM ACCURACY < 50%
        # ====================================================

        if latest_test.diagram_questions > 0:

            diagram_accuracy = (
                latest_test.diagram_correct
                / latest_test.diagram_questions
            ) * 100

            if (
                diagram_accuracy
                < DecisionService.DIAGRAM_ACCURACY_THRESHOLD
            ):

                return {
                    "strategy": "diagram based",
                    "reason": (
                        f"The student's diagram-question "
                        f"accuracy is {diagram_accuracy:.1f}%, "
                        "which is below 50%. "
                        "A diagram-based strategy is selected."
                    ),
                    "score": round(mean_score, 2),
                    "mean_score": round(mean_score, 2),
                    "rule": "low_diagram_accuracy",
                    "diagram_accuracy": round(
                        diagram_accuracy,
                        2,
                    ),
                }

        # ====================================================
        # RULE 4
        # DEFAULT
        # ====================================================

        return {
            "strategy": DecisionService.DEFAULT_STRATEGY,
            "reason": (
                "The student's recent mean performance "
                f"is {mean_score:.1f}%. "
                "The performance does not trigger "
                "a specific adaptive rule. Using the "
                "default story-based teaching strategy."
            ),
            "score": round(mean_score, 2),
            "mean_score": round(mean_score, 2),
            "rule": "default",
        }