import React from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/UI";

import {
  ArrowLeft,
  ArrowRight,
  Home,
  Search,
  Sparkles,
} from "lucide-react";

export default function NotFoundPage() {
  return (
    <div
      className="
        min-h-screen
        bg-[#f7f3ea]
        dark:bg-gray-950
        flex
        items-center
        justify-center
        p-4
        transition-colors
        duration-300
      "
    >
      <div className="w-full max-w-3xl">
        {/* MAIN CARD */}

        <div
          className="
            bg-[#fffdf8]
            dark:bg-gray-900
            border
            border-[#e4ded2]
            dark:border-gray-800
            rounded-3xl
            shadow-sm
            dark:shadow-none
            p-8
            md:p-12
            text-center
          "
        >
          {/* ICON */}

          <div
            className="
              w-16
              h-16
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
            <Search
              size={28}
              className="
                text-[#6f8061]
                dark:text-[#aeb8a1]
              "
            />
          </div>

          {/* EYEBROW */}

          <p
            className="
              text-xs
              uppercase
              tracking-[0.2em]
              text-[#c98262]
              dark:text-[#e2a082]
              font-semibold
              mb-3
            "
          >
            TwinLearnAI
          </p>

          {/* 404 */}

          <h1
            className="
              font-display
              text-8xl
              md:text-9xl
              leading-none
              text-[#6f8061]
              dark:text-[#aeb8a1]
              mb-4
            "
          >
            404
          </h1>

          {/* TITLE */}

          <h2
            className="
              font-display
              text-3xl
              md:text-4xl
              text-[#3e4038]
              dark:text-gray-100
              mb-3
            "
          >
            This page wandered off.
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              text-base
              md:text-lg
              text-[#85877d]
              dark:text-gray-400
              max-w-xl
              mx-auto
              leading-relaxed
            "
          >
            We couldn't find the page you're looking for.
            It may have been moved, deleted, or the link
            might be incorrect.
          </p>

          {/* ACTIONS */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-3
              justify-center
              mt-8
            "
          >
            <Link to="/">
              <Button
                variant="primary"
                size="lg"
                className="
                  w-full
                  sm:w-auto
                  min-w-[150px]
                  justify-center
                  gap-2
                  bg-[#6f8061]
                  hover:bg-[#5d6e51]
                "
              >
                <Home size={19} />
                Go Home
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button
                variant="secondary"
                size="lg"
                className="
                  w-full
                  sm:w-auto
                  min-w-[150px]
                  justify-center
                  gap-2
                  bg-[#f5f1e8]
                  dark:bg-gray-800
                  border
                  border-[#d8d1c4]
                  dark:border-gray-700
                  text-[#4d5047]
                  dark:text-gray-200
                  hover:bg-[#eee9df]
                  dark:hover:bg-gray-700
                "
              >
                Dashboard
                <ArrowRight size={19} />
              </Button>
            </Link>
          </div>

          {/* DIVIDER */}

          <div
            className="
              flex
              items-center
              gap-4
              my-10
            "
          >
            <div
              className="
                h-px
                flex-1
                bg-[#e4ded2]
                dark:bg-gray-800
              "
            />

            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-[#faf7f0]
                dark:bg-gray-800
                border
                border-[#e4ded2]
                dark:border-gray-700
                flex
                items-center
                justify-center
              "
            >
              <Sparkles
                size={16}
                className="
                  text-[#c98262]
                  dark:text-[#e2a082]
                "
              />
            </div>

            <div
              className="
                h-px
                flex-1
                bg-[#e4ded2]
                dark:bg-gray-800
              "
            />
          </div>

          {/* HELPFUL LINKS */}

          <div>
            <p
              className="
                text-sm
                font-semibold
                text-[#4d5047]
                dark:text-gray-200
                mb-4
              "
            >
              Maybe you were looking for...
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-2
                justify-center
              "
            >
              {[
                {
                  label: "My Lectures",
                  href: "/lectures",
                },
                {
                  label: "Upload Lecture",
                  href: "/upload",
                },
                {
                  label: "AI Professor",
                  href: "/ai-professor",
                },
                {
                  label: "Topics",
                  href: "/topics",
                },
                {
                  label: "Progress",
                  href: "/progress",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="
                    px-4
                    py-2
                    rounded-xl
                    bg-[#faf7f0]
                    dark:bg-gray-800
                    border
                    border-[#e4ded2]
                    dark:border-gray-700
                    text-sm
                    font-medium
                    text-[#6f8061]
                    dark:text-[#aeb8a1]
                    hover:bg-[#e6ecdf]
                    dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* BACK */}

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-[#85877d]
              dark:text-gray-400
              hover:text-[#4d5047]
              dark:hover:text-gray-200
              transition-colors
            "
          >
            <ArrowLeft size={16} />
            Go back to the previous page
          </button>
        </div>
      </div>
    </div>
  );
}