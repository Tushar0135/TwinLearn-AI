import React, { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

import { Input, Alert } from "../components/UI";


// ============================================================
// API
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


// ============================================================
// REGISTER PAGE
// ============================================================

export default function RegisterPage() {

  const navigate = useNavigate();

  const { darkMode } = useTheme();


  // ==========================================================
  // FORM
  // ==========================================================

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });


  // ==========================================================
  // STATES
  // ==========================================================

  const [errors, setErrors] = useState({});

  const [serverError, setServerError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validate = () => {

    const newErrors = {};


    // Full name

    if (!formData.full_name.trim()) {

      newErrors.full_name =
        "Full name is required";

    } else if (
      formData.full_name.trim().length < 2
    ) {

      newErrors.full_name =
        "Name must contain at least 2 characters";

    }


    // Email

    if (!formData.email.trim()) {

      newErrors.email =
        "Email is required";

    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {

      newErrors.email =
        "Please enter a valid email";

    }


    // Password

    if (!formData.password) {

      newErrors.password =
        "Password is required";

    } else if (
      formData.password.length < 6
    ) {

      newErrors.password =
        "Password must contain at least 6 characters";

    }


    // Confirm password

    if (!formData.confirmPassword) {

      newErrors.confirmPassword =
        "Please confirm your password";

    } else if (
      formData.password !==
      formData.confirmPassword
    ) {

      newErrors.confirmPassword =
        "Passwords do not match";

    }


    return newErrors;
  };


  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));


    if (errors[name]) {

      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));

    }


    if (serverError) {

      setServerError("");

    }

  };


  // ==========================================================
  // REGISTER
  // ==========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    const validationErrors =
      validate();


    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {

      setErrors(
        validationErrors
      );

      return;

    }


    setLoading(true);

    setServerError("");


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              full_name:
                formData.full_name.trim(),

              email:
                formData.email.trim(),

              password:
                formData.password,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.detail ||
          "Registration failed."
        );

      }


      /*
       * Registration does NOT log the
       * student in.
       *
       * Register
       *     ↓
       * Verify OTP
       *     ↓
       * JWT
       *     ↓
       * Dashboard
       */

      navigate(
        "/verify-otp",
        {
          state: {
            email:
              data.email ||
              formData.email.trim(),
          },
        }
      );


    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      setServerError(
        error.message ||
        "Unable to connect to the server."
      );


    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // PASSWORD STRENGTH
  // ==========================================================

  const passwordLength =
    formData.password.length >= 6;

  const passwordHasNumber =
    /\d/.test(
      formData.password
    );

  const passwordHasLetter =
    /[a-zA-Z]/.test(
      formData.password
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div
      className={`
        min-h-screen
        flex
        transition-colors
        duration-300

        ${
          darkMode
            ? "bg-[#171916] text-[#eeeae1]"
            : "bg-[#f7f3ea] text-[#3e4038]"
        }
      `}
    >

      {/* =====================================================
          LEFT PANEL
      ===================================================== */}

      <div
        className={`
          hidden
          lg:flex
          lg:w-[48%]
          relative
          overflow-hidden

          ${
            darkMode
              ? "bg-[#20231e]"
              : "bg-[#e7eadf]"
          }
        `}
      >

        {/* Decorative circles */}

        <div
          className={`
            absolute
            -top-40
            -left-40
            w-[500px]
            h-[500px]
            rounded-full
            blur-2xl

            ${
              darkMode
                ? "bg-[#8fa27a]/10"
                : "bg-[#9aaa82]/20"
            }
          `}
        />

        <div
          className={`
            absolute
            -bottom-48
            -right-40
            w-[560px]
            h-[560px]
            rounded-full
            blur-3xl

            ${
              darkMode
                ? "bg-[#c98262]/5"
                : "bg-[#c98262]/10"
            }
          `}
        />

        <div
          className={`
            absolute
            top-[35%]
            right-[15%]
            w-20
            h-20
            rounded-full
            blur-xl

            ${
              darkMode
                ? "bg-[#ffffff]/5"
                : "bg-[#fffdf8]/40"
            }
          `}
        />


        <div
          className="
            relative
            z-10
            w-full
            p-14
            xl:p-20
            flex
            flex-col
            justify-between
          "
        >

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="flex items-center gap-3">

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

              <span
                className="
                  text-white
                  text-lg
                  font-semibold
                "
              >
                T
              </span>

            </div>


            <div>

              <div
                className={`
                  text-lg
                  font-semibold

                  ${
                    darkMode
                      ? "text-[#eeeae1]"
                      : "text-[#3e4038]"
                  }
                `}
              >
                TwinLearn
              </div>


              <div
                className={`
                  text-[10px]
                  uppercase
                  tracking-[0.2em]

                  ${
                    darkMode
                      ? "text-[#999d92]"
                      : "text-[#7d806f]"
                  }
                `}
              >
                Intelligent Learning
              </div>

            </div>

          </div>


          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div className="max-w-xl">

            {/* Badge */}

            <div
              className={`
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                border
                mb-6

                ${
                  darkMode
                    ? "bg-[#292d26] border-[#3d4138]"
                    : "bg-[#fffdf8]/70 border-[#d9dfd0]"
                }
              `}
            >

              <Sparkles
                size={14}
                className="text-[#c98262]"
              />

              <span
                className={`
                  text-xs
                  font-semibold
                  tracking-wide

                  ${
                    darkMode
                      ? "text-[#aab59c]"
                      : "text-[#657258]"
                  }
                `}
              >
                ADAPTIVE LEARNING
              </span>

            </div>


            {/* Small heading */}

            <p
              className="
                text-[#c98262]
                text-xs
                uppercase
                tracking-[0.25em]
                font-semibold
                mb-5
              "
            >
              Start your journey
            </p>


            {/* Main heading */}

            <h1
              className={`
                font-display
                text-5xl
                xl:text-6xl
                leading-[1.08]

                ${
                  darkMode
                    ? "text-[#f2eee5]"
                    : "text-[#3e4038]"
                }
              `}
            >

              Your learning

              <br />

              <span
                className={
                  darkMode
                    ? "text-[#9aaa82]"
                    : "text-[#6f8061]"
                }
              >
                becomes personal.
              </span>

            </h1>


            {/* Description */}

            <p
              className={`
                mt-6
                text-lg
                leading-relaxed
                max-w-lg

                ${
                  darkMode
                    ? "text-[#a7aaa0]"
                    : "text-[#73766b]"
                }
              `}
            >
              Create your learning profile and let
              TwinLearnAI adapt the teaching experience
              to your strengths, weaknesses, and pace.
            </p>


            {/* =================================================
                LEARNING FLOW
            ================================================= */}

            <div className="mt-10 space-y-5">

              <LearningStep
                number="01"
                title="Understand"
                text="Learn concepts with your AI Professor."
                darkMode={darkMode}
              />

              <LearningStep
                number="02"
                title="Practice"
                text="Test your understanding through adaptive quizzes."
                darkMode={darkMode}
              />

              <LearningStep
                number="03"
                title="Improve"
                text="Your learning strategy evolves with your performance."
                darkMode={darkMode}
              />

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className={`
              flex
              items-center
              gap-2
              text-xs

              ${
                darkMode
                  ? "text-[#777a70]"
                  : "text-[#92958a]"
              }
            `}
          >

            <ShieldCheck size={14} />

            <span>
              Intelligent learning starts here.
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          RIGHT PANEL
      ===================================================== */}

      <div
        className={`
          w-full
          lg:w-[52%]
          flex
          items-center
          justify-center
          px-6
          py-10

          ${
            darkMode
              ? "bg-[#171916]"
              : "bg-[#f7f3ea]"
          }
        `}
      >

        <div
          className="
            w-full
            max-w-[450px]
          "
        >

          {/* =================================================
              MOBILE LOGO
          ================================================= */}

          <div
            className="
              lg:hidden
              flex
              items-center
              gap-3
              mb-9
            "
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
              "
            >

              <span
                className="
                  text-white
                  font-semibold
                "
              >
                T
              </span>

            </div>


            <div
              className={`
                font-semibold
                text-xl

                ${
                  darkMode
                    ? "text-[#eeeae1]"
                    : "text-[#3e4038]"
                }
              `}
            >
              TwinLearn
            </div>

          </div>


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8">

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
              Create your account
            </p>


            <h2
              className={`
                font-display
                text-4xl

                ${
                  darkMode
                    ? "text-[#f2eee5]"
                    : "text-[#3e4038]"
                }
              `}
            >
              Begin your journey.
            </h2>


            <p
              className={`
                mt-3
                leading-relaxed

                ${
                  darkMode
                    ? "text-[#a1a49a]"
                    : "text-[#7d7d72]"
                }
              `}
            >
              Set up your profile to get started with
              personalized learning.
            </p>

          </div>


          {/* =================================================
              SERVER ERROR
          ================================================= */}

          {serverError && (

            <div className="mb-5">

              <Alert
                variant="error"
                message={serverError}
                onClose={() =>
                  setServerError("")
                }
              />

            </div>

          )}


          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* =================================================
                FULL NAME
            ================================================= */}

            <Input
              label="Full name"
              name="full_name"
              type="text"
              placeholder="Aarav Sharma"
              value={formData.full_name}
              onChange={handleChange}
              error={errors.full_name}
              disabled={loading}
              autoComplete="name"
              darkMode={darkMode}
            />


            {/* =================================================
                EMAIL
            ================================================= */}

            <Input
              label="University email"
              name="email"
              type="email"
              placeholder="you@university.edu"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={loading}
              autoComplete="email"
              darkMode={darkMode}
            />


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="relative">

              <Input
                label="Password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={loading}
                autoComplete="new-password"
                darkMode={darkMode}
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                className={`
                  absolute
                  right-3
                  top-[38px]
                  transition-colors

                  ${
                    darkMode
                      ? "text-[#858a7d] hover:text-[#9aaa82]"
                      : "text-[#92958a] hover:text-[#6f8061]"
                  }
                `}
                tabIndex={-1}
              >

                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </button>

            </div>


            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div className="relative">

              <Input
                label="Confirm password"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password again"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={loading}
                autoComplete="new-password"
                darkMode={darkMode}
              />


              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) =>
                      !previous
                  )
                }
                className={`
                  absolute
                  right-3
                  top-[38px]
                  transition-colors

                  ${
                    darkMode
                      ? "text-[#858a7d] hover:text-[#9aaa82]"
                      : "text-[#92958a] hover:text-[#6f8061]"
                  }
                `}
                tabIndex={-1}
              >

                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </button>

            </div>


            {/* =================================================
                PASSWORD REQUIREMENTS
            ================================================= */}

            <div
              className={`
                rounded-xl
                border
                p-4

                ${
                  darkMode
                    ? "border-[#353831] bg-[#20231e]"
                    : "border-[#e4ded2] bg-[#fffdf8]"
                }
              `}
            >

              <p
                className={`
                  text-xs
                  font-semibold
                  mb-3

                  ${
                    darkMode
                      ? "text-[#ddd9d0]"
                      : "text-[#5f6258]"
                  }
                `}
              >
                Password requirements
              </p>


              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-2
                "
              >

                <PasswordRequirement
                  valid={passwordLength}
                  text="6+ characters"
                  darkMode={darkMode}
                />

                <PasswordRequirement
                  valid={passwordHasLetter}
                  text="One letter"
                  darkMode={darkMode}
                />

                <PasswordRequirement
                  valid={passwordHasNumber}
                  text="One number"
                  darkMode={darkMode}
                />

              </div>

            </div>


            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="
                group
                w-full
                h-[52px]
                mt-2
                rounded-xl
                bg-[#6f8061]
                text-[#fffdf8]
                font-semibold
                tracking-wide
                flex
                items-center
                justify-center
                gap-2
                hover:bg-[#5d6e51]
                hover:-translate-y-0.5
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:hover:translate-y-0
              "
            >

              {loading ? (

                <>

                  <span
                    className="
                      w-4
                      h-4
                      border-2
                      border-white/40
                      border-t-white
                      rounded-full
                      animate-spin
                    "
                  />

                  Creating your account...

                </>

              ) : (

                <>

                  Create account

                  <ArrowRight
                    size={18}
                    className="
                      group-hover:translate-x-1
                      transition-transform
                    "
                  />

                </>

              )}

            </button>

          </form>


          {/* =================================================
              DIVIDER
          ================================================= */}

          <div
            className="
              flex
              items-center
              gap-4
              my-7
            "
          >

            <div
              className={`
                flex-1
                h-px

                ${
                  darkMode
                    ? "bg-[#353831]"
                    : "bg-[#e2dcd0]"
                }
              `}
            />


            <span
              className={`
                text-xs
                uppercase
                tracking-wider
                whitespace-nowrap

                ${
                  darkMode
                    ? "text-[#777a70]"
                    : "text-[#a09e95]"
                }
              `}
            >
              Already learning with us?
            </span>


            <div
              className={`
                flex-1
                h-px

                ${
                  darkMode
                    ? "bg-[#353831]"
                    : "bg-[#e2dcd0]"
                }
              `}
            />

          </div>


          {/* =================================================
              LOGIN
          ================================================= */}

          <Link
            to="/login"
            className={`
              group
              flex
              items-center
              justify-center
              gap-2
              w-full
              h-[52px]
              rounded-xl
              border
              font-semibold
              transition-all

              ${
                darkMode
                  ? `
                    border-[#41443c]
                    text-[#ddd9d0]
                    hover:bg-[#242720]
                    hover:border-[#62685a]
                  `
                  : `
                    border-[#cfc9bc]
                    text-[#4d5047]
                    hover:bg-[#eee9df]
                    hover:border-[#aeb5a1]
                  `
              }
            `}
          >

            Sign in instead

            <ArrowRight
              size={17}
              className="
                group-hover:translate-x-1
                transition-transform
              "
            />

          </Link>


          {/* =================================================
              PRIVACY
          ================================================= */}

          <p
            className={`
              text-center
              text-xs
              mt-6
              leading-relaxed

              ${
                darkMode
                  ? "text-[#6f7269]"
                  : "text-[#aaa79d]"
              }
            `}
          >
            By creating an account, you agree to use
            TwinLearnAI responsibly for your learning.
          </p>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// LEARNING STEP
// ============================================================

function LearningStep({
  number,
  title,
  text,
  darkMode,
}) {

  return (

    <div className="flex gap-4 items-start">

      <div
        className={`
          w-9
          h-9
          rounded-full
          border
          flex
          items-center
          justify-center
          shrink-0

          ${
            darkMode
              ? "border-[#58604f] bg-[#292d26]"
              : "border-[#aeb8a1] bg-[#e7eadf]"
          }
        `}
      >

        <span
          className={`
            text-xs
            font-semibold

            ${
              darkMode
                ? "text-[#9aaa82]"
                : "text-[#6f8061]"
            }
          `}
        >
          {number}
        </span>

      </div>


      <div>

        <h3
          className={`
            text-sm
            font-semibold

            ${
              darkMode
                ? "text-[#ddd9d0]"
                : "text-[#4a4d43]"
            }
          `}
        >
          {title}
        </h3>


        <p
          className={`
            text-sm
            mt-1

            ${
              darkMode
                ? "text-[#92958a]"
                : "text-[#85877d]"
            }
          `}
        >
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// PASSWORD REQUIREMENT
// ============================================================

function PasswordRequirement({
  valid,
  text,
  darkMode,
}) {

  return (

    <div className="flex items-center gap-2">

      <div
        className={`
          w-5
          h-5
          rounded-full
          flex
          items-center
          justify-center
          transition-all

          ${
            valid
              ? darkMode
                ? "bg-[#34402e] text-[#9aaa82]"
                : "bg-[#e6ecdf] text-[#6f8061]"
              : darkMode
                ? "bg-[#30332d] text-[#777a70]"
                : "bg-[#eee9df] text-[#aaa69c]"
          }
        `}
      >

        <Check
          size={12}
          strokeWidth={3}
        />

      </div>


      <span
        className={`
          text-xs

          ${
            valid
              ? darkMode
                ? "text-[#aab59c]"
                : "text-[#657258]"
              : darkMode
                ? "text-[#777a70]"
                : "text-[#92958a]"
          }
        `}
      >
        {text}
      </span>

    </div>
  );
}