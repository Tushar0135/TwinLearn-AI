import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  Brain,
  Trophy,
  Target,
  ArrowRight,
  Upload,
  LogOut,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  // ==========================================================
  // STATE
  // ==========================================================

  const [performance, setPerformance] = useState(null);
  const [topicMastery, setTopicMastery] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [strategy, setStrategy] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleUploadLecture = () => {
    navigate("/upload");
  };

  const handleAIProfessor = () => {
    navigate("/ai-professor");
  };

  const handleLogout = () => {
    logout();
  };

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
      ] = await Promise.all([
        api.get("/dashboard/performance"),
        api.get("/dashboard/topic-mastery"),
        api.get("/dashboard/weak-topics"),
        api.get("/dashboard/current-strategy"),
      ]);

      setPerformance(performanceResponse.data);

      setTopicMastery(
        masteryResponse.data?.topics || []
      );

      setWeakTopics(
        weakTopicsResponse.data?.weak_topics || []
      );

      setStrategy(
        strategyResponse.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load dashboard:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data."
      );
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

    const total = topicMastery.reduce(
      (sum, topic) =>
        sum + Number(topic.average_score || 0),
      0
    );

    return Math.round(
      total / topicMastery.length
    );
  }, [topicMastery]);

  const masteredTopics = useMemo(() => {
    return topicMastery.filter(
      (topic) =>
        Number(topic.average_score || 0) >= 70
    ).length;
  }, [topicMastery]);

  const weakestTopic = useMemo(() => {
    if (!weakTopics.length) {
      return null;
    }

    return [...weakTopics].sort(
      (a, b) =>
        Number(a.average_score || 0) -
        Number(b.average_score || 0)
    )[0];
  }, [weakTopics]);

  const averageScore = Number(
    performance?.average_score || 0
  );

  const totalTests = Number(
    performance?.total_tests || 0
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-[#f7f3ea]
          dark:bg-[#171916]
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
              dark:text-[#a9ba9c]
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-[#73766b]
              dark:text-[#aeb3a9]
            "
          >
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div
        className="
          min-h-screen
          bg-[#f7f3ea]
          dark:bg-[#171916]
          p-6
        "
      >
        <div
          className="
            max-w-3xl
            mx-auto
            mt-20
            bg-[#fffdf8]
            dark:bg-[#22251f]
            border
            border-[#e4ded2]
            dark:border-[#393e36]
            rounded-2xl
            p-6
          "
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={22}
              className="
                text-[#c98262]
                dark:text-[#d99a7c]
              "
            />

            <div>
              <h2
                className="
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                Could not load dashboard
              </h2>

              <p
                className="
                  text-sm
                  text-[#73766b]
                  dark:text-[#aeb3a9]
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
        </div>
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#f7f3ea]
        dark:bg-[#171916]
        text-[#3e4038]
        dark:text-[#f1f2ed]
        transition-colors
        duration-300
      "
    >
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header
        className="
          border-b
          border-[#e4ded2]
          dark:border-[#393e36]
          bg-[#fffdf8]
          dark:bg-[#22251f]
          transition-colors
          duration-300
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            py-4
            flex
            items-center
            justify-between
          "
        >
          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
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
                bg-[#6f8061]
                flex
                items-center
                justify-center
                text-[#fffdf8]
                font-semibold
              "
            >
              T
            </div>

            <div className="text-left">
              <div
                className="
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                TwinLearn
              </div>

              <div
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.2em]
                  text-[#8b8d82]
                  dark:text-[#9da39a]
                "
              >
                Intelligent Learning
              </div>
            </div>
          </button>

          {/* PROFILE */}

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                {user?.full_name || "Student"}
              </p>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-[#aeb3a9]
                "
              >
                {user?.email || ""}
              </p>
            </div>

            <div
              className="
                w-10
                h-10
                rounded-full
                bg-[#e6ecdf]
                dark:bg-[#293127]
                text-[#5d6e51]
                dark:text-[#b9c8ae]
                flex
                items-center
                justify-center
                font-semibold
              "
            >
              {user?.full_name
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                text-[#85877d]
                dark:text-[#aeb3a9]
                hover:bg-[#f3e8df]
                dark:hover:bg-[#3a2e27]
                hover:text-[#c98262]
                transition
              "
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className="
          max-w-7xl
          mx-auto
          px-6
          py-10
        "
      >
        {/* ===================================================
            GREETING
        =================================================== */}

        <div className="mb-10">
          <p
            className="
              text-[#c98262]
              text-xs
              uppercase
              tracking-[0.2em]
              font-semibold
              mb-3
            "
          >
            Your learning space
          </p>

          <h1
            className="
              font-display
              text-4xl
              md:text-5xl
              text-[#3e4038]
              dark:text-[#f1f2ed]
            "
          >
            Welcome back,{" "}
            {user?.full_name?.split(" ")[0] ||
              "Student"}
            .
          </h1>

          <p
            className="
              mt-3
              text-[#7d7d72]
              dark:text-[#aeb3a9]
              max-w-2xl
            "
          >
            Continue learning, review your progress,
            and let your AI Professor guide your next
            step.
          </p>
        </div>

        {/* ===================================================
            STATS
        =================================================== */}

        <div
          className="
            grid
            sm:grid-cols-2
            lg:grid-cols-4
            gap-5
            mb-8
          "
        >
          <StatCard
            icon={BookOpen}
            label="Quizzes Completed"
            value={totalTests}
          />

          <StatCard
            icon={Brain}
            label="Average Score"
            value={`${averageScore}%`}
          />

          <StatCard
            icon={Trophy}
            label="Highest Score"
            value={`${Number(
              performance?.highest_score || 0
            )}%`}
          />

          <StatCard
            icon={Target}
            label="Topic Mastery"
            value={`${overallMastery}%`}
          />
        </div>

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div
          className="
            grid
            lg:grid-cols-3
            gap-6
          "
        >
          {/* =================================================
              PERFORMANCE
          ================================================= */}

          <div
            className="
              lg:col-span-2
              bg-[#fffdf8]
              dark:bg-[#22251f]
              border
              border-[#e4ded2]
              dark:border-[#393e36]
              rounded-2xl
              p-7
              min-h-[300px]
            "
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-[0.15em]
                    text-[#9a9b91]
                    dark:text-[#8f968b]
                    font-semibold
                  "
                >
                  Performance
                </p>

                <h2
                  className="
                    font-display
                    text-2xl
                    text-[#3e4038]
                    dark:text-[#f1f2ed]
                    mt-2
                  "
                >
                  Your learning progress
                </h2>
              </div>

              <span
                className={`
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-semibold
                  ${
                    totalTests === 0
                      ? "bg-[#e6ecdf] dark:bg-[#293127] text-[#5d6e51] dark:text-[#b9c8ae]"
                      : overallMastery >= 80
                      ? "bg-[#e6ecdf] dark:bg-[#293127] text-[#5d6e51] dark:text-[#b9c8ae]"
                      : overallMastery >= 60
                      ? "bg-[#f3e8df] dark:bg-[#3a2e27] text-[#c98262] dark:text-[#d99a7c]"
                      : "bg-[#f3e8df] dark:bg-[#3a2e27] text-[#c98262] dark:text-[#d99a7c]"
                  }
                `}
              >
                {totalTests === 0
                  ? "Starting"
                  : overallMastery >= 80
                  ? "Strong"
                  : overallMastery >= 60
                  ? "Developing"
                  : "Needs Practice"}
              </span>
            </div>

            {/* REAL PROGRESS */}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span
                  className="
                    text-sm
                    text-[#73766b]
                    dark:text-[#aeb3a9]
                  "
                >
                  Overall topic mastery
                </span>

                <span
                  className="
                    text-sm
                    font-semibold
                    text-[#3e4038]
                    dark:text-[#f1f2ed]
                  "
                >
                  {overallMastery}%
                </span>
              </div>

              <div
                className="
                  h-3
                  rounded-full
                  bg-[#e8e4da]
                  dark:bg-[#393e36]
                  overflow-hidden
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-[#6f8061]
                    dark:bg-[#8fa083]
                    transition-all
                    duration-500
                  "
                  style={{
                    width: `${overallMastery}%`,
                  }}
                />
              </div>
            </div>

            {/* PERFORMANCE DETAILS */}

            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-4
                mt-8
              "
            >
              <MiniStat
                label="Quizzes"
                value={totalTests}
              />

              <MiniStat
                label="Average"
                value={`${averageScore}%`}
              />

              <MiniStat
                label="Mastered"
                value={masteredTopics}
              />

              <MiniStat
                label="Weak Topics"
                value={weakTopics.length}
              />
            </div>

            {totalTests === 0 ? (
              <div
                className="
                  h-24
                  mt-6
                  rounded-xl
                  bg-[#f3efe6]
                  dark:bg-[#292c27]
                  flex
                  items-center
                  justify-center
                  text-[#9a9b91]
                  dark:text-[#aeb3a9]
                  text-sm
                  text-center
                  px-5
                "
              >
                Complete your first quiz to build your
                learning progress.
              </div>
            ) : (
              <div
                className="
                  mt-6
                  p-4
                  rounded-xl
                  bg-[#f3efe6]
                  dark:bg-[#292c27]
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#3e4038]
                    dark:text-[#f1f2ed]
                  "
                >
                  Keep going!
                </p>

                <p
                  className="
                    text-xs
                    text-[#73766b]
                    dark:text-[#aeb3a9]
                    mt-1
                  "
                >
                  You have completed {totalTests} quiz
                  {totalTests === 1 ? "" : "zes"} with
                  an average score of {averageScore}%.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              AI PROFESSOR
          ================================================= */}

          <div
            className="
              bg-[#e6ecdf]
              dark:bg-[#293127]
              rounded-2xl
              p-7
              min-h-[300px]
            "
          >
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-[#6f8061]
                text-white
                flex
                items-center
                justify-center
                mb-6
              "
            >
              <Brain size={21} />
            </div>

            <p
              className="
                text-xs
                uppercase
                tracking-[0.15em]
                text-[#6f8061]
                dark:text-[#a9ba9c]
                font-semibold
              "
            >
              AI Professor
            </p>

            <h2
              className="
                font-display
                text-2xl
                text-[#3e4038]
                dark:text-[#f1f2ed]
                mt-2
              "
            >
              Your learning strategy
            </h2>

            <div
              className="
                mt-5
                p-4
                rounded-xl
                bg-[#fffdf8]/70
                dark:bg-[#22251f]/50
              "
            >
              <p
                className="
                  text-xs
                  text-[#73766b]
                  dark:text-[#aeb3a9]
                "
              >
                Current recommendation
              </p>

              <p
                className="
                  text-xl
                  font-bold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                  mt-1
                "
              >
                {strategy?.strategy ||
                  (totalTests === 0
                    ? "Not enough data yet"
                    : "Analyzing...")}
              </p>
            </div>

            <p
              className="
                mt-4
                text-sm
                leading-relaxed
                text-[#73766b]
                dark:text-[#aeb3a9]
              "
            >
              {strategy?.reason ||
                "Complete more quizzes so TwinLearnAI can identify the teaching strategy that works best for you."}
            </p>

            <button
              type="button"
              onClick={handleAIProfessor}
              className="
                mt-7
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#5d6e51]
                dark:text-[#b9c8ae]
                hover:text-[#3e4038]
                dark:hover:text-[#f1f2ed]
                transition
              "
            >
              Explore AI Professor
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ===================================================
            LEARNING INSIGHT
        =================================================== */}

        <section className="mt-8">
          <div
            className="
              bg-[#fffdf8]
              dark:bg-[#22251f]
              border
              border-[#e4ded2]
              dark:border-[#393e36]
              rounded-2xl
              p-7
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-[#f3e8df]
                  dark:bg-[#3a2e27]
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Sparkles
                  size={20}
                  className="
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                />
              </div>

              <div className="flex-1">
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-[0.15em]
                    font-semibold
                    text-[#c98262]
                    dark:text-[#d99a7c]
                  "
                >
                  Learning insight
                </p>

                <h3
                  className="
                    font-display
                    text-xl
                    text-[#3e4038]
                    dark:text-[#f1f2ed]
                    mt-1
                  "
                >
                  {weakestTopic
                    ? `Focus on ${weakestTopic.topic}`
                    : totalTests === 0
                    ? "Start your learning journey"
                    : "Keep building your mastery"}
                </h3>

                <p
                  className="
                    text-sm
                    text-[#73766b]
                    dark:text-[#aeb3a9]
                    mt-2
                    leading-relaxed
                  "
                >
                  {weakestTopic
                    ? `${weakestTopic.topic} currently has an average score of ${weakestTopic.average_score}%. Reviewing this topic and taking another quiz can help improve your mastery.`
                    : totalTests === 0
                    ? "Upload a lecture, learn with your AI Professor, and complete your first quiz to start building your personalized Learning Twin."
                    : "Your performance data is being used to personalize how the AI Professor teaches you."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            QUICK START
        =================================================== */}

        <section className="mt-8">
          <h2
            className="
              font-display
              text-2xl
              text-[#3e4038]
              dark:text-[#f1f2ed]
              mb-5
            "
          >
            Continue learning
          </h2>

          <div
            className="
              bg-[#fffdf8]
              dark:bg-[#22251f]
              border
              border-[#e4ded2]
              dark:border-[#393e36]
              rounded-2xl
              p-8
              text-center
            "
          >
            <div
              className="
                w-14
                h-14
                rounded-2xl
                bg-[#e6ecdf]
                dark:bg-[#293127]
                flex
                items-center
                justify-center
                mx-auto
                mb-4
              "
            >
              <BookOpen
                size={30}
                className="
                  text-[#6f8061]
                  dark:text-[#a9ba9c]
                "
              />
            </div>

            <h3
              className="
                font-semibold
                text-[#3e4038]
                dark:text-[#f1f2ed]
              "
            >
              {totalTests > 0
                ? "Continue your learning journey"
                : "No lectures yet"}
            </h3>

            <p
              className="
                text-sm
                text-[#85877d]
                dark:text-[#aeb3a9]
                mt-2
              "
            >
              {totalTests > 0
                ? "Upload another lecture or continue studying your existing lectures."
                : "Upload your first lecture to start your personalized learning journey."}
            </p>

            <button
              type="button"
              onClick={handleUploadLecture}
              className="
                mt-5
                inline-flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-xl
                bg-[#6f8061]
                text-[#fffdf8]
                font-semibold
                hover:bg-[#5d6e51]
                hover:-translate-y-0.5
                transition-all
                shadow-sm
              "
            >
              <Upload size={18} />

              Upload a lecture

              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section className="mt-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => navigate("/upload")}
              className="
                p-5
                rounded-xl
                bg-[#fffdf8]
                dark:bg-[#22251f]
                border
                border-[#e4ded2]
                dark:border-[#393e36]
                text-left
                hover:border-[#aeb8a1]
                dark:hover:border-[#65715d]
                hover:-translate-y-0.5
                transition-all
              "
            >
              <Upload
                size={20}
                className="
                  text-[#6f8061]
                  dark:text-[#a9ba9c]
                  mb-3
                "
              />

              <p
                className="
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                Upload Lecture
              </p>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-[#aeb3a9]
                  mt-1
                "
              >
                Add a new learning resource
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/lectures")}
              className="
                p-5
                rounded-xl
                bg-[#fffdf8]
                dark:bg-[#22251f]
                border
                border-[#e4ded2]
                dark:border-[#393e36]
                text-left
                hover:border-[#aeb8a1]
                dark:hover:border-[#65715d]
                hover:-translate-y-0.5
                transition-all
              "
            >
              <BookOpen
                size={20}
                className="
                  text-[#6f8061]
                  dark:text-[#a9ba9c]
                  mb-3
                "
              />

              <p
                className="
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                My Lectures
              </p>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-[#aeb3a9]
                  mt-1
                "
              >
                View your uploaded lectures
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/progress")}
              className="
                p-5
                rounded-xl
                bg-[#fffdf8]
                dark:bg-[#22251f]
                border
                border-[#e4ded2]
                dark:border-[#393e36]
                text-left
                hover:border-[#aeb8a1]
                dark:hover:border-[#65715d]
                hover:-translate-y-0.5
                transition-all
              "
            >
              <Target
                size={20}
                className="
                  text-[#6f8061]
                  dark:text-[#a9ba9c]
                  mb-3
                "
              />

              <p
                className="
                  font-semibold
                  text-[#3e4038]
                  dark:text-[#f1f2ed]
                "
              >
                Learning Progress
              </p>

              <p
                className="
                  text-xs
                  text-[#85877d]
                  dark:text-[#aeb3a9]
                  mt-1
                "
              >
                Track your performance
              </p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        bg-[#fffdf8]
        dark:bg-[#22251f]
        border
        border-[#e4ded2]
        dark:border-[#393e36]
        rounded-xl
        p-5
        hover:-translate-y-1
        transition-all
        duration-200
      "
    >
      <div className="flex items-center justify-between">
        <div
          className="
            w-10
            h-10
            rounded-lg
            bg-[#e6ecdf]
            dark:bg-[#293127]
            text-[#6f8061]
            dark:text-[#a9ba9c]
            flex
            items-center
            justify-center
          "
        >
          <Icon size={19} />
        </div>

        <span
          className="
            text-2xl
            font-semibold
            text-[#3e4038]
            dark:text-[#f1f2ed]
          "
        >
          {value}
        </span>
      </div>

      <p
        className="
          text-sm
          text-[#85877d]
          dark:text-[#aeb3a9]
          mt-4
        "
      >
        {label}
      </p>
    </div>
  );
}


/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ label, value }) {
  return (
    <div
      className="
        p-4
        rounded-xl
        bg-[#f3efe6]
        dark:bg-[#292c27]
      "
    >
      <p
        className="
          text-xs
          text-[#85877d]
          dark:text-[#aeb3a9]
        "
      >
        {label}
      </p>

      <p
        className="
          text-xl
          font-bold
          text-[#3e4038]
          dark:text-[#f1f2ed]
          mt-1
        "
      >
        {value}
      </p>
    </div>
  );
}