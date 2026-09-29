import React, { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Brain,
  BookOpen,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";

import { Input, Alert } from "../components/UI";

// ============================================================
// LOGIN PAGE
// ============================================================

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const { darkMode } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
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
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const result = await authService.login(
        formData.email.trim(),
        formData.password,
        formData.rememberMe
      );

      if (!result.success) {
        setServerError(
          result.error || "Unable to sign in."
        );
        return;
      }

      console.log("LOGIN SUCCESS:", result);

      login(result.user);

      const destination =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(destination, {
        replace: true,
      });

    } catch (error) {
      console.error(
        "LOGIN PAGE ERROR:",
        error
      );

      setServerError(
        "Unable to connect to the backend."
      );

    } finally {
      setLoading(false);
    }
  };

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

        {/* Decorative circle */}

        <div
          className={`
            absolute
            -top-32
            -left-32
            w-[420px]
            h-[420px]
            rounded-full

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
            -bottom-40
            -right-32
            w-[500px]
            h-[500px]
            rounded-full

            ${
              darkMode
                ? "bg-[#c98262]/5"
                : "bg-[#c98262]/10"
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

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div
              className="
                w-10
                h-10
                rounded-lg
                bg-[#6f8061]
                flex
                items-center
                justify-center
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

          {/* MAIN */}

          <div className="max-w-xl">

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
              Welcome back
            </p>

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
              Continue your

              <br />

              <span className="text-[#8fa27a]">
                learning journey.
              </span>
            </h1>

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
              Your AI Professor remembers how
              you learn and adapts every lesson
              to help you improve.
            </p>

            <div className="mt-10 space-y-5">

              <LoginFeature
                icon={Brain}
                title="Adaptive Learning"
                text="Teaching strategies adjust to your performance."
                darkMode={darkMode}
              />

              <LoginFeature
                icon={BookOpen}
                title="Your Lectures"
                text="Learn directly from your uploaded course material."
                darkMode={darkMode}
              />

              <LoginFeature
                icon={Sparkles}
                title="Personalized AI"
                text="Get explanations designed around your learning needs."
                darkMode={darkMode}
              />

            </div>

          </div>

          {/* FOOTER */}

          <div
            className={`
              text-xs

              ${
                darkMode
                  ? "text-[#777a70]"
                  : "text-[#92958a]"
              }
            `}
          >
            Your knowledge. Your pace. Your Professor.
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

        <div className="w-full max-w-[450px]">

          {/* MOBILE LOGO */}

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
                rounded-lg
                bg-[#6f8061]
                flex
                items-center
                justify-center
              "
            >
              <span className="text-white font-semibold">
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

          {/* HEADER */}

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
              Student Login
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
              Welcome back.
            </h2>

            <p
              className={`
                mt-3

                ${
                  darkMode
                    ? "text-[#a1a49a]"
                    : "text-[#7d7d72]"
                }
              `}
            >
              Sign in to continue learning with
              your AI Professor.
            </p>

          </div>

          {/* ERROR */}

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

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

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

            {/* PASSWORD */}

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loading}
              autoComplete="current-password"
              darkMode={darkMode}
            />

            {/* REMEMBER */}

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <label
                className={`
                  flex
                  items-center
                  gap-2
                  text-sm
                  cursor-pointer

                  ${
                    darkMode
                      ? "text-[#a5a89e]"
                      : "text-[#73766b]"
                  }
                `}
              >

                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="
                    w-4
                    h-4
                    accent-[#6f8061]
                    cursor-pointer
                  "
                />

                Remember me

              </label>

              <button
                type="button"
                onClick={() =>
                  navigate("/forgot-password")
                }
                className="
                  text-sm
                  text-[#6f8061]
                  font-semibold
                  hover:text-[#c98262]
                  transition-colors
                "
              >
                Forgot password?
              </button>

            </div>

            {/* SIGN IN */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-[52px]
                mt-2
                rounded-lg
                bg-[#6f8061]
                text-white
                font-semibold
                tracking-wide
                hover:bg-[#5d6e51]
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                flex
                items-center
                justify-center
                gap-2
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

                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}

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

                ${
                  darkMode
                    ? "text-[#777a70]"
                    : "text-[#a09e95]"
                }
              `}
            >
              New to TwinLearn?
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

          {/* REGISTER */}

          <Link
            to="/register"
            className={`
              flex
              items-center
              justify-center
              gap-2
              w-full
              h-[52px]
              rounded-lg
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
            Create an account
            <ArrowRight size={17} />
          </Link>

          {/* BOTTOM */}

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
            Secure student authentication powered
            by TwinLearnAI.
          </p>

        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN FEATURE
// ============================================================

function LoginFeature({
  icon: Icon,
  title,
  text,
  darkMode,
}) {
  return (
    <div className="flex gap-4 items-start">

      <div
        className={`
          w-10
          h-10
          rounded-lg
          flex
          items-center
          justify-center
          shrink-0
          border

          ${
            darkMode
              ? `
                bg-[#292d26]
                border-[#3d4138]
              `
              : `
                bg-[#f5f0e7]
                border-[#ddd7ca]
              `
          }
        `}
      >

        <Icon
          size={18}
          className="text-[#6f8061]"
        />

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