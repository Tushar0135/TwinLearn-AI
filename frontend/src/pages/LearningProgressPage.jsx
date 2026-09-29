import React, { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "../components/Layout";
import { Card, Badge } from "../components/UI";

import {
  TrendingUp,
  Target,
  BookOpen,
  Brain,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../services/api";

// ============================================================
// TOOLTIP
// ============================================================

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="
        bg-[#fffdf8]
        dark:bg-gray-900
        border
        border-[#e4ded2]
        dark:border-gray-700
        rounded-xl
        px-4
        py-3
        shadow-lg
      "
    >
      <p
        className="
          text-sm
          font-semibold
          text-[#3e4038]
          dark:text-gray-100
          mb-2
        "
      >
        {label}
      </p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="
            text-xs
            text-[#73766b]
            dark:text-gray-400
          "
        >
          {item.name}:{" "}
          <span className="font-semibold">
            {item.value}%
          </span>
        </p>
      ))}
    </div>
  );
}

// ============================================================
// HELPER
// ============================================================

function getMasteryStatus(score) {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "Strong";
  }

  if (value >= 60) {
    return "Good";
  }

  return "Needs Practice";
}

// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

// ============================================================
// PAGE
// ============================================================

export default function LearningProgressPage() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [performance, setPerformance] = useState(null);
  const [topicMastery, setTopicMastery] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        performanceResponse,
        masteryResponse,
        weakTopicsResponse,
        strategyResponse,
        historyResponse,
      ] = await Promise.all([
        api.get("/dashboard/performance"),
        api.get("/dashboard/topic-mastery"),
        api.get("/dashboard/weak-topics"),
        api.get("/dashboard/current-strategy"),
        api.get("/dashboard/learning-history"),
      ]);

      // ------------------------------------------------------
      // PERFORMANCE
      // ------------------------------------------------------

      setPerformance(
        performanceResponse?.data || {}
      );

      // ------------------------------------------------------
      // TOPIC MASTERY
      // ------------------------------------------------------

      const masteryData =
        masteryResponse?.data;

      if (Array.isArray(masteryData)) {
        setTopicMastery(masteryData);
      } else {
        setTopicMastery(
          Array.isArray(masteryData?.topics)
            ? masteryData.topics
            : []
        );
      }

      // ------------------------------------------------------
      // WEAK TOPICS
      // ------------------------------------------------------

      const weakData =
        weakTopicsResponse?.data;

      if (Array.isArray(weakData)) {
        setWeakTopics(weakData);
      } else {
        setWeakTopics(
          Array.isArray(weakData?.weak_topics)
            ? weakData.weak_topics
            : []
        );
      }

      // ------------------------------------------------------
      // CURRENT STRATEGY
      // ------------------------------------------------------

      setStrategy(
        strategyResponse?.data || null
      );

      // ------------------------------------------------------
      // LEARNING HISTORY
      // ------------------------------------------------------

      const historyData =
        historyResponse?.data;

      if (Array.isArray(historyData)) {
        setHistory(historyData);
      } else {
        setHistory(
          Array.isArray(historyData?.history)
            ? historyData.history
            : []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load learning progress:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item?.msg || "Validation error")
            .join(", ")
        );
      } else {
        setError(
          detail ||
            err?.message ||
            "Unable to load your learning progress."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ==========================================================
  // CALCULATED VALUES
  // ==========================================================

  const overallMastery = useMemo(() => {
    if (!topicMastery.length) {
      return 0;
    }

    const validScores = topicMastery
      .map((topic) =>
        safeNumber(topic?.average_score)
      )
      .filter((score) => score >= 0);

    if (!validScores.length) {
      return 0;
    }

    const total = validScores.reduce(
      (sum, score) => sum + score,
      0
    );

    return Math.round(
      total / validScores.length
    );
  }, [topicMastery]);

  const masteredTopics = useMemo(() => {
    return topicMastery.filter(
      (topic) =>
        safeNumber(topic?.average_score) >= 70
    ).length;
  }, [topicMastery]);

  // ==========================================================
  // RECENT HISTORY
  // ==========================================================

  const recentHistory = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .slice()
      .reverse()
      .slice(-10)
      .map((item, index) => {
        let label = `Test ${index + 1}`;

        if (item?.date) {
          const date = new Date(item.date);

          if (!Number.isNaN(date.getTime())) {
            label = date.toLocaleDateString(
              undefined,
              {
                day: "numeric",
                month: "short",
              }
            );
          }
        }

        return {
          label,
          score: safeNumber(
            item?.percentage ??
              item?.score ??
              item?.average_score
          ),
        };
      });
  }, [history]);

  // ==========================================================
  // LECTURE / TOPIC PROGRESS
  // ==========================================================

  const lectureProgress = useMemo(() => {
    if (!Array.isArray(topicMastery)) {
      return [];
    }

    return topicMastery.map((topic, index) => {
      const mastery = Math.round(
        safeNumber(topic?.average_score)
      );

      const matchingHistory = history.filter(
        (item) =>
          item?.topic &&
          topic?.topic &&
          String(item.topic).toLowerCase() ===
            String(topic.topic).toLowerCase()
      );

      const latest =
        matchingHistory.length > 0
          ? matchingHistory[0]
          : null;

      return {
        id:
          topic?.topic ||
          `topic-${index}`,

        title:
          latest?.test_name ||
          latest?.lecture_title ||
          topic?.topic ||
          "Unknown Topic",

        topic:
          topic?.topic ||
          "Unknown Topic",

        progress: mastery,

        quizScore: mastery,

        mastery,

        status:
          getMasteryStatus(mastery),

        testsAttempted:
          safeNumber(topic?.tests_attempted),
      };
    });
  }, [topicMastery, history]);

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
          "
        >
          <div className="text-center">
            <RefreshCw
              size={32}
              className="
                mx-auto
                animate-spin
                text-[#6f8061]
                dark:text-[#aeb8a1]
              "
            />

            <p
              className="
                mt-4
                text-sm
                text-[#73766b]
                dark:text-gray-400
              "
            >
              Loading your learning progress...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
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
              max-w-[1500px]
              mx-auto
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
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={22}
                  className="
                    text-[#c98262]
                    dark:text-[#d99a7c]
                    mt-0.5
                  "
                />

                <div>
                  <h2
                    className="
                      font-semibold
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Could not load learning progress
                  </h2>

                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={loadDashboardData}
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2
                      rounded-lg
                      bg-[#6f8061]
                      text-white
                      text-sm
                      font-medium
                      hover:opacity-90
                    "
                  >
                    <RefreshCw size={15} />
                    Try again
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

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
            max-w-[1500px]
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-6
            space-y-6
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div>
            <div
              className="
                flex
                items-center
                gap-3
                mb-2
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  flex
                  items-center
                  justify-center
                "
              >
                <TrendingUp
                  size={20}
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
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                >
                  Learning Analytics
                </p>

                <h1
                  className="
                    font-display
                    text-3xl
                    md:text-4xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Your learning progress
                </h1>
              </div>
            </div>

            <p
              className="
                text-[#7d7d72]
                dark:text-gray-400
                ml-13
              "
            >
              See what you have learned, where you are
              improving, and how your AI Professor should
              teach you next.
            </p>
          </div>

          {/* ==================================================
              OVERVIEW CARDS
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-4
              gap-4
            "
          >
            {/* OVERALL MASTERY */}

            <Card
              className="
                p-5
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                    "
                  >
                    Overall mastery
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                      mt-1
                    "
                  >
                    {overallMastery}%
                  </p>
                </div>

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
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
                      dark:text-[#aeb8a1]
                    "
                  />
                </div>
              </div>

              <div
                className="
                  mt-4
                  h-2
                  bg-[#e8e4da]
                  dark:bg-gray-700
                  rounded-full
                  overflow-hidden
                "
              >
                <div
                  className="
                    h-full
                    bg-[#6f8061]
                    dark:bg-[#8fa083]
                    rounded-full
                  "
                  style={{
                    width: `${Math.min(
                      Math.max(overallMastery, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </Card>

            {/* AVERAGE QUIZ SCORE */}

            <Card
              className="
                p-5
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                    "
                  >
                    Average quiz score
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                      mt-1
                    "
                  >
                    {safeNumber(
                      performance?.average_score
                    )}
                    %
                  </p>
                </div>

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#f3e8df]
                    dark:bg-[#3a2c26]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Trophy
                    size={20}
                    className="
                      text-[#c98262]
                      dark:text-[#d99a7c]
                    "
                  />
                </div>
              </div>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-gray-400
                  mt-4
                "
              >
                Based on all completed quizzes
              </p>
            </Card>

            {/* TESTS */}

            <Card
              className="
                p-5
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                    "
                  >
                    Tests completed
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                      mt-1
                    "
                  >
                    {safeNumber(
                      performance?.total_tests
                    )}
                  </p>
                </div>

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#e6ecdf]
                    dark:bg-[#34402f]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <BookOpen
                    size={20}
                    className="
                      text-[#6f8061]
                      dark:text-[#aeb8a1]
                    "
                  />
                </div>
              </div>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-gray-400
                  mt-4
                "
              >
                {safeNumber(
                  performance?.passed_tests
                )}{" "}
                passed ·{" "}
                {safeNumber(
                  performance?.failed_tests
                )}{" "}
                failed
              </p>
            </Card>

            {/* TOPICS */}

            <Card
              className="
                p-5
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      text-[#73766b]
                      dark:text-gray-400
                    "
                  >
                    Topics mastered
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                      mt-1
                    "
                  >
                    {masteredTopics}
                  </p>
                </div>

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
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
                      dark:text-[#aeb8a1]
                    "
                  />
                </div>
              </div>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-gray-400
                  mt-4
                "
              >
                Mastery ≥ 70%
              </p>
            </Card>
          </div>

          {/* ==================================================
              QUIZ ACTIVITY + CURRENT STRATEGY
          ================================================== */}

          <div
            className="
              grid
              lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]
              gap-6
            "
          >
            {/* QUIZ ACTIVITY */}

            <Card
              className="
                p-5
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
                  justify-between
                  mb-6
                "
              >
                <div>
                  <h2
                    className="
                      font-display
                      text-xl
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Quiz activity
                  </h2>

                  <p
                    className="
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    Your recent quiz performance
                  </p>
                </div>

                <Clock
                  size={20}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              {recentHistory.length === 0 ? (
                <div
                  className="
                    h-[300px]
                    flex
                    items-center
                    justify-center
                    text-sm
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  Complete a quiz to see your activity.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart data={recentHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e4ded2"
                    />

                    <XAxis
                      dataKey="label"
                      stroke="#85877d"
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="#85877d"
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                    />

                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Quiz score"
                      stroke="#6f8061"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* CURRENT STRATEGY */}

            <Card
              className="
                p-5
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
                  gap-2
                  mb-5
                "
              >
                <Sparkles
                  size={20}
                  className="
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                />

                <h2
                  className="
                    font-display
                    text-xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Current AI strategy
                </h2>
              </div>

              <div
                className="
                  p-4
                  rounded-xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  border
                  border-[#d5ddcc]
                  dark:border-[#56634d]
                "
              >
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    font-semibold
                    text-[#6f8061]
                    dark:text-[#b7c4ad]
                  "
                >
                  Recommended teaching strategy
                </p>

                <p
                  className="
                    text-xl
                    font-bold
                    text-[#3e4038]
                    dark:text-gray-100
                    mt-2
                  "
                >
                  {strategy?.strategy ||
                    "Not enough data yet"}
                </p>
              </div>

              <p
                className="
                  text-sm
                  text-[#73766b]
                  dark:text-gray-400
                  mt-4
                  leading-relaxed
                "
              >
                {strategy?.reason ||
                  "Complete more quizzes so the AI Professor can determine which teaching strategy works best for you."}
              </p>

              {strategy?.mean_score !== null &&
                strategy?.mean_score !== undefined && (
                  <div
                    className="
                      mt-5
                      p-3
                      rounded-xl
                      bg-[#fcfaf5]
                      dark:bg-gray-950
                      border
                      border-[#e4ded2]
                      dark:border-gray-700
                    "
                  >
                    <p
                      className="
                        text-xs
                        text-[#85877d]
                        dark:text-gray-400
                      "
                    >
                      Recent mean score
                    </p>

                    <p
                      className="
                        text-lg
                        font-bold
                        text-[#3e4038]
                        dark:text-gray-100
                        mt-1
                      "
                    >
                      {safeNumber(
                        strategy.mean_score
                      )}
                      %
                    </p>
                  </div>
                )}
            </Card>
          </div>

          {/* ==================================================
              TOPIC MASTERY + WEAK TOPICS
          ================================================== */}

          <div
            className="
              grid
              lg:grid-cols-2
              gap-6
            "
          >
            {/* TOPIC MASTERY */}

            <Card
              className="
                p-5
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-700
              "
            >
              <div className="mb-6">
                <h2
                  className="
                    font-display
                    text-xl
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  Topic mastery
                </h2>

                <p
                  className="
                    text-sm
                    text-[#85877d]
                    dark:text-gray-400
                    mt-1
                  "
                >
                  How well you understand the concepts
                  you have studied
                </p>
              </div>

              {topicMastery.length === 0 ? (
                <p
                  className="
                    text-sm
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  No topic performance data available
                  yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {topicMastery.map(
                    (topic, index) => {
                      const mastery = Math.round(
                        safeNumber(
                          topic?.average_score
                        )
                      );

                      return (
                        <div
                          key={
                            topic?.topic ||
                            `topic-${index}`
                          }
                        >
                          <div
                            className="
                              flex
                              justify-between
                              mb-2
                            "
                          >
                            <span
                              className="
                                text-sm
                                font-medium
                                text-[#4d5047]
                                dark:text-gray-200
                              "
                            >
                              {topic?.topic ||
                                "Unknown Topic"}
                            </span>

                            <span
                              className="
                                text-sm
                                font-semibold
                                text-[#6f8061]
                                dark:text-[#aeb8a1]
                              "
                            >
                              {mastery}%
                            </span>
                          </div>

                          <div
                            className="
                              h-2
                              bg-[#e8e4da]
                              dark:bg-gray-700
                              rounded-full
                              overflow-hidden
                            "
                          >
                            <div
                              className="
                                h-full
                                bg-[#6f8061]
                                dark:bg-[#8fa083]
                                rounded-full
                              "
                              style={{
                                width: `${Math.min(
                                  Math.max(mastery, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <p
                            className="
                              text-xs
                              text-[#85877d]
                              dark:text-gray-400
                              mt-1
                            "
                          >
                            {safeNumber(
                              topic?.tests_attempted
                            )}{" "}
                            test
                            {safeNumber(
                              topic?.tests_attempted
                            ) === 1
                              ? ""
                              : "s"}{" "}
                            attempted
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </Card>

            {/* WEAK TOPICS */}

            <Card
              className="
                p-5
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
                  gap-2
                  mb-6
                "
              >
                <AlertCircle
                  size={20}
                  className="
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                />

                <div>
                  <h2
                    className="
                      font-display
                      text-xl
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    Areas to improve
                  </h2>

                  <p
                    className="
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    Topics where your AI Professor
                    should focus more
                  </p>
                </div>
              </div>

              {weakTopics.length === 0 ? (
                <div
                  className="
                    p-4
                    rounded-xl
                    bg-[#e6ecdf]
                    dark:bg-[#34402f]
                    text-sm
                    text-[#5d6e51]
                    dark:text-[#b7c4ad]
                  "
                >
                  Great work! No weak topics detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {weakTopics.map(
                    (topic, index) => (
                      <div
                        key={
                          topic?.topic ||
                          `weak-${index}`
                        }
                        className="
                          flex
                          items-center
                          justify-between
                          p-4
                          rounded-xl
                          bg-[#f3e8df]
                          dark:bg-[#3a2c26]
                          border
                          border-[#ead7ca]
                          dark:border-[#5a4034]
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                          "
                        >
                          <AlertCircle
                            size={18}
                            className="
                              text-[#c98262]
                              dark:text-[#d99a7c]
                            "
                          />

                          <div>
                            <span
                              className="
                                text-sm
                                font-semibold
                                text-[#4d5047]
                                dark:text-gray-200
                              "
                            >
                              {topic?.topic ||
                                "Unknown Topic"}
                            </span>

                            <p
                              className="
                                text-xs
                                text-[#85877d]
                                dark:text-gray-400
                                mt-1
                              "
                            >
                              {safeNumber(
                                topic?.tests_attempted
                              )}{" "}
                              test
                              {safeNumber(
                                topic?.tests_attempted
                              ) === 1
                                ? ""
                                : "s"}{" "}
                              attempted
                            </p>
                          </div>
                        </div>

                        <span
                          className="
                            text-sm
                            font-bold
                            text-[#c98262]
                            dark:text-[#d99a7c]
                          "
                        >
                          {safeNumber(
                            topic?.average_score
                          )}
                          %
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              <div
                className="
                  mt-5
                  p-4
                  rounded-xl
                  bg-[#e6ecdf]
                  dark:bg-[#34402f]
                  border
                  border-[#d5ddcc]
                  dark:border-[#56634d]
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >
                  <Sparkles
                    size={18}
                    className="
                      text-[#6f8061]
                      dark:text-[#b7c4ad]
                      mt-0.5
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-[#4d5047]
                        dark:text-gray-200
                      "
                    >
                      AI Professor recommendation
                    </p>

                    <p
                      className="
                        text-xs
                        text-[#73766b]
                        dark:text-gray-400
                        mt-1
                        leading-relaxed
                      "
                    >
                      {weakTopics.length > 0
                        ? `Focus on ${
                            weakTopics[0]?.topic ||
                            "your weakest topic"
                          } first, then take another quiz to measure improvement.`
                        : "Keep completing quizzes so the AI Professor can continue adapting to your learning."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ==================================================
              LEARNING PROGRESS
          ================================================== */}

          <Card
            className="
              p-5
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >
            <div className="mb-6">
              <h2
                className="
                  font-display
                  text-xl
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                Learning progress
              </h2>

              <p
                className="
                  text-sm
                  text-[#85877d]
                  dark:text-gray-400
                  mt-1
                "
              >
                Topic progress calculated from your
                completed quizzes
              </p>
            </div>

            {lectureProgress.length === 0 ? (
              <div
                className="
                  py-10
                  text-center
                  text-sm
                  text-[#85877d]
                  dark:text-gray-400
                "
              >
                Complete your first quiz to build your
                learning history.
              </div>
            ) : (
              <div className="space-y-4">
                {lectureProgress.map((lecture) => (
                  <div
                    key={lecture.id}
                    className="
                      p-4
                      rounded-xl
                      border
                      border-[#e4ded2]
                      dark:border-gray-700
                      bg-[#fcfaf5]
                      dark:bg-gray-950
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-4
                      "
                    >
                      <div className="min-w-0">
                        <p
                          className="
                            font-semibold
                            text-[#4d5047]
                            dark:text-gray-100
                          "
                        >
                          {lecture.title}
                        </p>

                        <p
                          className="
                            text-xs
                            text-[#85877d]
                            dark:text-gray-400
                            mt-1
                          "
                        >
                          {lecture.topic}
                        </p>
                      </div>

                      {lecture.status ===
                      "Strong" ? (
                        <Badge variant="success">
                          Strong
                        </Badge>
                      ) : lecture.status ===
                        "Good" ? (
                        <Badge variant="info">
                          Good
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          Needs Practice
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4">
                      <div
                        className="
                          flex
                          justify-between
                          text-xs
                          mb-2
                        "
                      >
                        <span
                          className="
                            text-[#85877d]
                            dark:text-gray-400
                          "
                        >
                          Topic mastery
                        </span>

                        <span
                          className="
                            font-semibold
                            text-[#4d5047]
                            dark:text-gray-200
                          "
                        >
                          {lecture.mastery}%
                        </span>
                      </div>

                      <div
                        className="
                          h-2
                          rounded-full
                          bg-[#e8e4da]
                          dark:bg-gray-700
                          overflow-hidden
                        "
                      >
                        <div
                          className="
                            h-full
                            bg-[#6f8061]
                            rounded-full
                          "
                          style={{
                            width: `${Math.min(
                              Math.max(
                                lecture.mastery,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className="
                        grid
                        grid-cols-2
                        mt-4
                        pt-3
                        border-t
                        border-[#e4ded2]
                        dark:border-gray-700
                      "
                    >
                      <div>
                        <p
                          className="
                            text-xs
                            text-[#85877d]
                            dark:text-gray-400
                          "
                        >
                          Average quiz score
                        </p>

                        <p
                          className="
                            font-semibold
                            text-[#4d5047]
                            dark:text-gray-200
                            mt-1
                          "
                        >
                          {lecture.quizScore}%
                        </p>
                      </div>

                      <div>
                        <p
                          className="
                            text-xs
                            text-[#85877d]
                            dark:text-gray-400
                          "
                        >
                          Tests attempted
                        </p>

                        <p
                          className="
                            font-semibold
                            text-[#4d5047]
                            dark:text-gray-200
                            mt-1
                          "
                        >
                          {lecture.testsAttempted}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ==================================================
              PERFORMANCE SUMMARY
          ================================================== */}

          <Card
            className="
              p-5
              bg-[#fffdf8]
              dark:bg-gray-900
              border-[#e4ded2]
              dark:border-gray-700
            "
          >
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-4
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
                  <CheckCircle2
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
                      text-sm
                      text-[#85877d]
                      dark:text-gray-400
                    "
                  >
                    Highest quiz score
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-[#3e4038]
                      dark:text-gray-100
                    "
                  >
                    {safeNumber(
                      performance?.highest_score
                    )}
                    %
                  </p>
                </div>
              </div>

              <div
                className="
                  text-sm
                  text-[#6f8061]
                  dark:text-[#aeb8a1]
                "
              >
                Keep completing quizzes to give your
                AI Professor more performance data.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}