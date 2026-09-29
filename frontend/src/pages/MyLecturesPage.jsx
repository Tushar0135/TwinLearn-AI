import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/Layout";

import lectureService from "../services/lectureService";
import quizService from "../services/quizService";

import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Loading,
  Modal,
  Alert,
} from "../components/UI";

import {
  Trash2,
  Play,
  MessageSquare,
  Search,
  Filter,
  ClipboardCheck,
  Trophy,
  CheckCircle2,
  XCircle,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { formatDate } from "../utils/helpers";

// ============================================================
// MY LECTURES PAGE
// ============================================================

export default function MyLecturesPage() {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [lectures, setLectures] = useState([]);

  const [filteredLectures, setFilteredLectures] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [filterDifficulty, setFilterDifficulty] = useState("");

  const [filterStatus, setFilterStatus] = useState("");

  const [quizHistory, setQuizHistory] = useState({});

  const [quizLoading, setQuizLoading] = useState({});

  const [expandedQuizzes, setExpandedQuizzes] = useState({});

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    lectureId: null,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // LOAD LECTURES
  // ============================================================

  useEffect(() => {
    loadLectures();
  }, []);

  // ============================================================
  // APPLY FILTERS
  // ============================================================

  useEffect(() => {
    applyFilters();
  }, [
    lectures,
    searchQuery,
    filterDifficulty,
    filterStatus,
  ]);

  // ============================================================
  // LOAD LECTURES
  // ============================================================

  const loadLectures = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await lectureService.getLectures();

      console.log("========================================");
      console.log("MY LECTURES RESPONSE:");
      console.log(result);
      console.log("========================================");

      if (
        result?.success &&
        Array.isArray(result.data)
      ) {
        setLectures(result.data);

        await loadAllQuizHistories(result.data);
      } else {
        setLectures([]);

        setErrorMessage(
          result?.error ||
            "Unable to load lectures."
        );
      }
    } catch (error) {
      console.error(
        "Failed to load lectures:",
        error
      );

      setLectures([]);

      setErrorMessage(
        error?.message ||
          "Failed to load lectures."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GET LECTURE ID
  // ============================================================

  const getLectureId = (lecture) => {
    return (
      lecture?.lecture_id ||
      lecture?.id ||
      lecture?.uuid ||
      null
    );
  };

  // ============================================================
  // LOAD QUIZ HISTORY FOR ALL LECTURES
  // ============================================================

  const loadAllQuizHistories = async (lectureList) => {
    const historyMap = {};

    for (const lecture of lectureList) {
      const lectureId = getLectureId(lecture);

      if (!lectureId) {
        continue;
      }

      try {
        setQuizLoading((previous) => ({
          ...previous,
          [lectureId]: true,
        }));

        const result =
          await quizService.getQuizHistory(
            lectureId
          );

        console.log(
          `QUIZ HISTORY FOR ${lectureId}:`,
          result
        );

        if (
          result?.success &&
          Array.isArray(result.data)
        ) {
          historyMap[String(lectureId)] =
            result.data;
        } else {
          historyMap[String(lectureId)] = [];
        }
      } catch (error) {
        console.error(
          `Failed to load quiz history for lecture ${lectureId}:`,
          error
        );

        historyMap[String(lectureId)] = [];
      } finally {
        setQuizLoading((previous) => ({
          ...previous,
          [lectureId]: false,
        }));
      }
    }

    setQuizHistory(historyMap);
  };

  // ============================================================
  // LOAD QUIZ HISTORY FOR ONE LECTURE
  // ============================================================

  const loadQuizHistoryForLecture = async (
    lectureId
  ) => {
    if (!lectureId) {
      return;
    }

    setQuizLoading((previous) => ({
      ...previous,
      [lectureId]: true,
    }));

    try {
      const result =
        await quizService.getQuizHistory(
          lectureId
        );

      console.log(
        "REFRESHED QUIZ HISTORY:",
        result
      );

      if (
        result?.success &&
        Array.isArray(result.data)
      ) {
        setQuizHistory((previous) => ({
          ...previous,
          [String(lectureId)]:
            result.data,
        }));
      } else {
        setQuizHistory((previous) => ({
          ...previous,
          [String(lectureId)]: [],
        }));
      }
    } catch (error) {
      console.error(
        "Failed to refresh quiz history:",
        error
      );
    } finally {
      setQuizLoading((previous) => ({
        ...previous,
        [lectureId]: false,
      }));
    }
  };

  // ============================================================
  // FILTERS
  // ============================================================

  const applyFilters = () => {
    let filtered = [...lectures];

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    if (searchQuery.trim()) {
      const query = searchQuery
        .toLowerCase()
        .trim();

      filtered = filtered.filter((lecture) => {
        const title =
          lecture?.title ||
          lecture?.filename ||
          "";

        const topic =
          lecture?.topic || "";

        const subject =
          lecture?.subject || "";

        return (
          title
            .toLowerCase()
            .includes(query) ||
          topic
            .toLowerCase()
            .includes(query) ||
          subject
            .toLowerCase()
            .includes(query)
        );
      });
    }

    // ----------------------------------------------------------
    // DIFFICULTY
    // ----------------------------------------------------------

    if (filterDifficulty) {
      filtered = filtered.filter(
        (lecture) =>
          lecture?.difficulty ===
          filterDifficulty
      );
    }

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (filterStatus) {
      filtered = filtered.filter(
        (lecture) =>
          lecture?.status ===
          filterStatus
      );
    }

    setFilteredLectures(filtered);
  };

  // ============================================================
  // CONTINUE LEARNING
  // ============================================================

  const handleContinueLearning = (
    lecture
  ) => {
    const lectureId =
      getLectureId(lecture);

    console.log(
      "CONTINUE LEARNING:",
      {
        lecture,
        lectureId,
      }
    );

    if (!lectureId) {
      setErrorMessage(
        "Lecture ID is missing."
      );

      return;
    }

    navigate(
      `/ai-professor/${lectureId}`
    );
  };

  // ============================================================
  // ASK AI
  // ============================================================

  const handleAskAI = (lecture) => {
    const lectureId =
      getLectureId(lecture);

    console.log(
      "ASK AI:",
      {
        lecture,
        lectureId,
      }
    );

    if (!lectureId) {
      setErrorMessage(
        "Lecture ID is missing."
      );

      return;
    }

    navigate(
      `/ai-professor/${lectureId}`
    );
  };

  // ============================================================
  // TAKE QUIZ
  // ============================================================

  const handleTakeQuiz = (lecture) => {
    const lectureId =
      getLectureId(lecture);

    console.log(
      "TAKE QUIZ:",
      {
        lecture,
        lectureId,
      }
    );

    if (!lectureId) {
      setErrorMessage(
        "Lecture ID is missing."
      );

      return;
    }

    navigate(
      `/quiz/setup/${lectureId}`
    );
  };

  // ============================================================
  // TOGGLE QUIZ LIST
  // ============================================================

  const toggleQuizList = (
    lectureId
  ) => {
    setExpandedQuizzes(
      (previous) => ({
        ...previous,
        [String(lectureId)]:
          !previous[String(lectureId)],
      })
    );
  };

  // ============================================================
  // GET QUIZZES FOR LECTURE
  // ============================================================

  const getQuizzesForLecture = (
    lectureId
  ) => {
    if (!lectureId) {
      return [];
    }

    return (
      quizHistory[String(lectureId)] ||
      []
    );
  };

  // ============================================================
  // GET QUIZ SCORE
  // ============================================================

  const getQuizScore = (quiz) => {
    return Number(
      quiz?.score ??
        quiz?.correct_answers ??
        0
    );
  };

  // ============================================================
  // GET QUIZ TOTAL
  // ============================================================

  const getQuizTotal = (quiz) => {
    return Number(
      quiz?.total_marks ??
        quiz?.total_questions ??
        quiz?.number_of_questions ??
        0
    );
  };

  // ============================================================
  // GET QUIZ PERCENTAGE
  // ============================================================

  const getQuizPercentage = (
    quiz
  ) => {
    if (
      quiz?.percentage !== undefined &&
      quiz?.percentage !== null
    ) {
      return Math.min(
        Math.max(
          Number(quiz.percentage),
          0
        ),
        100
      );
    }

    const score =
      getQuizScore(quiz);

    const total =
      getQuizTotal(quiz);

    if (!total) {
      return 0;
    }

    return Math.round(
      (score / total) * 100
    );
  };

  // ============================================================
  // GET QUIZ DATE
  // ============================================================

  const getQuizDate = (quiz) => {
    const rawDate =
      quiz?.created_at ||
      quiz?.attempted_at ||
      quiz?.completed_at ||
      quiz?.submitted_at ||
      quiz?.date;

    if (!rawDate) {
      return "Date unavailable";
    }

    const date =
      new Date(rawDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

  // ============================================================
  // GET QUIZ PASS STATUS
  // ============================================================

  const isQuizPassed = (quiz) => {
    if (
      quiz?.passed !== undefined &&
      quiz?.passed !== null
    ) {
      return Boolean(
        quiz.passed
      );
    }

    return (
      getQuizPercentage(quiz) >=
      50
    );
  };

  // ============================================================
  // GET LECTURE PROGRESS
  // ============================================================

  const getLectureProgress = (
    lecture
  ) => {
    const lectureId =
      getLectureId(lecture);

    const quizzes =
      getQuizzesForLecture(
        lectureId
      );

    // ----------------------------------------------------------
    // IF QUIZZES EXIST
    // ----------------------------------------------------------

    if (quizzes.length > 0) {
      /*
       * We calculate learning progress
       * from the BEST quiz score.
       *
       * Example:
       *
       * Quiz 1 = 40%
       * Quiz 2 = 70%
       * Quiz 3 = 90%
       *
       * Progress = 90%
       */

      const percentages =
        quizzes.map(
          getQuizPercentage
        );

      const bestScore =
        Math.max(
          ...percentages,
          0
        );

      return Math.min(
        Math.max(
          Math.round(bestScore),
          0
        ),
        100
      );
    }

    // ----------------------------------------------------------
    // FALLBACK TO BACKEND PROGRESS
    // ----------------------------------------------------------

    const backendProgress =
      Number(
        lecture?.progress ??
          lecture?.completion_percentage ??
          lecture?.completionPercentage ??
          0
      );

    return Math.min(
      Math.max(
        backendProgress,
        0
      ),
      100
    );
  };

  // ============================================================
  // GET LECTURE STATUS
  // ============================================================

  const getLectureDisplayStatus = (
    lecture
  ) => {
    const progress =
      getLectureProgress(
        lecture
      );

    const quizzes =
      getQuizzesForLecture(
        getLectureId(lecture)
      );

    if (progress >= 100) {
      return "Completed";
    }

    if (
      progress > 0 ||
      quizzes.length > 0
    ) {
      return "In Progress";
    }

    return (
      lecture?.status ||
      "Not Started"
    );
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getStatusBadgeVariant = (
    status
  ) => {
    switch (status) {
      case "Completed":
        return "success";

      case "In Progress":
        return "warning";

      default:
        return "gray";
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async () => {
    if (!deleteModal.lectureId) {
      return;
    }

    setDeleteLoading(true);
    setErrorMessage("");

    try {
      const result =
        await lectureService.deleteLecture(
          deleteModal.lectureId
        );

      if (result?.success) {
        setLectures(
          (previous) =>
            previous.filter(
              (lecture) =>
                String(
                  getLectureId(lecture)
                ) !==
                String(
                  deleteModal.lectureId
                )
            )
        );

        setQuizHistory(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              String(
                deleteModal.lectureId
              )
            ];

            return next;
          }
        );

        setSuccessMessage(
          "Lecture deleted successfully."
        );

        setDeleteModal({
          open: false,
          lectureId: null,
        });

        setTimeout(
          () =>
            setSuccessMessage(""),
          3000
        );
      } else {
        setErrorMessage(
          result?.error ||
            "Failed to delete lecture."
        );
      }
    } catch (error) {
      console.error(
        "Delete lecture failed:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Failed to delete lecture."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

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
          "
        >
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <DashboardLayout>
      <div
        className="
          min-h-full
          bg-[#f7f3ea]
          dark:bg-gray-950
          transition-colors
          duration-300
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-8
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8">
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                flex-wrap
              "
            >
              <div>
                <h1
                  className="
                    font-display
                    text-4xl
                    md:text-5xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  My Lectures
                </h1>

                <p
                  className="
                    mt-3
                    max-w-2xl
                    text-[#7d7d72]
                    dark:text-gray-400
                    text-base
                    md:text-lg
                  "
                >
                  Manage your lectures, continue
                  learning, ask your AI Professor,
                  or test your knowledge.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={loadLectures}
                disabled={loading}
              >
                <RefreshCw size={17} />
                Refresh
              </Button>
            </div>
          </div>

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {successMessage && (
            <div className="mb-6">
              <Alert
                variant="success"
                message={successMessage}
                onClose={() =>
                  setSuccessMessage("")
                }
              />
            </div>
          )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {errorMessage && (
            <div
              className="
                mb-6
                p-4
                rounded-xl
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
              {errorMessage}
            </div>
          )}

          {/* ==================================================
              SEARCH / FILTERS
          ================================================== */}

          <Card
            className="
              p-4
              mb-6
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-800
              shadow-sm
              dark:shadow-none
            "
          >
            <div
              className="
                grid
                md:grid-cols-4
                gap-4
              "
            >
              <Input
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                icon={Search}
              />

              <Select
                options={[
                  {
                    value: "",
                    label: "All Difficulties",
                  },
                  {
                    value: "Beginner",
                    label: "Beginner",
                  },
                  {
                    value: "Intermediate",
                    label: "Intermediate",
                  },
                  {
                    value: "Advanced",
                    label: "Advanced",
                  },
                ]}
                value={filterDifficulty}
                onChange={(e) =>
                  setFilterDifficulty(
                    e.target.value
                  )
                }
              />

              <Select
                options={[
                  {
                    value: "",
                    label: "All Status",
                  },
                  {
                    value: "Not Started",
                    label: "Not Started",
                  },
                  {
                    value: "In Progress",
                    label: "In Progress",
                  },
                  {
                    value: "Completed",
                    label: "Completed",
                  },
                ]}
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value
                  )
                }
              />

              <Button
                variant="secondary"
                className="
                  w-full
                  justify-center
                  border-[#d8d1c4]
                  dark:border-gray-700
                "
              >
                <Filter size={18} />
                More Filters
              </Button>
            </div>
          </Card>

          {/* ==================================================
              EMPTY
          ================================================== */}

          {filteredLectures.length === 0 ? (
            <Card
              className="
                text-center
                py-12
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-800
              "
            >
              <p
                className="
                  text-[#7d7d72]
                  dark:text-gray-400
                  mb-4
                "
              >
                {lectures.length === 0
                  ? "You have no lectures yet."
                  : "No lectures match your filters."}
              </p>

              <Button
                variant="primary"
                onClick={() =>
                  navigate("/upload")
                }
                className="
                  bg-[#6f8061]
                  hover:bg-[#5d6e51]
                  dark:bg-[#6f8061]
                  dark:hover:bg-[#7f906f]
                  text-[#fffdf8]
                "
              >
                Upload Lecture
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5">
              {filteredLectures.map(
                (lecture) => {
                  const lectureId =
                    getLectureId(
                      lecture
                    );

                  const quizzes =
                    getQuizzesForLecture(
                      lectureId
                    );

                  const progress =
                    getLectureProgress(
                      lecture
                    );

                  const displayStatus =
                    getLectureDisplayStatus(
                      lecture
                    );

                  const isExpanded =
                    Boolean(
                      expandedQuizzes[
                        String(lectureId)
                      ]
                    );

                  const isQuizLoading =
                    Boolean(
                      quizLoading[
                        String(lectureId)
                      ]
                    );

                  return (
                    <Card
                      key={
                        lectureId ||
                        `lecture-${
                          lecture?.title ||
                          "unknown"
                        }`
                      }
                      className="
                        overflow-hidden
                        bg-[#fffdf8]
                        dark:bg-gray-900
                        border-[#e4ded2]
                        dark:border-gray-800
                        shadow-sm
                        dark:shadow-none
                        hover:shadow-md
                        transition-all
                      "
                    >
                      {/* ==================================================
                          LECTURE
                      ================================================== */}

                      <div className="p-6">
                        <div
                          className="
                            flex
                            flex-col
                            lg:flex-row
                            lg:items-start
                            lg:justify-between
                            gap-5
                          "
                        >
                          {/* ==================================================
                              LECTURE INFO
                          ================================================== */}

                          <div
                            className="
                              flex-1
                              min-w-0
                            "
                          >
                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-3
                                mb-2
                              "
                            >
                              <h3
                                className="
                                  text-lg
                                  font-semibold
                                  text-[#3e4038]
                                  dark:text-gray-100
                                "
                              >
                                {lecture?.title ||
                                  lecture?.filename ||
                                  "Untitled Lecture"}
                              </h3>

                              <Badge
                                variant={getStatusBadgeVariant(
                                  displayStatus
                                )}
                              >
                                {displayStatus}
                              </Badge>
                            </div>

                            {/* LECTURE DETAILS */}

                            <div
                              className="
                                grid
                                grid-cols-2
                                md:grid-cols-4
                                gap-3
                                mb-5
                                text-sm
                              "
                            >
                              <div>
                                <p
                                  className="
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Subject
                                </p>

                                <p
                                  className="
                                    font-medium
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {lecture?.subject ||
                                    "—"}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Topic
                                </p>

                                <p
                                  className="
                                    font-medium
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {lecture?.topic ||
                                    "—"}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Difficulty
                                </p>

                                <p
                                  className="
                                    font-medium
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {lecture?.difficulty ||
                                    "—"}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Duration
                                </p>

                                <p
                                  className="
                                    font-medium
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {lecture?.duration ||
                                    "—"}
                                </p>
                              </div>
                            </div>

                            {/* ==================================================
                                PROGRESS
                            ================================================== */}

                            <div className="mb-4">
                              <div
                                className="
                                  flex
                                  items-center
                                  justify-between
                                  mb-2
                                "
                              >
                                <span
                                  className="
                                    text-sm
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Learning Progress
                                </span>

                                <span
                                  className="
                                    text-sm
                                    font-semibold
                                    text-[#4d5047]
                                    dark:text-gray-200
                                  "
                                >
                                  {progress}%
                                </span>
                              </div>

                              <div
                                className="
                                  w-full
                                  bg-[#eee9df]
                                  dark:bg-gray-800
                                  rounded-full
                                  h-2.5
                                  overflow-hidden
                                "
                              >
                                <div
                                  className="
                                    bg-[#6f8061]
                                    h-full
                                    rounded-full
                                    transition-all
                                    duration-700
                                  "
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>

                              {quizzes.length > 0 && (
                                <p
                                  className="
                                    mt-2
                                    text-xs
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  Based on your best
                                  quiz score
                                </p>
                              )}
                            </div>

                            {/* DATE */}

                            <p
                              className="
                                text-sm
                                text-[#85877d]
                                dark:text-gray-400
                              "
                            >
                              {lecture?.uploadedAt
                                ? `Uploaded ${formatDate(
                                    lecture.uploadedAt
                                  )}`
                                : "Uploaded recently"}

                              {lecture?.lastAccessed && (
                                <>
                                  {" • "}
                                  Last accessed{" "}
                                  {formatDate(
                                    lecture.lastAccessed
                                  )}
                                </>
                              )}
                            </p>

                            {/* DEBUG ID */}

                            <p
                              className="
                                text-xs
                                text-[#aaa69c]
                                dark:text-gray-600
                                mt-2
                                font-mono
                                break-all
                              "
                            >
                              Lecture ID:{" "}
                              {lectureId ||
                                "Missing"}
                            </p>
                          </div>

                          {/* ==================================================
                              ACTIONS
                          ================================================== */}

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                              shrink-0
                            "
                          >
                            {/* TAKE QUIZ */}

                            <Button
                              variant="primary"
                              size="sm"
                              title="Take Quiz"
                              onClick={() =>
                                handleTakeQuiz(
                                  lecture
                                )
                              }
                              disabled={!lectureId}
                              className="
                                bg-[#6f8061]
                                hover:bg-[#5d6e51]
                                dark:bg-[#6f8061]
                                dark:hover:bg-[#7f906f]
                                text-[#fffdf8]
                                border-0
                                shadow-sm
                              "
                            >
                              <ClipboardCheck
                                size={17}
                              />

                              Take Quiz
                            </Button>

                            {/* CONTINUE */}

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Continue Learning"
                              onClick={() =>
                                handleContinueLearning(
                                  lecture
                                )
                              }
                              disabled={!lectureId}
                            >
                              <Play size={18} />
                            </Button>

                            {/* ASK AI */}

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Ask AI"
                              onClick={() =>
                                handleAskAI(
                                  lecture
                                )
                              }
                              disabled={!lectureId}
                            >
                              <MessageSquare
                                size={18}
                              />
                            </Button>

                            {/* DELETE */}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  lectureId,
                                })
                              }
                              title="Delete"
                              disabled={!lectureId}
                              className="
                                text-red-600
                                hover:bg-red-50
                                dark:hover:bg-red-900
                              "
                            >
                              <Trash2
                                size={18}
                              />
                            </Button>
                          </div>
                        </div>

                        {/* ==================================================
                            QUIZ SECTION BUTTON
                        ================================================== */}

                        <div
                          className="
                            mt-5
                            pt-4
                            border-t
                            border-[#e4ded2]
                            dark:border-gray-800
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleQuizList(
                                lectureId
                              )
                            }
                            className="
                              w-full
                              flex
                              items-center
                              justify-between
                              text-left
                              group
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
                                  w-9
                                  h-9
                                  rounded-lg
                                  bg-[#e6ecdf]
                                  dark:bg-[#34402f]
                                  flex
                                  items-center
                                  justify-center
                                "
                              >
                                <Trophy
                                  size={18}
                                  className="
                                    text-[#6f8061]
                                    dark:text-[#aeb8a1]
                                  "
                                />
                              </div>

                              <div>
                                <p
                                  className="
                                    font-semibold
                                    text-[#3e4038]
                                    dark:text-gray-100
                                  "
                                >
                                  Quizzes
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-[#85877d]
                                    dark:text-gray-400
                                  "
                                >
                                  {quizzes.length ===
                                  0
                                    ? "No quiz attempts yet"
                                    : `${
                                        quizzes.length
                                      } quiz ${
                                        quizzes.length ===
                                        1
                                          ? "attempt"
                                          : "attempts"
                                      }`}
                                </p>
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp
                                size={20}
                                className="
                                  text-[#6f8061]
                                "
                              />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="
                                  text-[#6f8061]
                                "
                              />
                            )}
                          </button>

                          {/* ==================================================
                              QUIZ LIST
                          ================================================== */}

                          {isExpanded && (
                            <div className="mt-4">
                              {isQuizLoading ? (
                                <div
                                  className="
                                    py-6
                                    flex
                                    justify-center
                                  "
                                >
                                  <Loading />
                                </div>
                              ) : quizzes.length ===
                                0 ? (
                                <div
                                  className="
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-[#d8d1c4]
                                    dark:border-gray-700
                                    p-6
                                    text-center
                                  "
                                >
                                  <ClipboardCheck
                                    size={28}
                                    className="
                                      mx-auto
                                      text-[#9a9b91]
                                    "
                                  />

                                  <p
                                    className="
                                      mt-3
                                      text-sm
                                      font-medium
                                      text-[#4d5047]
                                      dark:text-gray-200
                                    "
                                  >
                                    No quiz attempts yet
                                  </p>

                                  <p
                                    className="
                                      mt-1
                                      text-xs
                                      text-[#85877d]
                                      dark:text-gray-400
                                    "
                                  >
                                    Take a quiz to see
                                    your results here.
                                  </p>

                                  <Button
                                    size="sm"
                                    className="
                                      mt-4
                                      bg-[#6f8061]
                                      hover:bg-[#5d6e51]
                                      text-white
                                    "
                                    onClick={() =>
                                      handleTakeQuiz(
                                        lecture
                                      )
                                    }
                                  >
                                    <ClipboardCheck
                                      size={16}
                                    />

                                    Take Quiz
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="
                                    space-y-3
                                  "
                                >
                                  {quizzes.map(
                                    (
                                      quiz,
                                      quizIndex
                                    ) => {
                                      const percentage =
                                        getQuizPercentage(
                                          quiz
                                        );

                                      const score =
                                        getQuizScore(
                                          quiz
                                        );

                                      const total =
                                        getQuizTotal(
                                          quiz
                                        );

                                      const passed =
                                        isQuizPassed(
                                          quiz
                                        );

                                      // Keep quizId because it
                                      // is used as the React key.
                                      const quizId =
                                        quiz?.quiz_id ||
                                        quiz?.attempt_id ||
                                        quiz?.id;

                                      return (
                                        <div
                                          key={
                                            quizId ||
                                            `${lectureId}-quiz-${quizIndex}`
                                          }
                                          className="
                                            rounded-xl
                                            border
                                            border-[#e4ded2]
                                            dark:border-gray-700
                                            bg-[#faf8f2]
                                            dark:bg-gray-950
                                            p-4
                                          "
                                        >
                                          <div
                                            className="
                                              flex
                                              items-center
                                              justify-between
                                              gap-4
                                              flex-wrap
                                            "
                                          >
                                            {/* QUIZ INFO */}

                                            <div
                                              className="
                                                flex
                                                items-center
                                                gap-3
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
                                                <ClipboardCheck
                                                  size={
                                                    18
                                                  }
                                                  className="
                                                    text-[#6f8061]
                                                  "
                                                />
                                              </div>

                                              <div>
                                                <p
                                                  className="
                                                    font-semibold
                                                    text-[#3e4038]
                                                    dark:text-gray-100
                                                  "
                                                >
                                                  Quiz Attempt #
                                                  {quizzes.length -
                                                    quizIndex}
                                                </p>

                                                <div
                                                  className="
                                                    mt-1
                                                    flex
                                                    items-center
                                                    gap-3
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
                                                      gap-1
                                                    "
                                                  >
                                                    <CalendarDays
                                                      size={
                                                        13
                                                      }
                                                    />

                                                    {getQuizDate(
                                                      quiz
                                                    )}
                                                  </span>

                                                  <span>
                                                    Score:{" "}
                                                    {score}
                                                    {total
                                                      ? ` / ${total}`
                                                      : ""}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* SCORE */}

                                            <div
                                              className="
                                                flex
                                                items-center
                                                gap-3
                                              "
                                            >
                                              <div
                                                className="
                                                  text-right
                                                "
                                              >
                                                <p
                                                  className="
                                                    text-xl
                                                    font-bold
                                                    text-[#3e4038]
                                                    dark:text-gray-100
                                                  "
                                                >
                                                  {
                                                    percentage
                                                  }
                                                  %
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
                                                    size={
                                                      14
                                                    }
                                                  />
                                                ) : (
                                                  <XCircle
                                                    size={
                                                      14
                                                    }
                                                  />
                                                )}

                                                {passed
                                                  ? "Passed"
                                                  : "Needs Improvement"}
                                              </div>
                                            </div>
                                          </div>

                                          {/* QUIZ PROGRESS */}

                                          <div
                                            className="
                                              mt-4
                                            "
                                          >
                                            <div
                                              className="
                                                h-2
                                                w-full
                                                rounded-full
                                                overflow-hidden
                                                bg-[#e4ded2]
                                                dark:bg-gray-800
                                              "
                                            >
                                              <div
                                                className="
                                                  h-full
                                                  rounded-full
                                                  bg-[#6f8061]
                                                  transition-all
                                                "
                                                style={{
                                                  width: `${percentage}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* ==================================================
                                              QUIZ FOOTER
                                              VIEW RESULT BUTTON REMOVED
                                          ================================================== */}

                                          <div
                                            className="
                                              mt-4
                                              flex
                                              items-center
                                            "
                                          >
                                            <p
                                              className="
                                                text-xs
                                                text-[#85877d]
                                                dark:text-gray-400
                                              "
                                            >
                                              {percentage >=
                                              85
                                                ? "Excellent performance"
                                                : percentage >=
                                                  70
                                                ? "Good performance"
                                                : percentage >=
                                                  50
                                                ? "Keep improving"
                                                : "Review this topic"}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}

                                  {/* ==================================================
                                      TAKE ANOTHER QUIZ
                                  ================================================== */}

                                  <div
                                    className="
                                      pt-2
                                      flex
                                      justify-end
                                    "
                                  >
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleTakeQuiz(
                                          lecture
                                        )
                                      }
                                      className="
                                        bg-[#6f8061]
                                        hover:bg-[#5d6e51]
                                        text-white
                                      "
                                    >
                                      <ClipboardCheck
                                        size={16}
                                      />

                                      Take Another Quiz
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}

      <Modal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({
            open: false,
            lectureId: null,
          })
        }
        title="Delete Lecture"
        actions={[
          <Button
            key="cancel"
            variant="secondary"
            onClick={() =>
              setDeleteModal({
                open: false,
                lectureId: null,
              })
            }
          >
            Cancel
          </Button>,

          <Button
            key="delete"
            variant="danger"
            loading={deleteLoading}
            onClick={handleDelete}
          >
            Delete
          </Button>,
        ]}
      >
        <p
          className="
            text-[#4d5047]
            dark:text-gray-200
          "
        >
          Are you sure you want to delete this lecture?
          This action cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}