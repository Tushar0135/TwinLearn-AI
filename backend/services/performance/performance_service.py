from sqlalchemy.orm import Session

from models.test_result import TestResult


class PerformanceService:

    # ========================================================
    # OVERALL PERFORMANCE
    # ========================================================

    @staticmethod
    def get_overall_performance(
        db: Session,
        student_db_id: int,
    ) -> dict:
        """
        Calculate overall performance of a student
        from their saved test results.
        """

        results = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student_db_id
            )
            .order_by(
                TestResult.created_at.desc()
            )
            .all()
        )

        # No tests attempted yet
        if not results:
            return {
                "total_tests": 0,
                "average_score": 0,
                "highest_score": 0,
                "lowest_score": 0,
                "passed_tests": 0,
                "failed_tests": 0,
            }

        percentages = [
            float(result.percentage)
            for result in results
        ]

        passed_tests = sum(
            1
            for result in results
            if result.passed
        )

        failed_tests = (
            len(results) - passed_tests
        )

        return {
            "total_tests": len(results),

            "average_score": round(
                sum(percentages) / len(percentages),
                2,
            ),

            "highest_score": round(
                max(percentages),
                2,
            ),

            "lowest_score": round(
                min(percentages),
                2,
            ),

            "passed_tests": passed_tests,

            "failed_tests": failed_tests,
        }

    # ========================================================
    # TOPIC MASTERY
    # ========================================================

    @staticmethod
    def get_topic_mastery(
        db: Session,
        student_db_id: int,
    ) -> dict:
        """
        Calculate topic-wise mastery for a student.

        For every topic, calculate:
            - Average score
            - Number of tests attempted

        Results are sorted from highest mastery
        to lowest mastery.
        """

        results = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student_db_id,
                TestResult.topic.isnot(None),
            )
            .order_by(
                TestResult.created_at.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # NO TOPIC DATA
        # ----------------------------------------------------

        if not results:
            return {
                "topics": []
            }

        # ----------------------------------------------------
        # GROUP RESULTS BY TOPIC
        # ----------------------------------------------------

        topic_data = {}

        for result in results:

            topic = result.topic.strip()

            # Ignore empty topic names
            if not topic:
                continue

            if topic not in topic_data:
                topic_data[topic] = {
                    "scores": [],
                    "tests_attempted": 0,
                }

            topic_data[topic]["scores"].append(
                float(result.percentage)
            )

            topic_data[topic]["tests_attempted"] += 1

        # ----------------------------------------------------
        # CALCULATE TOPIC AVERAGES
        # ----------------------------------------------------

        topics = []

        for topic, data in topic_data.items():

            scores = data["scores"]

            average_score = (
                sum(scores) / len(scores)
            )

            topics.append(
                {
                    "topic": topic,

                    "average_score": round(
                        average_score,
                        2,
                    ),

                    "tests_attempted": (
                        data["tests_attempted"]
                    ),
                }
            )

        # ----------------------------------------------------
        # SORT BY MASTERY
        # HIGHEST SCORE FIRST
        # ----------------------------------------------------

        topics.sort(
            key=lambda item: item["average_score"],
            reverse=True,
        )

        return {
            "topics": topics
        }

    # ========================================================
    # WEAK TOPIC DETECTION
    # ========================================================

    @staticmethod
    def get_weak_topics(
        db: Session,
        student_db_id: int,
    ) -> dict:
        """
        Identify topics where the student's average
        performance is below the weak-topic threshold.

        Current rule:

            Average score < 60%
                -> Weak topic

            Average score >= 60%
                -> Not considered weak
        """

        WEAK_TOPIC_THRESHOLD = 60.0

        results = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student_db_id,
                TestResult.topic.isnot(None),
            )
            .order_by(
                TestResult.created_at.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # NO RESULTS
        # ----------------------------------------------------

        if not results:
            return {
                "weak_topics": []
            }

        # ----------------------------------------------------
        # GROUP SCORES BY TOPIC
        # ----------------------------------------------------

        topic_data = {}

        for result in results:

            topic = result.topic.strip()

            # Ignore empty topic names
            if not topic:
                continue

            if topic not in topic_data:
                topic_data[topic] = []

            topic_data[topic].append(
                float(result.percentage)
            )

        # ----------------------------------------------------
        # IDENTIFY WEAK TOPICS
        # ----------------------------------------------------

        weak_topics = []

        for topic, scores in topic_data.items():

            average_score = (
                sum(scores) / len(scores)
            )

            if average_score < WEAK_TOPIC_THRESHOLD:

                weak_topics.append(
                    {
                        "topic": topic,

                        "average_score": round(
                            average_score,
                            2,
                        ),

                        "tests_attempted": len(
                            scores
                        ),
                    }
                )

        # ----------------------------------------------------
        # SORT BY LOWEST SCORE FIRST
        # ----------------------------------------------------

        weak_topics.sort(
            key=lambda item: item["average_score"]
        )

        return {
            "weak_topics": weak_topics
        }

    # ========================================================
    # LEARNING HISTORY
    # ========================================================

    @staticmethod
    def get_learning_history(
        db: Session,
        student_db_id: int,
    ) -> dict:
        """
        Return the complete learning/test history
        of a student.

        Each history item contains:
            - Test ID
            - Topic
            - Test name
            - Score
            - Total marks
            - Percentage
            - Passed status
            - Date
        """

        results = (
            db.query(TestResult)
            .filter(
                TestResult.student_id == student_db_id
            )
            .order_by(
                TestResult.created_at.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # NO TEST HISTORY
        # ----------------------------------------------------

        if not results:
            return {
                "history": []
            }

        # ----------------------------------------------------
        # BUILD HISTORY
        # ----------------------------------------------------

        history = []

        for result in results:

            history.append(
                {
                    "test_id": result.test_id,

                    "topic": result.topic,

                    "test_name": result.test_name,

                    "score": round(
                        float(result.score),
                        2,
                    ),

                    "total_marks": round(
                        float(result.total_marks),
                        2,
                    ),

                    "percentage": round(
                        float(result.percentage),
                        2,
                    ),

                    "passed": result.passed,

                    "date": result.created_at.isoformat(),
                }
            )

        return {
            "history": history
        }