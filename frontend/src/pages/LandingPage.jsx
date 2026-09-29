import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  Trophy,
  Sparkles,
  Play,
  Check,
  Upload,
  MessageCircle,
  BarChart3,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeStrategy, setActiveStrategy] = useState(0);

  const strategies = [
    "Story Based",
    "Diagram Based",
    "Step by Step",
    "Code Based",
    "Example Based",
    "Exam Oriented",
    "Interview Oriented",
    "Simple",
    "Detailed",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStrategy((prev) => (prev + 1) % strategies.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
        min-h-screen
        bg-[#f7f3ea]
        dark:bg-gray-950
        text-[#3e4038]
        dark:text-gray-100
        overflow-hidden
        transition-colors
        duration-300
      "
    >
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav
        className="
          fixed
          top-0
          left-0
          right-0
          z-50
          bg-[#f7f3ea]/85
          dark:bg-gray-950/90
          backdrop-blur-xl
          border-b
          border-[#ded9cd]
          dark:border-gray-800
          transition-colors
          duration-300
        "
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[76px] flex items-center justify-between">
          {/* Logo */}

          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="flex items-center gap-3"
          >
            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-[#6f8061]
                flex
                items-center
                justify-center
                shadow-sm
              "
            >
              <span className="text-[#fffdf8] text-lg font-semibold">
                T
              </span>
            </div>

            <div className="text-left">
              <div
                className="
                  font-display
                  text-lg
                  font-semibold
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                TwinLearn
              </div>

              <div
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.2em]
                  text-[#85877b]
                  dark:text-gray-500
                "
              >
                Intelligent Learning
              </div>
            </div>
          </button>

          {/* Desktop navigation */}

          <div
            className="
              hidden
              md:flex
              items-center
              gap-8
              text-sm
              text-[#73766b]
              dark:text-gray-400
            "
          >
            <a
              href="#features"
              className="
                hover:text-[#6f8061]
                dark:hover:text-[#aeb8a1]
                transition-colors
              "
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="
                hover:text-[#6f8061]
                dark:hover:text-[#aeb8a1]
                transition-colors
              "
            >
              How it works
            </a>

            <a
              href="#strategies"
              className="
                hover:text-[#6f8061]
                dark:hover:text-[#aeb8a1]
                transition-colors
              "
            >
              Teaching
            </a>
          </div>

          {/* Actions */}

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="
                hidden
                sm:block
                px-4
                py-2.5
                text-sm
                font-medium
                text-[#55584f]
                dark:text-gray-300
                hover:text-[#6f8061]
                dark:hover:text-[#aeb8a1]
                transition-colors
              "
            >
              Sign in
            </button>

            <button
              onClick={() => navigate("/register")}
              className="
                px-5
                py-2.5
                rounded-lg
                bg-[#6f8061]
                text-[#fffdf8]
                text-sm
                font-semibold
                hover:bg-[#5d6e51]
                dark:hover:bg-[#7f906f]
                transition-all
                hover:-translate-y-0.5
                shadow-sm
              "
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main>
        <section className="relative min-h-screen flex items-center pt-24">
          {/* Background organic shapes */}

          <div
            className="
              absolute
              -top-40
              -left-40
              w-[550px]
              h-[550px]
              rounded-full
              bg-[#a7b394]/20
              dark:bg-[#6f8061]/10
              blur-3xl
            "
          />

          <div
            className="
              absolute
              top-40
              -right-40
              w-[500px]
              h-[500px]
              rounded-full
              bg-[#d79a7d]/15
              dark:bg-[#c98262]/10
              blur-3xl
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-1/3
              w-[300px]
              h-[300px]
              rounded-full
              bg-[#dfe4d7]/40
              dark:bg-[#6f8061]/10
              blur-3xl
            "
          />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
              {/* LEFT */}

              <div className="max-w-2xl">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    border
                    border-[#cbd3c2]
                    dark:border-gray-700
                    bg-[#edf0e8]
                    dark:bg-gray-900
                    text-[#657359]
                    dark:text-[#aeb8a1]
                    text-xs
                    uppercase
                    tracking-[0.16em]
                    font-semibold
                    animate-fade-up
                  "
                >
                  <Sparkles size={14} />

                  AI-powered personalized learning
                </div>

                <h1
                  className="
                    font-display
                    text-[54px]
                    sm:text-[68px]
                    lg:text-[76px]
                    xl:text-[88px]
                    leading-[0.96]
                    tracking-[-0.045em]
                    mt-7
                    text-[#3e4038]
                    dark:text-gray-100
                    animate-fade-up
                  "
                >
                  Learn
                  <br />

                  <span className="text-[#6f8061] dark:text-[#aeb8a1]">
                    your way.
                  </span>
                </h1>

                <p
                  className="
                    mt-7
                    text-lg
                    lg:text-xl
                    leading-relaxed
                    text-[#74776d]
                    dark:text-gray-400
                    max-w-xl
                    animate-fade-up-delay
                  "
                >
                  TwinLearnAI turns your lectures into a personalized
                  learning experience. Your AI Professor adapts its teaching
                  style based on how you actually learn.
                </p>

                {/* CTA */}

                <div className="flex flex-col sm:flex-row gap-4 mt-9">
                  <button
                    onClick={() => navigate("/register")}
                    className="
                      group
                      flex
                      items-center
                      justify-center
                      gap-3
                      px-7
                      py-4
                      rounded-xl
                      bg-[#6f8061]
                      text-[#fffdf8]
                      font-semibold
                      hover:bg-[#5d6e51]
                      dark:hover:bg-[#7f906f]
                      transition-all
                      hover:-translate-y-1
                      shadow-lg
                      shadow-[#6f8061]/10
                    "
                  >
                    Start learning free

                    <ArrowRight
                      size={19}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({
                          behavior: "smooth",
                        })
                    }
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      px-7
                      py-4
                      rounded-xl
                      border
                      border-[#cbc6ba]
                      dark:border-gray-700
                      text-[#55584f]
                      dark:text-gray-300
                      font-semibold
                      hover:bg-[#eee9df]
                      dark:hover:bg-gray-800
                      transition-all
                    "
                  >
                    <Play size={17} />

                    See how it works
                  </button>
                </div>

                {/* Trust */}

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-6
                    mt-9
                    text-sm
                    text-[#898b82]
                    dark:text-gray-400
                  "
                >
                  <div className="flex items-center gap-2">
                    <Check
                      size={16}
                      className="text-[#6f8061] dark:text-[#aeb8a1]"
                    />
                    Personalized teaching
                  </div>

                  <div className="flex items-center gap-2">
                    <Check
                      size={16}
                      className="text-[#6f8061] dark:text-[#aeb8a1]"
                    />
                    Adaptive quizzes
                  </div>

                  <div className="flex items-center gap-2">
                    <Check
                      size={16}
                      className="text-[#6f8061] dark:text-[#aeb8a1]"
                    />
                    Progress tracking
                  </div>
                </div>
              </div>

              {/* RIGHT - AI PROFESSOR VISUAL */}

              <div className="relative hidden lg:block">
                {/* Outer floating circle */}

                <div
                  className="
                    absolute
                    -inset-10
                    rounded-full
                    border
                    border-[#d9ded2]
                    dark:border-gray-800
                    animate-spin-slow
                  "
                />

                <div
                  className="
                    absolute
                    -inset-20
                    rounded-full
                    border
                    border-[#e4e0d6]
                    dark:border-gray-800
                    animate-spin-reverse
                  "
                />

                {/* Main card */}

                <div
                  className="
                    relative
                    mx-auto
                    w-[430px]
                    rounded-[28px]
                    bg-[#fffdf8]/90
                    dark:bg-gray-900/90
                    backdrop-blur-xl
                    border
                    border-[#ded9cd]
                    dark:border-gray-800
                    shadow-[0_30px_80px_rgba(80,85,65,0.12)]
                    dark:shadow-none
                    p-7
                    animate-float
                  "
                >
                  {/* Header */}

                  <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-11
                          h-11
                          rounded-full
                          bg-[#e3e9dc]
                          dark:bg-gray-800
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Brain
                          size={22}
                          className="text-[#6f8061] dark:text-[#aeb8a1]"
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-[#4b4e45] dark:text-gray-200">
                          AI Professor
                        </p>

                        <p className="text-xs text-[#92948b] dark:text-gray-500">
                          Adapting to you
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#82956e] dark:bg-[#aeb8a1] animate-pulse" />

                      <span className="text-xs text-[#7f8278] dark:text-gray-400">
                        Online
                      </span>
                    </div>
                  </div>

                  {/* AI message */}

                  <div className="rounded-2xl bg-[#f0f2eb] dark:bg-gray-800 p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#81877a] dark:text-gray-500 mb-2">
                      Today's lesson
                    </p>

                    <p className="font-display text-xl text-[#464940] dark:text-gray-100 leading-snug">
                      Let's understand
                      <br />

                      <span className="text-[#6f8061] dark:text-[#aeb8a1]">
                        Neural Networks
                      </span>
                    </p>

                    <p className="text-sm text-[#85877d] dark:text-gray-400 mt-3 leading-relaxed">
                      I'll explain this using examples because that works
                      best for you.
                    </p>
                  </div>

                  {/* Strategy */}

                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[#8a8d83] dark:text-gray-500">
                        Current teaching style
                      </span>

                      <span className="text-xs font-semibold text-[#6f8061] dark:text-[#aeb8a1]">
                        Adaptive
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-[#e5e2d9] dark:bg-gray-800 overflow-hidden">
                      <div className="h-full w-[78%] bg-[#6f8061] dark:bg-[#7f906f] rounded-full transition-all duration-700" />
                    </div>
                  </div>

                  {/* Strategy pills */}

                  <div className="flex flex-wrap gap-2 mt-6">
                    {strategies.slice(0, 3).map((strategy, index) => (
                      <div
                        key={strategy}
                        className={`
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          border
                          transition-all
                          ${
                            index === activeStrategy % 3
                              ? "bg-[#e2e9db] dark:bg-gray-800 border-[#bdc9b3] dark:border-gray-700 text-[#617052] dark:text-[#c8d2c0]"
                              : "bg-[#faf8f2] dark:bg-gray-900 border-[#e2ded4] dark:border-gray-800 text-[#96988f] dark:text-gray-500"
                          }
                        `}
                      >
                        {strategy}
                      </div>
                    ))}
                  </div>

                  {/* Bottom stats */}

                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <MiniStat value="84%" label="Mastery" />

                    <MiniStat value="12" label="Topics" />

                    <MiniStat value="A" label="Progress" />
                  </div>
                </div>

                {/* Floating notification */}

                <div
                  className="
                    absolute
                    -right-8
                    top-20
                    bg-[#fffdf8]
                    dark:bg-gray-900
                    border
                    border-[#ded9cd]
                    dark:border-gray-800
                    rounded-2xl
                    shadow-lg
                    dark:shadow-none
                    p-4
                    animate-float-delayed
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f0e1d9] dark:bg-orange-950/30 flex items-center justify-center">
                      <Trophy
                        size={17}
                        className="text-[#b56f50] dark:text-[#e2a082]"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-[#999b92] dark:text-gray-500">
                        Topic mastered
                      </p>

                      <p className="text-sm font-semibold text-[#55584f] dark:text-gray-200">
                        Backpropagation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating upload */}

                <div
                  className="
                    absolute
                    -left-10
                    bottom-16
                    bg-[#fffdf8]
                    dark:bg-gray-900
                    border
                    border-[#ded9cd]
                    dark:border-gray-800
                    rounded-2xl
                    shadow-lg
                    dark:shadow-none
                    px-4
                    py-3
                    animate-float-delayed-2
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8ecdf] dark:bg-gray-800 flex items-center justify-center">
                      <Upload
                        size={17}
                        className="text-[#6f8061] dark:text-[#aeb8a1]"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-[#999b92] dark:text-gray-500">
                        Lecture uploaded
                      </p>

                      <p className="text-sm font-semibold text-[#55584f] dark:text-gray-200">
                        CNN Architecture.pdf
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}

          <div
            className="
              absolute
              bottom-7
              left-1/2
              -translate-x-1/2
              hidden
              md:flex
              flex-col
              items-center
              gap-2
              text-[#9a9b92]
              dark:text-gray-600
            "
          >
            <span className="text-[10px] uppercase tracking-[0.2em]">
              Explore
            </span>

            <ChevronDown size={17} className="animate-bounce" />
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section
          id="features"
          className="
            py-28
            border-t
            border-[#ded9cd]
            dark:border-gray-800
            transition-colors
            duration-300
          "
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <SectionHeading
              eyebrow="One intelligent learning system"
              title={
                <>
                  Everything you need
                  <br />
                  <span className="text-[#6f8061] dark:text-[#aeb8a1]">
                    to actually understand.
                  </span>
                </>
              }
              description="TwinLearnAI connects your lectures, learning strategy, assessments, and performance into one adaptive experience."
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
              <FeatureCard
                icon={BookOpen}
                number="01"
                title="Bring your lectures"
                description="Upload PDFs, PowerPoints, documents, audio, video, or YouTube lectures and let the system process them automatically."
              />

              <FeatureCard
                icon={Brain}
                number="02"
                title="Learn with AI"
                description="Your AI Professor retrieves the right lecture context and explains concepts using a teaching strategy suited to you."
              />

              <FeatureCard
                icon={Zap}
                number="03"
                title="Adaptive teaching"
                description="The system analyzes your performance and automatically selects how the next concept should be taught."
              />

              <FeatureCard
                icon={Trophy}
                number="04"
                title="Test yourself"
                description="Generate quizzes from your lecture content and evaluate your understanding after every learning session."
              />

              <FeatureCard
                icon={BarChart3}
                number="05"
                title="Know your progress"
                description="See topic mastery, weak areas, test performance, and your learning history in one place."
              />

              <FeatureCard
                icon={MessageCircle}
                number="06"
                title="Keep improving"
                description="Every assessment gives the Learning Twin more information about what works best for you."
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section
          id="how-it-works"
          className="
            py-28
            bg-[#e9ece4]
            dark:bg-gray-900
            transition-colors
            duration-300
          "
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <SectionHeading
              eyebrow="The learning loop"
              title={
                <>
                  From lecture to
                  <br />
                  <span className="text-[#6f8061] dark:text-[#aeb8a1]">
                    mastery.
                  </span>
                </>
              }
              description="A continuous learning cycle that gets smarter as you use it."
            />

            <div className="grid md:grid-cols-4 gap-5 mt-16">
              <ProcessCard
                number="01"
                icon={Upload}
                title="Upload"
                text="Give TwinLearnAI your lecture material."
              />

              <ProcessCard
                number="02"
                icon={Brain}
                title="Understand"
                text="AI processes, chunks, retrieves, and understands the content."
              />

              <ProcessCard
                number="03"
                icon={MessageCircle}
                title="Learn"
                text="Your AI Professor teaches using the right strategy."
              />

              <ProcessCard
                number="04"
                icon={BarChart3}
                title="Adapt"
                text="Your performance changes what happens next."
              />
            </div>

            {/* Connection line */}

            <div className="hidden md:block relative mt-[-155px] mb-[125px] px-[12%] pointer-events-none">
              <div className="h-px bg-[#cbd2c2] dark:bg-gray-700" />
            </div>
          </div>
        </section>

        {/* =====================================================
            TEACHING STRATEGIES
        ===================================================== */}

        <section
          id="strategies"
          className="
            py-28
            transition-colors
            duration-300
          "
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Left */}

              <div>
                <p
                  className="
                    text-[#b56f50]
                    dark:text-[#e2a082]
                    text-xs
                    uppercase
                    tracking-[0.2em]
                    font-semibold
                    mb-5
                  "
                >
                  Adaptive intelligence
                </p>

                <h2
                  className="
                    font-display
                    text-5xl
                    lg:text-6xl
                    leading-[1]
                    tracking-tight
                    text-[#3e4038]
                    dark:text-gray-100
                  "
                >
                  One student.
                  <br />

                  <span className="text-[#6f8061] dark:text-[#aeb8a1]">
                    Nine ways to teach.
                  </span>
                </h2>

                <p
                  className="
                    mt-7
                    text-lg
                    text-[#777a70]
                    dark:text-gray-400
                    leading-relaxed
                    max-w-lg
                  "
                >
                  Not every concept needs the same explanation. TwinLearnAI
                  dynamically chooses from multiple teaching strategies based
                  on your performance, topic difficulty, and learning needs.
                </p>

                <button
                  onClick={() => navigate("/register")}
                  className="
                    mt-8
                    inline-flex
                    items-center
                    gap-2
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                    font-semibold
                    hover:gap-3
                    transition-all
                  "
                >
                  Build your learning twin

                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Strategy visual */}

              <div className="relative">
                <div
                  className="
                    bg-[#fffdf8]
                    dark:bg-gray-900
                    border
                    border-[#ded9cd]
                    dark:border-gray-800
                    rounded-[28px]
                    p-8
                    shadow-[0_25px_70px_rgba(80,85,65,0.08)]
                    dark:shadow-none
                  "
                >
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#999b92] dark:text-gray-500">
                        Current strategy
                      </p>

                      <p
                        key={activeStrategy}
                        className="
                          font-display
                          text-3xl
                          text-[#4b4e45]
                          dark:text-gray-100
                          mt-2
                          animate-strategy
                        "
                      >
                        {strategies[activeStrategy]}
                      </p>
                    </div>

                    <Sparkles
                      className="text-[#c98262] dark:text-[#e2a082]"
                      size={25}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {strategies.map((strategy, index) => (
                      <div
                        key={strategy}
                        className={`
                          rounded-xl
                          border
                          p-4
                          text-center
                          text-xs
                          transition-all
                          duration-500
                          ${
                            index === activeStrategy
                              ? "bg-[#e5eadf] dark:bg-gray-800 border-[#bcc8b2] dark:border-gray-700 text-[#617052] dark:text-[#c8d2c0] scale-[1.03]"
                              : "bg-[#faf8f2] dark:bg-gray-950 border-[#e4dfd5] dark:border-gray-800 text-[#8d8f87] dark:text-gray-500"
                          }
                        `}
                      >
                        {strategy}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="px-6 lg:px-10 pb-28">
          <div className="max-w-7xl mx-auto">
            <div
              className="
                relative
                overflow-hidden
                rounded-[32px]
                bg-[#6f8061]
                dark:bg-[#59694f]
                px-8
                py-20
                lg:px-20
                text-center
              "
            >
              <div className="absolute -top-40 -right-40 w-[450px] h-[450px] rounded-full bg-white/5" />

              <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full bg-[#3e4d34]/20" />

              <div className="relative z-10">
                <p
                  className="
                    text-[#dce5d5]
                    dark:text-[#d6dfcf]
                    text-xs
                    uppercase
                    tracking-[0.2em]
                    font-semibold
                    mb-5
                  "
                >
                  Your next lesson starts here
                </p>

                <h2 className="font-display text-4xl lg:text-6xl text-[#fffdf8] leading-tight">
                  Stop studying harder.
                  <br />
                  Start learning smarter.
                </h2>

                <p
                  className="
                    text-[#e1e7dc]
                    dark:text-gray-200
                    text-lg
                    max-w-2xl
                    mx-auto
                    mt-6
                    leading-relaxed
                  "
                >
                  Upload your first lecture and experience an AI Professor
                  that adapts to the way you learn.
                </p>

                <button
                  onClick={() => navigate("/register")}
                  className="
                    mt-9
                    inline-flex
                    items-center
                    gap-3
                    px-8
                    py-4
                    rounded-xl
                    bg-[#fffdf8]
                    text-[#59674e]
                    font-semibold
                    hover:bg-[#f1eee5]
                    dark:hover:bg-gray-100
                    transition-all
                    hover:-translate-y-1
                    shadow-lg
                  "
                >
                  Get started free

                  <ArrowRight size={19} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className="
          border-t
          border-[#ded9cd]
          dark:border-gray-800
          py-10
          transition-colors
          duration-300
        "
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6f8061] flex items-center justify-center">
              <span className="text-white font-semibold">T</span>
            </div>

            <span className="font-display font-semibold text-[#3e4038] dark:text-gray-100">
              TwinLearn
            </span>
          </div>

          <p className="text-sm text-[#96988f] dark:text-gray-500">
            Intelligent learning, personalized for you.
          </p>

          <p className="text-xs text-[#aaa79d] dark:text-gray-600">
            © 2026 TwinLearnAI
          </p>
        </div>
      </footer>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes strategy {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-up {
          animation: fadeUp 0.8s ease-out both;
        }

        .animate-fade-up-delay {
          animation: fadeUp 0.8s ease-out 0.15s both;
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 5s ease-in-out 1s infinite;
        }

        .animate-float-delayed-2 {
          animation: float 5s ease-in-out 2s infinite;
        }

        .animate-spin-slow {
          animation: spinSlow 35s linear infinite;
        }

        .animate-spin-reverse {
          animation: spinReverse 45s linear infinite;
        }

        .animate-strategy {
          animation: strategy 0.4s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up,
          .animate-fade-up-delay,
          .animate-float,
          .animate-float-delayed,
          .animate-float-delayed-2,
          .animate-spin-slow,
          .animate-spin-reverse,
          .animate-strategy {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="max-w-3xl">
      <p
        className="
          text-[#b56f50]
          dark:text-[#e2a082]
          text-xs
          uppercase
          tracking-[0.2em]
          font-semibold
          mb-5
        "
      >
        {eyebrow}
      </p>

      <h2
        className="
          font-display
          text-4xl
          lg:text-6xl
          leading-[1.02]
          tracking-tight
          text-[#3e4038]
          dark:text-gray-100
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-6
          text-lg
          text-[#7a7d73]
          dark:text-gray-400
          leading-relaxed
          max-w-2xl
        "
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon: Icon,
  number,
  title,
  description,
}) {
  return (
    <div
      className="
        group
        p-7
        rounded-2xl
        bg-[#fffdf8]
        dark:bg-gray-900
        border
        border-[#ded9cd]
        dark:border-gray-800
        hover:border-[#bfcab5]
        dark:hover:border-gray-700
        hover:-translate-y-1
        transition-all
        duration-300
        hover:shadow-[0_20px_45px_rgba(80,85,65,0.08)]
        dark:hover:shadow-none
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-[#e8ece1]
            dark:bg-gray-800
            flex
            items-center
            justify-center
          "
        >
          <Icon
            size={22}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
              group-hover:scale-110
              transition-transform
            "
          />
        </div>

        <span className="text-xs font-mono text-[#b2b0a7] dark:text-gray-600">
          {number}
        </span>
      </div>

      <h3 className="font-display text-xl mt-7 text-[#484b43] dark:text-gray-200">
        {title}
      </h3>

      <p className="text-sm text-[#85877d] dark:text-gray-400 leading-relaxed mt-3">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   PROCESS CARD
========================================================= */

function ProcessCard({
  number,
  icon: Icon,
  title,
  text,
}) {
  return (
    <div
      className="
        relative
        bg-[#fffdf8]/75
        dark:bg-gray-950/60
        border
        border-[#d7ddd0]
        dark:border-gray-800
        rounded-2xl
        p-7
      "
    >
      <div className="flex items-center justify-between">
        <div
          className="
            w-11
            h-11
            rounded-xl
            bg-[#dfe7d8]
            dark:bg-gray-800
            flex
            items-center
            justify-center
          "
        >
          <Icon
            size={20}
            className="text-[#657359] dark:text-[#aeb8a1]"
          />
        </div>

        <span className="font-mono text-xs text-[#9b9d94] dark:text-gray-600">
          {number}
        </span>
      </div>

      <h3 className="font-display text-xl mt-7 text-[#4b4e45] dark:text-gray-200">
        {title}
      </h3>

      <p className="text-sm text-[#7f8278] dark:text-gray-400 leading-relaxed mt-3">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ value, label }) {
  return (
    <div
      className="
        rounded-xl
        bg-[#faf8f2]
        dark:bg-gray-800
        border
        border-[#e3ded4]
        dark:border-gray-700
        p-3
        text-center
      "
    >
      <p className="font-display text-lg font-semibold text-[#5d6c53] dark:text-[#aeb8a1]">
        {value}
      </p>

      <p className="text-[10px] text-[#999b92] dark:text-gray-500 mt-1">
        {label}
      </p>
    </div>
  );
}