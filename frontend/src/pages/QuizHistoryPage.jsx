import React, { useEffect, useState } from "react";

import {
  CalendarDays,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  Card,
  Button,
  Loading,
} from "../components/UI";

import { DashboardLayout } from "../components/Layout";

import quizService from "../services/quizService";

// ============================================================
// QUIZ HISTORY PAGE
// ============================================================

export default function QuizHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    setLoading(true);
    setError("");

    try {
      if (
        !quizService ||
        typeof quizService.getQuizHistory !== "function"
      ) {
        throw new Error(
          "getQuizHistory() is not available in quizService.js"
        );
      }

      const response =
        await quizService.getQuizHistory();

      console.log(
        "QUIZ HISTORY RESPONSE:",
        response
      );

      if (!response) {
        throw new Error(
          "No response received from quiz history API."
        );
      }

      if (response.success === false) {
        throw new Error(
          response.error ||
            "Could not load quiz history."
        );
      }

      /*
       * Support multiple possible backend formats:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * OR
       *
       * [...]
       *
       * OR
       *
       * {
       *   data: [...]
       * }
       */

      let historyData = [];

      if (Array.isArray(response)) {
        historyData = response;
      } else if (
        Array.isArray(response.data)
      ) {
        historyData = response.data;
      } else if (
        Array.isArray(response?.data?.items)
      ) {
        historyData = response.data.items;
      } else if (
        Array.isArray(response?.results)
      ) {
        historyData = response.results;
      }

      setHistory(historyData);
    } catch (err) {
      console.error(
        "Failed to load quiz history:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load quiz history."
      );

      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getQuizId = (item) => {
    return (
      item?.quiz_id ||
      item?.attempt_id ||
      item?.quiz_attempt_id ||
      item?.id ||
      null
    );
  };

  const getTitle = (item) => {
    return (
      item?.lecture_title ||
      item?.lecture_name ||
      item?.lecture?.title ||
      item?.title ||
      item?.topic ||
      "Quiz"
    );
  };

  const getTopic = (item) => {
    return (
      item?.topic ||
      item?.lecture_topic ||
      item?.lecture?.topic ||
      "General Quiz"
    );
  };

  const getScore = (item) => {
    return Number(
      item?.score ??
        item?.correct_answers ??
        item?.correct_count ??
        0
    );
  };

  const getTotalMarks = (item) => {
    return Number(
      item?.total_marks ??
        item?.total_questions ??
        item?.number_of_questions ??
        item?.questions_count ??
        0
    );
  };

  const getPercentage = (item) => {
    if (
      item?.percentage !== undefined &&
      item?.percentage !== null
    ) {
      return Number(item.percentage);
    }

    const score = getScore(item);
    const total = getTotalMarks(item);

    if (!total) {
      return 0;
    }

    return Math.round(
      (score / total) * 100
    );
  };

  const isPassed = (item) => {
    if (
      item?.passed !== undefined &&
      item?.passed !== null
    ) {
      return Boolean(item.passed);
    }

    return getPercentage(item) >= 50;
  };

  const getDate = (item) => {
    const rawDate =
      item?.created_at ||
      item?.attempted_at ||
      item?.completed_at ||
      item?.submitted_at ||
      item?.date;

    if (!rawDate) {
      return "Date unavailable";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return String(rawDate);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getTime = (item) => {
    const rawDate =
      item?.created_at ||
      item?.attempted_at ||
      item?.completed_at ||
      item?.submitted_at ||
      item?.date;

    if (!rawDate) {
      return "";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getPerformanceLabel = (
    percentage
  ) => {
    if (percentage >= 85) {
      return "Excellent";
    }

    if (percentage >= 70) {
      return "Good";
    }

    if (percentage >= 50) {
      return "Developing";
    }

    return "Needs Improvement";
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div
          className="
            min-h-full
            bg-[#f7f3ea]
            dark:bg-gray-950
            flex
            items-center
            justify-center
            p-6
          "
        >
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

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
            max-w-5xl
            mx-auto
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              mb-7
              flex-wrap
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
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
                <ClipboardList
                  size={24}
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
                  Assessment
                </p>

                <h1
                  className="
                    font-display
                    text-3xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Quiz History
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[#7d7d72]
                    dark:text-gray-400
                  "
                >
                  Review your previous quiz
                  attempts and performance.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={loadQuizHistory}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </Button>
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <Card
              className="
                mb-6
                p-5
                bg-red-50
                dark:bg-red-900/20
                border-red-200
                dark:border-red-800
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <XCircle
                  size={22}
                  className="
                    text-red-500
                    shrink-0
                  "
                />

                <div>
                  <p
                    className="
                      font-semibold
                      text-red-700
                      dark:text-red-400
                    "
                  >
                    Could not load quiz history
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-red-600
                      dark:text-red-400
                    "
                  >
                    {error}
                  </p>
                </div>
              </div>

              <Button
                className="mt-4"
                onClick={loadQuizHistory}
              >
                <RefreshCw size={16} />
                Try Again
              </Button>
            </Card>
          )}

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {!error && history.length === 0 && (
            <Card
              className="
                p-10
                text-center
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-2xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  flex
                  items-center
                  justify-center
                "
              >
                <ClipboardList
                  size={30}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              <h2
                className="
                  mt-5
                  text-xl
                  font-bold
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                No quiz attempts yet
              </h2>

              <p
                className="
                  mt-2
                  max-w-md
                  mx-auto
                  text-sm
                  text-[#7d7d72]
                  dark:text-gray-400
                "
              >
                Complete a quiz from one of your
                lectures and your results will
                appear here.
              </p>

              <Button
                className="mt-6"
                onClick={() =>
                  navigate("/lectures")
                }
              >
                Browse Lectures
              </Button>
            </Card>
          )}

          {/* ==================================================
              HISTORY
          ================================================== */}

          {!error &&
            history.length > 0 && (
              <div className="space-y-4">
                {history.map(
                  (item, index) => {
                    const percentage =
                      getPercentage(item);

                    const score =
                      getScore(item);

                    const totalMarks =
                      getTotalMarks(item);

                    const passed =
                      isPassed(item);

                    const quizId =
                      getQuizId(item);

                    return (
                      <Card
                        key={
                          quizId || index
                        }
                        className="
                          p-5
                          bg-[#fffdf8]
                          dark:bg-gray-900
                          border-[#e4ded2]
                          dark:border-gray-700
                          transition-all
                          hover:shadow-md
                        "
                      >
                        {/* TOP */}

                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-5
                            flex-wrap
                          "
                        >
                          {/* LEFT */}

                          <div
                            className="
                              flex
                              items-start
                              gap-4
                              min-w-0
                              flex-1
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
                                shrink-0
                              "
                            >
                              <Trophy
                                size={21}
                                className="
                                  text-[#6f8061]
                                  dark:text-[#aeb8a1]
                                "
                              />
                            </div>

                            <div className="min-w-0">
                              <h2
                                className="
                                  text-lg
                                  font-bold
                                  text-[#3e4038]
                                  dark:text-gray-100
                                  break-words
                                "
                              >
                                {getTitle(item)}
                              </h2>

                              <p
                                className="
                                  mt-1
                                  text-sm
                                  text-[#73766b]
                                  dark:text-gray-300
                                "
                              >
                                {getTopic(item)}
                              </p>

                              <div
                                className="
                                  mt-3
                                  flex
                                  items-center
                                  gap-4
                                  flex-wrap
                                  text-xs
                                  text-[#85877d]
                                  dark:text-gray-400
                                "
                              >
                                <span
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                  "
                                >
                                  <CalendarDays
                                    size={14}
                                  />

                                  {getDate(item)}

                                  {getTime(item) && (
                                    <>
                                      {" "}
                                      •{" "}
                                      {getTime(item)}
                                    </>
                                  )}
                                </span>

                                <span
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                  "
                                >
                                  <Target
                                    size={14}
                                  />

                                  {score} /{" "}
                                  {totalMarks}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT */}

                          <div
                            className="
                              flex
                              items-center
                              gap-5
                              shrink-0
                            "
                          >
                            <div className="text-right">
                              <p
                                className="
                                  text-2xl
                                  font-bold
                                  text-[#3e4038]
                                  dark:text-gray-100
                                "
                              >
                                {percentage}%
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-[#85877d]
                                  dark:text-gray-400
                                "
                              >
                                {getPerformanceLabel(
                                  percentage
                                )}
                              </p>
                            </div>

                            <div
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                px-3
                                py-1.5
                                rounded-full
                                text-xs
                                font-semibold

                                ${
                                  passed
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
                                }
                              `}
                            >
                              {passed ? (
                                <CheckCircle2
                                  size={14}
                                />
                              ) : (
                                <XCircle
                                  size={14}
                                />
                              )}

                              {passed
                                ? "Passed"
                                : "Needs Improvement"}
                            </div>
                          </div>
                        </div>

                        {/* PROGRESS */}

                        <div
                          className="
                            mt-5
                            h-2
                            rounded-full
                            overflow-hidden
                            bg-[#e4ded2]
                            dark:bg-gray-800
                          "
                        >
                          <div
                            className="
                              h-full
                              bg-[#6f8061]
                              transition-all
                            "
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  percentage,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        {/* FOOTER */}

                        <div
                          className="
                            mt-4
                            pt-4
                            border-t
                            border-[#e4ded2]
                            dark:border-gray-700
                            flex
                            items-center
                            justify-between
                            gap-3
                            flex-wrap
                          "
                        >
                          <p
                            className="
                              text-xs
                              text-[#85877d]
                              dark:text-gray-400
                            "
                          >
                            Quiz attempt #
                            {history.length -
                              index}
                          </p>

                          {quizId && (
                            <Button
                              variant="secondary"
                              onClick={() =>
                                navigate(
                                  `/quiz/result/${quizId}`
                                )
                              }
                            >
                              View Result
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  }
                )}
              </div>
            )}

          {/* ==================================================
              BACK
          ================================================== */}

          <div
            className="
              mt-7
              flex
              justify-center
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate("/lectures")
              }
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#6f8061]
                dark:text-[#aeb8a1]
                hover:underline
              "
            >
              <ArrowLeft size={17} />
              Back to Lectures
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}