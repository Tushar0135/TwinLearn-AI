import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/Layout";

import {
  Card,
  Button,
  Input,
  Loading,
  Select,
} from "../components/UI";

import {
  Search,
  Filter,
  TrendingUp,
  Sparkles,
  BookOpen,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import lectureService from "../services/lectureService";

/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function TopicsPage() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [filterDifficulty, setFilterDifficulty] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD TOPICS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadTopics();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | APPLY FILTERS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    applyFilters();
  }, [
    topics,
    searchQuery,
    filterDifficulty,
  ]);

  const loadTopics = async () => {
    setLoading(true);

    try {
      const result =
        await lectureService.getTopics();

      console.log(
        "Topics response:",
        result
      );

      if (result?.success) {
        setTopics(result.data || []);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error(
        "Failed to load topics:",
        error
      );

      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER TOPICS
  |--------------------------------------------------------------------------
  */

  const applyFilters = () => {
    let filtered = [...topics];

    if (searchQuery.trim()) {
      filtered = filtered.filter((topic) =>
        String(topic.name || "")
          .toLowerCase()
          .includes(
            searchQuery
              .trim()
              .toLowerCase()
          )
      );
    }

    if (filterDifficulty) {
      filtered = filtered.filter(
        (topic) =>
          String(topic.difficulty || "")
            .toLowerCase() ===
          filterDifficulty.toLowerCase()
      );
    }

    setFilteredTopics(filtered);
  };

  /*
  |--------------------------------------------------------------------------
  | MASTERY STATUS
  |--------------------------------------------------------------------------
  */

  const getMasteryText = (mastery) => {
    const value = Number(mastery) || 0;

    if (value === 0) {
      return "Not Started";
    }

    if (value < 40) {
      return "Needs Work";
    }

    if (value < 70) {
      return "Good Progress";
    }

    return "Mastered";
  };

  /*
  |--------------------------------------------------------------------------
  | MASTERY COLORS
  |--------------------------------------------------------------------------
  */

  const getMasteryColors = (mastery) => {
    const value = Number(mastery) || 0;

    if (value === 0) {
      return {
        stroke: "#aaa69c",
        bg: "#eee9df",
        text: "#73766b",
      };
    }

    if (value < 40) {
      return {
        stroke: "#c98262",
        bg: "#f3e8df",
        text: "#8c604c",
      };
    }

    if (value < 70) {
      return {
        stroke: "#b59a5d",
        bg: "#f3eddb",
        text: "#756437",
      };
    }

    return {
      stroke: "#6f8061",
      bg: "#e6ecdf",
      text: "#4d6041",
    };
  };

  /*
  |--------------------------------------------------------------------------
  | DIFFICULTY COLORS
  |--------------------------------------------------------------------------
  */

  const getDifficultyStyles = (
    difficulty
  ) => {
    switch (
      String(difficulty || "")
        .toLowerCase()
    ) {
      case "beginner":
        return `
          bg-[#e6ecdf]
          text-[#4d6041]
          dark:bg-gray-800
          dark:text-[#c8d2c0]
        `;

      case "intermediate":
        return `
          bg-[#f3eddb]
          text-[#756437]
          dark:bg-gray-800
          dark:text-[#d8ca9a]
        `;

      case "advanced":
        return `
          bg-[#f3e8df]
          text-[#8c604c]
          dark:bg-gray-800
          dark:text-[#e2a082]
        `;

      default:
        return `
          bg-[#eee9df]
          text-[#73766b]
          dark:bg-gray-800
          dark:text-gray-400
        `;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | MASTERY CIRCLE
  |--------------------------------------------------------------------------
  */

  const MasteryCircle = ({
    mastery,
    topicId,
  }) => {
    const value = Math.min(
      100,
      Math.max(
        0,
        Number(mastery) || 0
      )
    );

    const colors =
      getMasteryColors(value);

    const radius = 52;
    const circumference =
      2 * Math.PI * radius;

    const offset =
      circumference -
      (value / 100) *
        circumference;

    const gradientId = `mastery-gradient-${topicId}`;

    return (
      <div className="flex justify-center py-4">
        <div className="relative w-36 h-36">
          <svg
            className="
              w-full
              h-full
              transform
              -rotate-90
            "
            viewBox="0 0 120 120"
          >
            {/* Background */}

            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#eee9df"
              className="dark:stroke-gray-800"
              strokeWidth="8"
            />

            {/* Progress */}

            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="8"
              strokeDasharray={
                circumference
              }
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="
                transition-all
                duration-700
              "
            />

            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={
                    value >= 70
                      ? "#7f906f"
                      : value >= 40
                      ? "#b59a5d"
                      : "#c98262"
                  }
                />

                <stop
                  offset="100%"
                  stopColor={
                    value >= 70
                      ? "#5d6e51"
                      : value >= 40
                      ? "#8f7a46"
                      : "#a9694f"
                  }
                />
              </linearGradient>
            </defs>
          </svg>

          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
            "
          >
            <div className="text-center">
              <p
                className="
                  font-display
                  text-3xl
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                {value}%
              </p>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-gray-400
                  mt-0.5
                "
              >
                Mastery
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CONTINUE LEARNING
  |--------------------------------------------------------------------------
  */

  const handleContinueLearning = (
    topic
  ) => {
    console.log(
      "Continue learning topic:",
      topic
    );

    const lectureId =
      topic?.lecture_id ||
      topic?.lectureId ||
      topic?.lecture?.id ||
      topic?.lecture?.lecture_id;

    if (lectureId) {
      navigate(
        `/ai-professor/${lectureId}`,
        {
          state: {
            lectureId,
            topic: topic.name,
          },
        }
      );

      return;
    }

    /*
     * If topics don't currently contain a
     * lecture ID, keep the button functional
     * without guessing a route.
     */

    console.log(
      "No lecture ID available for topic:",
      topic
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  */

  const clearFilters = () => {
    setSearchQuery("");
    setFilterDifficulty("");
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

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
          {/* =========================================================
              HEADER
          ========================================================= */}

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-[#e6ecdf]
                  dark:bg-gray-800
                  flex
                  items-center
                  justify-center
                "
              >
                <Sparkles
                  size={17}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#c98262]
                  dark:text-[#e2a082]
                "
              >
                Learning Progress
              </span>
            </div>

            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-end
                md:justify-between
                gap-5
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
                  Know your strengths.
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
                  Track your mastery across
                  every topic and see where your
                  learning needs more attention.
                </p>
              </div>

              {!loading &&
                topics.length > 0 && (
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      bg-[#fffdf8]
                      dark:bg-gray-900
                      border
                      border-[#e4ded2]
                      dark:border-gray-800
                    "
                  >
                    <div
                      className="
                        w-9
                        h-9
                        rounded-lg
                        bg-[#e6ecdf]
                        dark:bg-gray-800
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <BookOpen
                        size={17}
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
                          tracking-wider
                          text-[#aaa69c]
                          dark:text-gray-500
                        "
                      >
                        Topics
                      </p>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-[#4d5047]
                          dark:text-gray-200
                        "
                      >
                        {topics.length}{" "}
                        {topics.length === 1
                          ? "topic"
                          : "topics"}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* =========================================================
              SEARCH / FILTERS
          ========================================================= */}

          <Card
            className="
              p-5
              md:p-6
              mb-8
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
                flex
                items-center
                gap-2
                mb-5
              "
            >
              <div
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-[#e6ecdf]
                  dark:bg-gray-800
                  flex
                  items-center
                  justify-center
                "
              >
                <Search
                  size={17}
                  className="
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                  "
                />
              </div>

              <div>
                <h2
                  className="
                    font-semibold
                    text-[#4d5047]
                    dark:text-gray-200
                  "
                >
                  Find a topic
                </h2>

                <p
                  className="
                    text-xs
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  Search or filter your learning
                  progress.
                </p>
              </div>
            </div>

            <div
              className="
                grid
                md:grid-cols-[1fr_220px_auto]
                gap-3
              "
            >
              <Input
                placeholder="Search topics..."
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
                    label:
                      "All Difficulties",
                  },
                  {
                    value: "Beginner",
                    label: "Beginner",
                  },
                  {
                    value: "Intermediate",
                    label:
                      "Intermediate",
                  },
                  {
                    value: "Advanced",
                    label: "Advanced",
                  },
                ]}
                value={
                  filterDifficulty
                }
                onChange={(e) =>
                  setFilterDifficulty(
                    e.target.value
                  )
                }
              />

              <Button
                variant="outline"
                onClick={clearFilters}
                className="
                  justify-center
                  min-w-[120px]
                  border-[#cfc9bc]
                  dark:border-gray-700
                  text-[#4d5047]
                  dark:text-gray-200
                "
              >
                <Filter size={17} />
                Clear
              </Button>
            </div>

            {/* Filter result count */}

            {!loading && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  mt-4
                  pt-4
                  border-t
                  border-[#eee9df]
                  dark:border-gray-800
                "
              >
                <p
                  className="
                    text-xs
                    text-[#85877d]
                    dark:text-gray-400
                  "
                >
                  Showing{" "}
                  <span
                    className="
                      font-semibold
                      text-[#4d5047]
                      dark:text-gray-200
                    "
                  >
                    {filteredTopics.length}
                  </span>{" "}
                  of{" "}
                  <span
                    className="
                      font-semibold
                      text-[#4d5047]
                      dark:text-gray-200
                    "
                  >
                    {topics.length}
                  </span>{" "}
                  topics
                </p>

                {(searchQuery ||
                  filterDifficulty) && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="
                      text-xs
                      font-semibold
                      text-[#c98262]
                      dark:text-[#e2a082]
                      hover:underline
                    "
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* =========================================================
              LOADING
          ========================================================= */}

          {loading ? (
            <Card
              className="
                p-12
                text-center
                bg-[#fffdf8]
                dark:bg-gray-900
                border-[#e4ded2]
                dark:border-gray-800
                shadow-sm
                dark:shadow-none
              "
            >
              <div className="flex justify-center mb-4">
                <Loading size="lg" />
              </div>

              <p
                className="
                  text-sm
                  text-[#85877d]
                  dark:text-gray-400
                "
              >
                Loading your learning
                topics...
              </p>
            </Card>
          ) : filteredTopics.length ===
            0 ? (
            /* =========================================================
               EMPTY
            ========================================================= */

            <EmptyTopics
              hasFilters={
                Boolean(
                  searchQuery ||
                    filterDifficulty
                )
              }
              onClearFilters={
                clearFilters
              }
            />
          ) : (
            /* =========================================================
               TOPICS GRID
            ========================================================= */

            <div
              className="
                grid
                md:grid-cols-2
                lg:grid-cols-3
                gap-5
              "
            >
              {filteredTopics.map(
                (topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    getMasteryText={
                      getMasteryText
                    }
                    getMasteryColors={
                      getMasteryColors
                    }
                    getDifficultyStyles={
                      getDifficultyStyles
                    }
                    onContinue={
                      handleContinueLearning
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| TOPIC CARD
|--------------------------------------------------------------------------
*/

function TopicCard({
  topic,
  getMasteryText,
  getMasteryColors,
  getDifficultyStyles,
  onContinue,
}) {
  const mastery =
    Math.min(
      100,
      Math.max(
        0,
        Number(topic.mastery) || 0
      )
    );

  const colors =
    getMasteryColors(mastery);

  return (
    <Card
      className="
        p-6
        bg-[#fffdf8]
        dark:bg-gray-900
        border-[#e4ded2]
        dark:border-gray-800
        shadow-sm
        dark:shadow-none
        hover:shadow-md
        dark:hover:shadow-none
        hover:-translate-y-0.5
        transition-all
      "
    >
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
          mb-2
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-[#e6ecdf]
              dark:bg-gray-800
              flex
              items-center
              justify-center
              shrink-0
            "
          >
            <BookOpen
              size={18}
              className="
                text-[#6f8061]
                dark:text-[#aeb8a1]
              "
            />
          </div>

          <div className="min-w-0">
            <h3
              className="
                font-display
                text-xl
                text-[#3e4038]
                dark:text-gray-100
                truncate
              "
              title={topic.name}
            >
              {topic.name}
            </h3>

            <p
              className="
                text-xs
                text-[#85877d]
                dark:text-gray-400
                mt-0.5
              "
            >
              Learning topic
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          DIFFICULTY
      ========================================================= */}

      <div className="mt-4">
        <span
          className={`
            inline-flex
            items-center
            px-3
            py-1.5
            rounded-full
            text-xs
            font-semibold
            ${getDifficultyStyles(
              topic.difficulty
            )}
          `}
        >
          {topic.difficulty ||
            "Not specified"}
        </span>
      </div>

      {/* =========================================================
          MASTERY
      ========================================================= */}

      <MasteryCircle
        mastery={mastery}
        topicId={topic.id}
      />

      {/* =========================================================
          STATUS
      ========================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          p-3
          rounded-xl
          mb-4
        "
        style={{
          backgroundColor:
            colors.bg,
        }}
      >
        <div className="flex items-center gap-2">
          <Target
            size={16}
            style={{
              color: colors.text,
            }}
          />

          <span
            className="
              text-sm
              font-semibold
            "
            style={{
              color: colors.text,
            }}
          >
            {getMasteryText(mastery)}
          </span>
        </div>

        <span
          className="
            text-xs
            font-semibold
          "
          style={{
            color: colors.text,
          }}
        >
          {mastery}%
        </span>
      </div>

      {/* =========================================================
          QUESTIONS
      ========================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          py-3
          border-t
          border-[#eee9df]
          dark:border-gray-800
          text-sm
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            text-[#85877d]
            dark:text-gray-400
          "
        >
          <CheckCircle size={15} />

          <span>
            Questions asked
          </span>
        </div>

        <span
          className="
            font-semibold
            text-[#4d5047]
            dark:text-gray-200
          "
        >
          {Number(
            topic.questions
          ) || 0}
        </span>
      </div>

      {/* =========================================================
          CONTINUE BUTTON
      ========================================================= */}

      <button
        type="button"
        onClick={() =>
          onContinue(topic)
        }
        className="
          w-full
          h-12
          mt-4
          rounded-xl
          border
          border-[#cfc9bc]
          dark:border-gray-700
          bg-[#fffdf8]
          dark:bg-gray-900
          text-[#4d5047]
          dark:text-gray-200
          font-semibold
          flex
          items-center
          justify-center
          gap-2
          hover:bg-[#e6ecdf]
          dark:hover:bg-gray-800
          hover:border-[#aeb8a1]
          dark:hover:border-gray-600
          transition-all
        "
      >
        <TrendingUp size={17} />

        Continue Learning

        <ArrowRight
          size={16}
        />
      </button>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY TOPICS
|--------------------------------------------------------------------------
*/

function EmptyTopics({
  hasFilters,
  onClearFilters,
}) {
  return (
    <Card
      className="
        max-w-3xl
        mx-auto
        p-8
        md:p-12
        text-center
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
          w-20
          h-20
          rounded-2xl
          bg-[#e6ecdf]
          dark:bg-gray-800
          flex
          items-center
          justify-center
          mx-auto
          mb-6
        "
      >
        {hasFilters ? (
          <Search
            size={34}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />
        ) : (
          <BookOpen
            size={34}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />
        )}
      </div>

      <p
        className="
          text-xs
          uppercase
          tracking-[0.2em]
          text-[#c98262]
          dark:text-[#e2a082]
          font-semibold
          mb-2
        "
      >
        {hasFilters
          ? "No matches"
          : "Start learning"}
      </p>

      <h2
        className="
          font-display
          text-3xl
          md:text-4xl
          text-[#3e4038]
          dark:text-gray-100
        "
      >
        {hasFilters
          ? "No topics found."
          : "Your topics will appear here."}
      </h2>

      <p
        className="
          max-w-xl
          mx-auto
          mt-3
          text-[#85877d]
          dark:text-gray-400
          leading-relaxed
        "
      >
        {hasFilters
          ? "Try changing your search or difficulty filter to find what you're looking for."
          : "Upload a lecture and start learning with your AI Professor. Your analyzed topics and mastery will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            h-11
            px-5
            rounded-xl
            bg-[#6f8061]
            text-[#fffdf8]
            font-semibold
            hover:bg-[#5d6e51]
            dark:hover:bg-[#7f906f]
            transition-all
          "
        >
          Clear Filters
        </button>
      )}
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| MASTERY CIRCLE
|--------------------------------------------------------------------------
*/

function MasteryCircle({
  mastery,
  topicId,
}) {
  const value = Math.min(
    100,
    Math.max(
      0,
      Number(mastery) || 0
    )
  );

  const radius = 52;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) *
      circumference;

  const gradientId = `mastery-gradient-${topicId}`;

  const startColor =
    value >= 70
      ? "#7f906f"
      : value >= 40
      ? "#b59a5d"
      : value > 0
      ? "#c98262"
      : "#aaa69c";

  const endColor =
    value >= 70
      ? "#5d6e51"
      : value >= 40
      ? "#8f7a46"
      : value > 0
      ? "#a9694f"
      : "#85877d";

  return (
    <div className="flex justify-center py-4">
      <div className="relative w-36 h-36">
        <svg
          className="
            w-full
            h-full
            transform
            -rotate-90
          "
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#eee9df"
            strokeWidth="8"
            className="dark:stroke-gray-800"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={offset}
            strokeLinecap="round"
          />

          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={startColor}
              />

              <stop
                offset="100%"
                stopColor={endColor}
              />
            </linearGradient>
          </defs>
        </svg>

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <div className="text-center">
            <p
              className="
                font-display
                text-3xl
                text-[#3e4038]
                dark:text-gray-100
              "
            >
              {value}%
            </p>

            <p
              className="
                text-xs
                text-[#85877d]
                dark:text-gray-400
              "
            >
              Mastery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}