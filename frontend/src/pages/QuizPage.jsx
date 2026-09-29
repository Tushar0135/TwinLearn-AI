import React, { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  RotateCcw,
  Send,
  Brain,
  Target,
} from "lucide-react";

import {
  Card,
  Button,
  Loading,
  Select,
} from "../components/UI";

import { DashboardLayout } from "../components/Layout";

import lectureService from "../services/lectureService";
import quizService from "../services/quizService";

// ============================================================
// QUIZ PAGE
// ============================================================

export default function QuizPage() {
  const { lectureId } = useParams();

  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [lecture, setLecture] = useState(null);

  const [numberOfQuestions, setNumberOfQuestions] =
    useState("10");

  // ============================================================
  // TEACHING STRATEGY
  // ============================================================
  //
  // This value is now actually sent to quizService and then
  // forwarded to the backend.
  //

  const [teachingStrategy, setTeachingStrategy] =
    useState("Simple");

  const [quiz, setQuiz] = useState(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] = useState({});

  const [result, setResult] = useState(null);

  const [loadingLecture, setLoadingLecture] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // GET LECTURE ID
  // ============================================================

  const getLectureId = (lectureItem) => {
    return (
      lectureItem?.lecture_id ||
      lectureItem?.id ||
      lectureItem?.uuid ||
      null
    );
  };

  // ============================================================
  // LOAD LECTURE
  // ============================================================

  useEffect(() => {
    if (!lectureId) {
      setError("Lecture ID is missing.");
      setLoadingLecture(false);
      return;
    }

    loadLecture();
  }, [lectureId]);

  const loadLecture = async () => {
    setLoadingLecture(true);
    setError("");

    try {
      const response =
        await lectureService.getLectures();

      console.log(
        "QUIZ PAGE - LECTURES RESPONSE:",
        response
      );

      if (
        !response?.success ||
        !Array.isArray(response.data)
      ) {
        setError(
          response?.error ||
            "Could not load lectures."
        );
        return;
      }

      const foundLecture =
        response.data.find(
          (lectureItem) =>
            String(
              getLectureId(lectureItem)
            ) === String(lectureId)
        );

      if (!foundLecture) {
        console.error(
          "Lecture not found:",
          {
            requestedLectureId: lectureId,
            availableLectures:
              response.data,
          }
        );

        setError("Lecture not found.");
        return;
      }

      setLecture(foundLecture);
    } catch (err) {
      console.error(
        "Failed to load lecture:",
        err
      );

      setError(
        err?.message ||
          "Failed to load lecture."
      );
    } finally {
      setLoadingLecture(false);
    }
  };

  // ============================================================
  // GENERATE QUIZ
  // ============================================================

  const handleGenerateQuiz = async () => {
    if (!lectureId) {
      setError("Lecture ID is missing.");
      return;
    }

    if (!lecture) {
      setError(
        "Lecture information is not available."
      );
      return;
    }

    if (!teachingStrategy) {
      setError(
        "Please select a teaching style."
      );
      return;
    }

    setGenerating(true);
    setError("");

    try {
      // ========================================================
      // REQUEST DATA
      // ========================================================

      const requestData = {
        lectureId: String(lectureId),

        topic:
          lecture?.topic ||
          null,

        teachingStrategy:
          teachingStrategy,

        numberOfQuestions:
          Number(numberOfQuestions),
      };

      console.log(
        "========================================"
      );

      console.log(
        "QUIZ GENERATION REQUEST"
      );

      console.log(
        "Teaching Strategy:",
        teachingStrategy
      );

      console.log(
        "Request Data:",
        requestData
      );

      console.log(
        "========================================"
      );

      // ========================================================
      // CALL QUIZ SERVICE
      // ========================================================

      const response =
        await quizService.generateQuiz(
          requestData
        );

      console.log(
        "QUIZ GENERATION RESPONSE:",
        response
      );

      if (!response?.success) {
        setError(
          response?.error ||
            "Failed to generate quiz."
        );
        return;
      }

      const generatedQuiz =
        response.data;

      if (!generatedQuiz) {
        setError(
          "Quiz was generated but no quiz data was returned."
        );
        return;
      }

      if (
        !Array.isArray(
          generatedQuiz.questions
        )
      ) {
        console.error(
          "Invalid quiz response:",
          generatedQuiz
        );

        setError(
          "Invalid quiz data received from the server."
        );
        return;
      }

      if (
        generatedQuiz.questions.length === 0
      ) {
        setError(
          "No questions were generated for this lecture."
        );
        return;
      }

      // ========================================================
      // STORE QUIZ
      // ========================================================

      setQuiz({
        ...generatedQuiz,

        // Keep selected strategy available even if
        // backend does not return it.
        teaching_strategy:
          generatedQuiz.teaching_strategy ||
          generatedQuiz.teachingStrategy ||
          teachingStrategy,
      });

      setAnswers({});
      setCurrentQuestion(0);
      setResult(null);
    } catch (err) {
      console.error(
        "Quiz generation failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate quiz."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // SELECT ANSWER
  // ============================================================

  const handleAnswer = (
    questionId,
    selectedAnswer
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer,
    }));

    setError("");
  };

  // ============================================================
  // NEXT
  // ============================================================

  const handleNext = () => {
    if (!quiz?.questions?.length) {
      return;
    }

    if (
      currentQuestion >=
      quiz.questions.length - 1
    ) {
      return;
    }

    const question =
      quiz.questions[currentQuestion];

    const selected =
      answers[question.question_id];

    if (!selected) {
      setError(
        "Please select an answer before continuing."
      );
      return;
    }

    setError("");

    setCurrentQuestion(
      (previous) => previous + 1
    );
  };

  // ============================================================
  // PREVIOUS
  // ============================================================

  const handlePrevious = () => {
    if (currentQuestion <= 0) {
      return;
    }

    setError("");

    setCurrentQuestion(
      (previous) => previous - 1
    );
  };

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================

  const handleSubmit = async () => {
    if (!quiz) {
      return;
    }

    if (
      !quiz.questions ||
      !quiz.questions.length
    ) {
      setError(
        "There are no questions to submit."
      );
      return;
    }

    // ========================================================
    // CHECK ALL ANSWERS
    // ========================================================

    const unanswered =
      quiz.questions.filter(
        (question) =>
          !answers[
            question.question_id
          ]
      );

    if (unanswered.length > 0) {
      setError(
        `Please answer all questions before submitting. ${unanswered.length} question${
          unanswered.length > 1
            ? "s are"
            : " is"
        } unanswered.`
      );

      const firstUnanswered =
        quiz.questions.findIndex(
          (question) =>
            !answers[
              question.question_id
            ]
        );

      if (firstUnanswered >= 0) {
        setCurrentQuestion(
          firstUnanswered
        );
      }

      return;
    }

    // ========================================================
    // CHECK QUIZ ID
    // ========================================================

    if (!quiz.quiz_id) {
      setError(
        "Quiz ID is missing. Cannot submit quiz."
      );
      return;
    }

    // ========================================================
    // FORMAT ANSWERS
    // ========================================================

    const formattedAnswers =
      quiz.questions.map(
        (question) => ({
          question_id:
            String(
              question.question_id
            ),

          selected_answer:
            answers[
              question.question_id
            ] || "",
        })
      );

    console.log(
      "========================================"
    );

    console.log(
      "QUIZ SUBMISSION"
    );

    console.log(
      "Quiz ID:",
      quiz.quiz_id
    );

    console.log(
      "Lecture ID:",
      lectureId
    );

    console.log(
      "Teaching Strategy:",
      quiz.teaching_strategy ||
        teachingStrategy
    );

    console.log(
      "Answers:",
      formattedAnswers
    );

    console.log(
      "========================================"
    );

    setSubmitting(true);
    setError("");

    try {
      const response =
        await quizService.submitQuiz({
          quizId: quiz.quiz_id,

          answers:
            formattedAnswers,

          // Send strategy with submission as well.
          // Backend can use this to store the strategy
          // used for this quiz attempt.
          teachingStrategy:
            quiz.teaching_strategy ||
            teachingStrategy,
        });

      console.log(
        "QUIZ SUBMISSION RESPONSE:",
        response
      );

      if (!response?.success) {
        setError(
          response?.error ||
            "Failed to submit quiz."
        );
        return;
      }

      if (!response.data) {
        setError(
          "Quiz submitted but no result was returned."
        );
        return;
      }

      setResult(response.data);
    } catch (err) {
      console.error(
        "Quiz submission failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RETAKE
  // ============================================================

  const handleRetakeQuiz = () => {
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    setError("");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingLecture) {
    return (
      <DashboardLayout>
        <div
          className="
            min-h-[60vh]
            flex
            items-center
            justify-center
            bg-[#f7f3ea]
            dark:bg-gray-950
          "
        >
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // LECTURE ERROR
  // ============================================================

  if (error && !lecture) {
    return (
      <DashboardLayout>
        <div
          className="
            min-h-full
            bg-[#f7f3ea]
            dark:bg-gray-950
            p-6
          "
        >
          <Card
            className="
              max-w-2xl
              mx-auto
              p-10
              text-center
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >
            <XCircle
              size={48}
              className="
                mx-auto
                mb-4
                text-red-500
              "
            />

            <h1
              className="
                text-2xl
                font-bold
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              Quiz unavailable
            </h1>

            <p
              className="
                mt-3
                text-[#7d7d72]
                dark:text-gray-400
              "
            >
              {error}
            </p>

            <Button
              className="mt-6"
              onClick={() =>
                navigate("/lectures")
              }
            >
              Back to Lectures
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // RESULT
  // ============================================================

  if (result) {
    const resultItems =
      Array.isArray(result.results)
        ? result.results
        : [];

    const percentage =
      Number(result.percentage || 0);

    const score =
      Number(result.score || 0);

    const totalMarks =
      Number(result.total_marks || 0);

    let performanceLabel =
      "Needs Improvement";

    if (percentage >= 85) {
      performanceLabel =
        "Excellent Understanding";
    } else if (percentage >= 70) {
      performanceLabel =
        "Good Understanding";
    } else if (percentage >= 50) {
      performanceLabel =
        "Developing Understanding";
    }

    return (
      <DashboardLayout>
        <div
          className="
            min-h-full
            bg-[#f7f3ea]
            dark:bg-gray-950
            p-6
          "
        >
          <div className="max-w-5xl mx-auto">

            {/* RESULT HEADER */}

            <div
              className="
                flex
                items-center
                gap-3
                mb-6
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  flex
                  items-center
                  justify-center
                "
              >
                <Trophy
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-[0.2em]
                    font-semibold
                    text-[#c98262]
                  "
                >
                  Quiz Complete
                </p>

                <h1
                  className="
                    font-display
                    text-3xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Your Results
                </h1>
              </div>
            </div>

            {/* SCORE */}

            <Card
              className="
                p-8
                mb-6
                text-center
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              {result.passed ? (
                <CheckCircle2
                  size={58}
                  className="
                    mx-auto
                    text-green-600
                    dark:text-green-400
                  "
                />
              ) : (
                <XCircle
                  size={58}
                  className="
                    mx-auto
                    text-orange-600
                    dark:text-orange-400
                  "
                />
              )}

              <h2
                className="
                  mt-4
                  text-5xl
                  font-bold
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                {percentage}%
              </h2>

              <p
                className="
                  mt-2
                  text-[#7d7d72]
                  dark:text-gray-400
                "
              >
                {score} / {totalMarks} correct
              </p>

              <div
                className="
                  mt-5
                  text-lg
                  font-semibold
                  text-[#4d5047]
                  dark:text-gray-200
                "
              >
                {performanceLabel}
              </div>

              {/* TEACHING STYLE USED */}

              <div
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  text-sm
                  font-semibold
                  text-[#5d6e51]
                  dark:text-[#b7c4ad]
                "
              >
                <Brain size={16} />

                Teaching style:{" "}
                {quiz?.teaching_strategy ||
                  teachingStrategy}
              </div>

              <div
                className={`inline-flex mt-4 ml-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  result.passed
                    ? `
                      bg-green-100
                      text-green-700
                      dark:bg-green-900/30
                      dark:text-green-400
                    `
                    : `
                      bg-orange-100
                      text-orange-700
                      dark:bg-orange-900/30
                      dark:text-orange-400
                    `
                }`}
              >
                {result.passed
                  ? "Passed"
                  : "Needs Improvement"}
              </div>
            </Card>

            {/* LEARNING SUMMARY */}

            <div
              className="
                grid
                md:grid-cols-2
                gap-4
                mb-6
              "
            >
              <Card
                className="
                  p-6
                  bg-[#fffdf8]
                  dark:bg-gray-900
                  border-[#e4ded2]
                  dark:border-gray-700
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    mb-3
                  "
                >
                  <div
                    className="
                      w-10
                      h-10
                      rounded-lg
                      bg-[#e6ecdf]
                      dark:bg-[#34402f]
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Target
                      size={20}
                      className="
                        text-[#6f8061]
                        dark:text-[#b7c4ad]
                      "
                    />
                  </div>

                  <h2
                    className="
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Performance
                  </h2>
                </div>

                <p
                  className="
                    text-sm
                    text-[#73766b]
                    dark:text-gray-300
                  "
                >
                  You answered{" "}
                  <strong>
                    {score}
                  </strong>{" "}
                  out of{" "}
                  <strong>
                    {totalMarks}
                  </strong>{" "}
                  questions correctly.
                </p>
              </Card>

              <Card
                className="
                  p-6
                  bg-[#fffdf8]
                  dark:bg-gray-900
                  border-[#e4ded2]
                  dark:border-gray-700
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    mb-3
                  "
                >
                  <div
                    className="
                      w-10
                      h-10
                      rounded-lg
                      bg-[#e6ecdf]
                      dark:bg-[#34402f]
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Brain
                      size={20}
                      className="
                        text-[#6f8061]
                        dark:text-[#b7c4ad]
                      "
                    />
                  </div>

                  <h2
                    className="
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Learning Recommendation
                  </h2>
                </div>

                <p
                  className="
                    text-sm
                    text-[#73766b]
                    dark:text-gray-300
                  "
                >
                  {percentage >= 80
                    ? "You have a strong understanding. Your AI Professor can move toward application and advanced examples."
                    : percentage >= 60
                    ? "You have a developing understanding. Your AI Professor should reinforce concepts with examples and practice."
                    : "Some concepts need reinforcement. Your AI Professor should slow down, explain concepts step-by-step, and use simpler examples."}
                </p>
              </Card>
            </div>

            {/* REVIEW */}

            <Card
              className="
                p-6
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  text-[#3e4038]
                  dark:text-gray-100
                  mb-5
                "
              >
                Review Answers
              </h2>

              {resultItems.length === 0 ? (
                <p
                  className="
                    text-center
                    py-8
                    text-[#7d7d72]
                    dark:text-gray-400
                  "
                >
                  No detailed answer review was returned.
                </p>
              ) : (
                <div className="space-y-5">
                  {resultItems.map(
                    (item, index) => (
                      <div
                        key={
                          item.question_id ||
                          index
                        }
                        className="
                          p-4
                          rounded-xl
                          bg-[#faf7f0]
                          dark:bg-gray-800
                          border
                          border-[#e4ded2]
                          dark:border-gray-700
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          {item.is_correct ? (
                            <CheckCircle2
                              size={20}
                              className="
                                mt-0.5
                                text-green-600
                                shrink-0
                              "
                            />
                          ) : (
                            <XCircle
                              size={20}
                              className="
                                mt-0.5
                                text-red-500
                                shrink-0
                              "
                            />
                          )}

                          <div className="flex-1">
                            <p
                              className="
                                font-semibold
                                text-[#3e4038]
                                dark:text-gray-100
                              "
                            >
                              {index + 1}.{" "}
                              {item.question ||
                                `Question ${
                                  index + 1
                                }`}
                            </p>

                            <p
                              className="
                                mt-2
                                text-sm
                                text-[#73766b]
                                dark:text-gray-300
                              "
                            >
                              Your answer:{" "}
                              <span className="font-semibold">
                                {item.selected_answer ||
                                  "Not answered"}
                              </span>
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                text-[#73766b]
                                dark:text-gray-300
                              "
                            >
                              Correct answer:{" "}
                              <span
                                className="
                                  font-semibold
                                  text-green-700
                                  dark:text-green-400
                                "
                              >
                                {item.correct_answer ||
                                  "Not available"}
                              </span>
                            </p>

                            {item.explanation && (
                              <div
                                className="
                                  mt-3
                                  p-3
                                  rounded-lg
                                  bg-[#e6ecdf]
                                  dark:bg-[#34402f]
                                "
                              >
                                <p
                                  className="
                                    text-xs
                                    font-semibold
                                    text-[#5d6e51]
                                    dark:text-[#b7c4ad]
                                    mb-1
                                  "
                                >
                                  Explanation
                                </p>

                                <p
                                  className="
                                    text-sm
                                    text-[#666960]
                                    dark:text-gray-300
                                  "
                                >
                                  {item.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>

            {/* ACTIONS */}

            <div
              className="
                flex
                justify-center
                gap-3
                mt-6
                flex-wrap
              "
            >
              <Button
                variant="secondary"
                onClick={
                  handleRetakeQuiz
                }
              >
                <RotateCcw size={17} />
                Retake Quiz
              </Button>

              <Button
                onClick={() =>
                  navigate("/lectures")
                }
              >
                <ArrowLeft size={17} />
                Back to Lectures
              </Button>

              <Button
                onClick={() =>
                  navigate("/progress")
                }
                className="
                  bg-[#6f8061]
                  hover:bg-[#5d6e51]
                  text-white
                "
              >
                <Target size={17} />
                View Progress
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // QUIZ SETUP
  // ============================================================

  if (!quiz) {
    return (
      <DashboardLayout>
        <div
          className="
            min-h-full
            bg-[#f7f3ea]
            dark:bg-gray-950
            p-6
          "
        >
          <div className="max-w-3xl mx-auto">

            <button
              onClick={() =>
                navigate("/lectures")
              }
              className="
                flex
                items-center
                gap-2
                text-sm
                text-[#6f8061]
                dark:text-[#aeb8a1]
                mb-5
                hover:underline
              "
            >
              <ArrowLeft size={17} />
              Back to Lectures
            </button>

            <Card
              className="
                p-8
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  mb-6
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-[#e6ecdf]
                    dark:bg-[#34402f]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Sparkles
                    className="
                      text-[#6f8061]
                      dark:text-[#aeb8a1]
                    "
                  />
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-[0.2em]
                      font-semibold
                      text-[#c98262]
                    "
                  >
                    AI Quiz
                  </p>

                  <h1
                    className="
                      font-display
                      text-3xl
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Test your understanding
                  </h1>
                </div>
              </div>

              {/* LECTURE INFO */}

              <div
                className="
                  p-5
                  rounded-xl
                  bg-[#faf7f0]
                  dark:bg-gray-800
                  border
                  border-[#e4ded2]
                  dark:border-gray-700
                "
              >
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    font-semibold
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  Lecture
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-semibold
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  {lecture?.title ||
                    lecture?.filename ||
                    lecture?.topic ||
                    "Lecture"}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  {lecture?.topic ||
                    "General lecture quiz"}
                </p>

                {lecture?.subject && (
                  <p
                    className="
                      mt-1
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                    "
                  >
                    Subject:{" "}
                    {lecture.subject}
                  </p>
                )}
              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="
                    mt-4
                    p-3
                    rounded-lg
                    bg-red-50
                    dark:bg-red-900/20
                    border
                    border-red-200
                    dark:border-red-800
                    text-red-700
                    dark:text-red-400
                    text-sm
                  "
                >
                  {error}
                </div>
              )}

              {/* NUMBER OF QUESTIONS */}

              <div className="mt-6">
                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-[#4d5047]
                    dark:text-gray-200
                    mb-2
                  "
                >
                  Number of questions
                </label>

                <Select
                  value={
                    numberOfQuestions
                  }
                  onChange={(event) =>
                    setNumberOfQuestions(
                      event.target.value
                    )
                  }
                  options={[
                    {
                      value: "5",
                      label: "5 questions",
                    },
                    {
                      value: "10",
                      label: "10 questions",
                    },
                    {
                      value: "15",
                      label: "15 questions",
                    },
                    {
                      value: "20",
                      label: "20 questions",
                    },
                  ]}
                />
              </div>

              {/* TEACHING STRATEGY */}

              <div className="mt-6">
                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-[#4d5047]
                    dark:text-gray-200
                    mb-2
                  "
                >
                  Teaching style
                </label>

                <Select
                  value={
                    teachingStrategy
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    console.log(
                      "Teaching style selected:",
                      value
                    );

                    setTeachingStrategy(
                      value
                    );

                    setError("");
                  }}
                  options={[
                    {
                      value: "Simple",
                      label: "Simple",
                    },
                    {
                      value: "Detailed",
                      label: "Detailed",
                    },
                    {
                      value: "Story Based",
                      label: "Story Based",
                    },
                    {
                      value: "Example Based",
                      label: "Example Based",
                    },
                    {
                      value: "Step by Step",
                      label: "Step by Step",
                    },
                    {
                      value: "Diagram Based",
                      label: "Diagram Based",
                    },
                    {
                      value: "Code Based",
                      label: "Code Based",
                    },
                    {
                      value: "Exam Oriented",
                      label: "Exam Oriented",
                    },
                    {
                      value: "Interview Oriented",
                      label: "Interview Oriented",
                    },
                  ]}
                />

                <p
                  className="
                    mt-2
                    text-xs
                    text-[#aaa69c]
                    dark:text-gray-500
                  "
                >
                  Choose how the AI should
                  frame your quiz questions.
                </p>
              </div>

              {/* SELECTED STYLE PREVIEW */}

              <div
                className="
                  mt-4
                  p-4
                  rounded-xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  border
                  border-[#cbd5c2]
                  dark:border-[#4c5b46]
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-[#5d6e51]
                    dark:text-[#b7c4ad]
                  "
                >
                  <Brain size={17} />

                  Selected teaching style:
                </div>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[#666960]
                    dark:text-gray-300
                  "
                >
                  {teachingStrategy}
                </p>
              </div>

              {/* GENERATE BUTTON */}

              <Button
                className="
                  mt-6
                  w-full
                  bg-[#6f8061]
                  hover:bg-[#5d6e51]
                  dark:bg-[#6f8061]
                  dark:hover:bg-[#7f906f]
                  text-white
                "
                onClick={
                  handleGenerateQuiz
                }
                loading={generating}
                disabled={
                  generating ||
                  !lecture
                }
              >
                <Sparkles size={18} />

                {generating
                  ? "Generating Quiz..."
                  : "Generate Quiz"}
              </Button>

              <p
                className="
                  mt-3
                  text-xs
                  text-center
                  text-[#aaa69c]
                  dark:text-gray-500
                "
              >
                Questions are generated from
                your lecture using AI and RAG.
              </p>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // SAFETY CHECK
  // ============================================================

  if (
    !Array.isArray(
      quiz.questions
    ) ||
    quiz.questions.length === 0
  ) {
    return (
      <DashboardLayout>
        <div
          className="
            min-h-full
            bg-[#f7f3ea]
            dark:bg-gray-950
            p-6
          "
        >
          <Card
            className="
              max-w-2xl
              mx-auto
              p-8
              text-center
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >
            <XCircle
              size={48}
              className="
                mx-auto
                mb-4
                text-red-500
              "
            />

            <h1
              className="
                text-2xl
                font-bold
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              Quiz data unavailable
            </h1>

            <p
              className="
                mt-3
                text-[#7d7d72]
                dark:text-gray-400
              "
            >
              No questions were returned by the server.
            </p>

            <Button
              className="mt-6"
              onClick={
                handleRetakeQuiz
              }
            >
              Try Again
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question =
    quiz.questions[
      currentQuestion
    ];

  const selectedAnswer =
    answers[
      question.question_id
    ] || "";

  const isLastQuestion =
    currentQuestion ===
    quiz.questions.length - 1;

  const answeredCount =
    Object.keys(answers).length;

  const questionOptions =
    Array.isArray(question.options)
      ? question.options
      : [];

  const activeTeachingStrategy =
    quiz.teaching_strategy ||
    quiz.teachingStrategy ||
    teachingStrategy;

  // ============================================================
  // QUIZ UI
  // ============================================================

  return (
    <DashboardLayout>
      <div
        className="
          min-h-full
          bg-[#f7f3ea]
          dark:bg-gray-950
          p-6
        "
      >
        <div
          className="
            max-w-4xl
            mx-auto
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              mb-5
              gap-4
            "
          >
            <div>
              <p
                className="
                  text-xs
                  uppercase
                  tracking-[0.2em]
                  font-semibold
                  text-[#c98262]
                "
              >
                AI Quiz
              </p>

              <h1
                className="
                  font-display
                  text-2xl
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                {quiz.topic ||
                  lecture?.topic ||
                  "Lecture Quiz"}
              </h1>

              {/* ACTIVE TEACHING STYLE */}

              <p
                className="
                  mt-1
                  text-xs
                  text-[#85877d]
                  dark:text-gray-400
                "
              >
                Teaching style:{" "}
                <span
                  className="
                    font-semibold
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                >
                  {activeTeachingStrategy}
                </span>
              </p>
            </div>

            <div
              className="
                text-sm
                font-semibold
                text-[#6f8061]
                dark:text-[#aeb8a1]
                whitespace-nowrap
              "
            >
              {answeredCount} /{" "}
              {quiz.questions.length}{" "}
              answered
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="
                mb-5
                p-3
                rounded-lg
                bg-red-50
                dark:bg-red-900/20
                border
                border-red-200
                dark:border-red-800
                text-red-700
                dark:text-red-400
                text-sm
              "
            >
              {error}
            </div>
          )}

          {/* PROGRESS */}

          <div
            className="
              h-2
              bg-[#e4ded2]
              dark:bg-gray-800
              rounded-full
              overflow-hidden
              mb-6
            "
          >
            <div
              className="
                h-full
                bg-[#6f8061]
                transition-all
                duration-300
              "
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    quiz.questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          {/* QUESTION CARD */}

          <Card
            className="
              p-7
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >
            {/* QUESTION HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                mb-5
                gap-3
              "
            >
              <span
                className="
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-semibold
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  text-[#5d6e51]
                  dark:text-[#b7c4ad]
                "
              >
                Question{" "}
                {currentQuestion + 1} /{" "}
                {quiz.questions.length}
              </span>

              <span
                className="
                  text-xs
                  capitalize
                  text-[#85877d]
                  dark:text-gray-400
                "
              >
                {question.difficulty ||
                  "Medium"}
              </span>
            </div>

            {/* QUESTION */}

            <h2
              className="
                text-xl
                md:text-2xl
                font-semibold
                leading-relaxed
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              {question.question ||
                "Question unavailable"}
            </h2>

            {/* OPTIONS */}

            {questionOptions.length > 0 ? (
              <div
                className="
                  mt-7
                  space-y-3
                "
              >
                {questionOptions.map(
                  (option, index) => {
                    const isSelected =
                      selectedAnswer ===
                      option;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          handleAnswer(
                            question.question_id,
                            option
                          )
                        }
                        className={`
                          w-full
                          text-left
                          p-4
                          rounded-xl
                          border
                          transition-all
                          flex
                          items-start
                          gap-3

                          ${
                            isSelected
                              ? `
                                border-[#6f8061]
                                bg-[#e6ecdf]
                                dark:border-[#718064]
                                dark:bg-[#34402f]
                              `
                              : `
                                border-[#e4ded2]
                                bg-[#fffdf8]
                                dark:border-gray-700
                                dark:bg-gray-900
                                hover:bg-[#faf7f0]
                                dark:hover:bg-gray-800
                              `
                          }
                        `}
                      >
                        <span
                          className={`
                            w-8
                            h-8
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            shrink-0
                            text-sm
                            font-semibold

                            ${
                              isSelected
                                ? `
                                  bg-[#6f8061]
                                  text-white
                                `
                                : `
                                  bg-[#faf7f0]
                                  dark:bg-gray-800
                                  text-[#6f8061]
                                  dark:text-[#aeb8a1]
                                `
                            }
                          `}
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span
                          className="
                            pt-1
                            text-sm
                            md:text-base
                            text-[#4d5047]
                            dark:text-gray-200
                          "
                        >
                          {option}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                className="
                  mt-7
                  p-4
                  rounded-xl
                  bg-red-50
                  dark:bg-red-900/20
                  border
                  border-red-200
                  dark:border-red-800
                  text-red-700
                  dark:text-red-400
                "
              >
                This question has no options.
              </div>
            )}

            {/* NAVIGATION */}

            <div
              className="
                mt-8
                pt-5
                border-t
                border-[#e4ded2]
                dark:border-gray-700
                flex
                justify-between
                gap-3
              "
            >
              <Button
                variant="secondary"
                onClick={
                  handlePrevious
                }
                disabled={
                  currentQuestion === 0
                }
              >
                Previous
              </Button>

              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={
                    handleNext
                  }
                  disabled={
                    !selectedAnswer
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    transition-all
                    border

                    bg-[#6f8061]
                    text-white
                    border-[#6f8061]

                    hover:bg-[#5d6e51]
                    hover:border-[#5d6e51]

                    disabled:bg-[#b7c0ae]
                    disabled:text-white
                    disabled:border-[#b7c0ae]
                    disabled:opacity-100
                    disabled:cursor-not-allowed

                    dark:bg-[#718064]
                    dark:text-white
                    dark:border-[#718064]

                    dark:hover:bg-[#829274]

                    dark:disabled:bg-[#4b5546]
                    dark:disabled:text-gray-200
                    dark:disabled:border-[#4b5546]
                  "
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleSubmit
                  }
                  disabled={
                    submitting ||
                    !selectedAnswer
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    transition-all
                    border

                    bg-[#6f8061]
                    text-white
                    border-[#6f8061]

                    hover:bg-[#5d6e51]
                    hover:border-[#5d6e51]

                    disabled:bg-[#b7c0ae]
                    disabled:text-white
                    disabled:border-[#b7c0ae]
                    disabled:opacity-100
                    disabled:cursor-not-allowed

                    dark:bg-[#718064]
                    dark:text-white
                    dark:border-[#718064]

                    dark:hover:bg-[#829274]

                    dark:disabled:bg-[#4b5546]
                    dark:disabled:text-gray-200
                    dark:disabled:border-[#4b5546]
                  "
                >
                  <Send size={17} />

                  {submitting
                    ? "Submitting..."
                    : "Submit Quiz"}
                </button>
              )}
            </div>
          </Card>

          {/* QUESTION NAVIGATOR */}

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
              justify-center
            "
          >
            {quiz.questions.map(
              (item, index) => {
                const answered =
                  Boolean(
                    answers[
                      item.question_id
                    ]
                  );

                return (
                  <button
                    key={
                      item.question_id ||
                      index
                    }
                    type="button"
                    onClick={() =>
                      setCurrentQuestion(
                        index
                      )
                    }
                    className={`
                      w-9
                      h-9
                      rounded-lg
                      text-xs
                      font-semibold
                      border
                      transition-all

                      ${
                        index ===
                        currentQuestion
                          ? `
                            bg-[#6f8061]
                            text-white
                            border-[#6f8061]
                          `
                          : answered
                          ? `
                            bg-[#e6ecdf]
                            text-[#5d6e51]
                            border-[#aeb8a1]
                            dark:bg-[#34402f]
                            dark:text-[#b7c4ad]
                            dark:border-[#718064]
                          `
                          : `
                            bg-[#fffdf8]
                            text-[#85877d]
                            border-[#e4ded2]
                            dark:bg-gray-900
                            dark:border-gray-700
                            dark:text-gray-400
                          `
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}