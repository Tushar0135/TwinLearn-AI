import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import { DashboardLayout } from "../components/Layout";

import {
  Card,
  Input,
  Select,
  Alert,
} from "../components/UI";

import {
  Moon,
  Sun,
  LogOut,
  Mail,
  User,
  MapPin,
  BookOpen,
  Sparkles,
  Bell,
  Shield,
  Save,
  CheckCircle,
  Camera,
} from "lucide-react";

import {
  teachingStrategies,
  mockUserProfile,
} from "../data/mockData";

/* ============================================================
   STORAGE KEYS
============================================================ */

const AUTH_STORAGE_KEY = "twinalai_auth";
const PREFERENCES_STORAGE_KEY = "twinalai_preferences";
const AVATAR_STORAGE_KEY = "twinalai_avatar";

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function SettingsPage() {
  const navigate = useNavigate();

  const {
    user,
    login,
    logout,
  } = useAuth();

  const {
    darkMode,
    enableDarkMode,
    disableDarkMode,
  } = useTheme();

  const avatarInputRef = useRef(null);

  /* ==========================================================
     PROFILE
  ========================================================== */

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    university: user?.university || "",
    course: user?.course || "",
  });

  /* ==========================================================
     AVATAR
  ========================================================== */

  const [avatar, setAvatar] = useState(() => {
    return (
      user?.avatar ||
      localStorage.getItem(AVATAR_STORAGE_KEY) ||
      ""
    );
  });

  /* ==========================================================
     PREFERENCES
  ========================================================== */

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          PREFERENCES_STORAGE_KEY
        );

      if (saved) {
        return {
          ...{
            teachingStrategy:
              mockUserProfile.preferredTeachingStrategy,

            difficulty:
              mockUserProfile.preferredDifficulty,

            notifications: true,

            emailUpdates: true,
          },
          ...JSON.parse(saved),
        };
      }
    } catch (error) {
      console.error(
        "Unable to load preferences:",
        error
      );
    }

    return {
      teachingStrategy:
        mockUserProfile.preferredTeachingStrategy,

      difficulty:
        mockUserProfile.preferredDifficulty,

      notifications: true,

      emailUpdates: true,
    };
  });

  /* ==========================================================
     SUCCESS MESSAGE
  ========================================================== */

  const [successMessage, setSuccessMessage] =
    useState("");

  /* ==========================================================
     SYNC USER -> PROFILE
  ========================================================== */

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      email: user?.email || "",
      university: user?.university || "",
      course: user?.course || "",
    });

    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user]);

  /* ==========================================================
     SUCCESS HELPER
  ========================================================== */

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  /* ==========================================================
     GET CURRENT AUTH DATA
  ========================================================== */

  const getStoredAuth = () => {
    try {
      return JSON.parse(
        localStorage.getItem(
          AUTH_STORAGE_KEY
        ) || "null"
      );
    } catch (error) {
      console.error(
        "Unable to read auth storage:",
        error
      );

      return null;
    }
  };

  /* ==========================================================
     SAVE AUTH USER
  ========================================================== */

  const saveUpdatedUser = (updatedUser) => {
    const storedAuth = getStoredAuth();

    /*
     * IMPORTANT:
     *
     * Keep the original authentication structure:
     *
     * {
     *   user,
     *   token,
     *   token_type,
     *   loginAt
     * }
     *
     * Do NOT replace the entire object with the user.
     */

    if (storedAuth) {
      const updatedAuth = {
        ...storedAuth,
        user: updatedUser,
      };

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(updatedAuth)
      );

      /*
       * Update AuthContext immediately.
       *
       * This makes Dashboard see the new
       * name/avatar without requiring logout/login.
       */

      if (login) {
        login(
          updatedUser,
          storedAuth.token
        );
      }
    }
  };

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  const handleProfileUpdate = () => {
    if (!profile.name.trim()) {
      showSuccess(
        "Please enter your full name."
      );

      return;
    }

    const updatedUser = {
      ...(user || {}),

      name: profile.name.trim(),

      email:
        profile.email ||
        user?.email ||
        "",

      university:
        profile.university.trim(),

      course:
        profile.course.trim(),

      /*
       * Keep avatar attached to the user.
       */

      avatar:
        avatar ||
        user?.avatar ||
        "",
    };

    /*
     * Save complete user object.
     */

    saveUpdatedUser(updatedUser);

    /*
     * Also keep avatar storage for compatibility
     * with existing pages.
     */

    if (avatar) {
      localStorage.setItem(
        AVATAR_STORAGE_KEY,
        avatar
      );
    }

    showSuccess(
      "Profile updated successfully."
    );
  };

  /* ==========================================================
     AVATAR CLICK
  ========================================================== */

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  /* ==========================================================
     AVATAR CHANGE
  ========================================================== */

  const handleAvatarChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showSuccess(
        "Please select a valid image file."
      );

      return;
    }

    /*
     * Limit very large images.
     */

    if (file.size > 5 * 1024 * 1024) {
      showSuccess(
        "Please choose an image smaller than 5 MB."
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData =
        reader.result;

      setAvatar(imageData);

      /*
       * Save avatar separately.
       */

      localStorage.setItem(
        AVATAR_STORAGE_KEY,
        imageData
      );

      /*
       * IMPORTANT:
       * Also save avatar inside authenticated user.
       *
       * Dashboard can now use user.avatar.
       */

      const updatedUser = {
        ...(user || {}),

        name:
          profile.name ||
          user?.name ||
          "",

        email:
          profile.email ||
          user?.email ||
          "",

        university:
          profile.university ||
          user?.university ||
          "",

        course:
          profile.course ||
          user?.course ||
          "",

        avatar: imageData,
      };

      saveUpdatedUser(updatedUser);

      showSuccess(
        "Avatar updated successfully."
      );
    };

    reader.onerror = () => {
      showSuccess(
        "Unable to update avatar."
      );
    };

    reader.readAsDataURL(file);

    /*
     * Allow selecting the same image again.
     */

    event.target.value = "";
  };

  /* ==========================================================
     SAVE PREFERENCES
  ========================================================== */

  const handlePreferencesUpdate = () => {
    try {
      /*
       * Save preferences.
       */

      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences)
      );

      /*
       * ALSO save them under the user.
       *
       * This makes them available through
       * AuthContext/user if needed.
       */

      const updatedUser = {
        ...(user || {}),

        preferredTeachingStrategy:
          preferences.teachingStrategy,

        preferredDifficulty:
          preferences.difficulty,

        teachingStrategy:
          preferences.teachingStrategy,

        difficulty:
          preferences.difficulty,
      };

      saveUpdatedUser(updatedUser);

      /*
       * Log so you can verify in browser console.
       */

      console.log(
        "Saved AI Professor preferences:",
        preferences
      );

      showSuccess(
        "Learning preferences updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save preferences:",
        error
      );

      showSuccess(
        "Unable to save learning preferences."
      );
    }
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    logout();

    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    navigate("/login");
  };

  /* ==========================================================
     TOGGLE
  ========================================================== */

  const Toggle = ({
    enabled,
    onClick,
    label,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={enabled}
        className={`
          relative
          w-12
          h-6
          rounded-full
          transition-all
          duration-200
          shrink-0
          focus:outline-none
          focus:ring-2
          focus:ring-[#6f8061]
          ${
            enabled
              ? "bg-[#6f8061]"
              : darkMode
              ? "bg-[#555b53]"
              : "bg-[#a7aaa2]"
          }
        `}
      >
        <span
          className={`
            absolute
            top-0.5
            left-0.5
            w-5
            h-5
            bg-white
            rounded-full
            shadow-sm
            transition-transform
            duration-200
            ${
              enabled
                ? "translate-x-6"
                : "translate-x-0"
            }
          `}
        />
      </button>
    );
  };

  /* ==========================================================
     AVATAR LETTER
  ========================================================== */

  const avatarLetter =
    profile.name?.[0]?.toUpperCase() ||
    user?.name?.[0]?.toUpperCase() ||
    "U";

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <DashboardLayout>
      <div
        className={`
          min-h-full
          transition-colors
          duration-300
          ${
            darkMode
              ? "bg-[#171916]"
              : "bg-[#f7f3ea]"
          }
        `}
      >
        <div
          className="
            max-w-5xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-8
          "
        >

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`
                  w-8
                  h-8
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  ${
                    darkMode
                      ? "bg-[#293127]"
                      : "bg-[#e6ecdf]"
                  }
                `}
              >
                <Sparkles
                  size={17}
                  className="text-[#6f8061]"
                />
              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#c98262]
                "
              >
                Your preferences
              </span>
            </div>

            <h1
              className={`
                font-display
                text-4xl
                md:text-5xl
                transition-colors
                ${
                  darkMode
                    ? "text-[#f1f2ed]"
                    : "text-[#3e4038]"
                }
              `}
            >
              Settings
            </h1>

            <p
              className={`
                mt-3
                max-w-2xl
                text-base
                md:text-lg
                ${
                  darkMode
                    ? "text-[#aeb3a9]"
                    : "text-[#7d7d72]"
                }
              `}
            >
              Manage your profile, learning
              preferences, appearance, and
              notifications.
            </p>
          </div>

          {/* =====================================================
              SUCCESS
          ===================================================== */}

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

          <div className="space-y-6">

            {/* ===================================================
                PROFILE
            =================================================== */}

            <Card
              className={`
                p-6
                md:p-8
                shadow-sm
                ${
                  darkMode
                    ? "!bg-[#22251f] !border-[#393e36]"
                    : "!bg-[#fffdf8] !border-[#e4ded2]"
                }
              `}
            >
              <div className="flex items-start gap-3 mb-7">

                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${
                      darkMode
                        ? "bg-[#293127]"
                        : "bg-[#e6ecdf]"
                    }
                  `}
                >
                  <User
                    size={19}
                    className="text-[#6f8061]"
                  />
                </div>

                <div>
                  <h2
                    className={`
                      font-display
                      text-2xl
                      ${
                        darkMode
                          ? "text-[#f1f2ed]"
                          : "text-[#3e4038]"
                      }
                    `}
                  >
                    Profile information
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    Keep your personal information
                    up to date.
                  </p>
                </div>
              </div>

              {/* PROFILE HEADER */}

              <div
                className={`
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  gap-4
                  mb-7
                  p-5
                  rounded-2xl
                  border
                  ${
                    darkMode
                      ? "bg-[#292c27] border-[#3b4038]"
                      : "bg-[#faf7f0] border-[#e4ded2]"
                  }
                `}
              >

                {/* AVATAR */}

                <div
                  className="
                    relative
                    w-16
                    h-16
                    rounded-full
                    overflow-hidden
                    shrink-0
                    bg-[#6f8061]
                    flex
                    items-center
                    justify-center
                    text-[#fffdf8]
                    text-2xl
                    font-bold
                  "
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile avatar"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <div className="flex-1 min-w-0">

                  <h3
                    className={`
                      font-semibold
                      truncate
                      ${
                        darkMode
                          ? "text-[#f1f2ed]"
                          : "text-[#4d5047]"
                      }
                    `}
                  >
                    {profile.name || "User"}
                  </h3>

                  <p
                    className={`
                      text-sm
                      mt-1
                      truncate
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    {profile.email || ""}
                  </p>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className={`
                    px-4
                    py-2
                    rounded-xl
                    border
                    text-sm
                    font-semibold
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-2
                    ${
                      darkMode
                        ? `
                          border-[#50564d]
                          bg-[#30342e]
                          text-[#f1f2ed]
                          hover:bg-[#3a4037]
                        `
                        : `
                          border-[#cfc9bc]
                          bg-[#fffdf8]
                          text-[#4d5047]
                          hover:bg-[#eee9df]
                        `
                    }
                  `}
                >
                  <Camera size={16} />
                  Change Avatar
                </button>
              </div>

              {/* PROFILE FIELDS */}

              <div className="space-y-5">

                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value,
                    })
                  }
                  icon={User}
                  className={`
                    ${
                      darkMode
                        ? `
                          !bg-[#30342e]
                          !text-[#f5f6f2]
                          dark:!border-[#50564d]
                          dark:placeholder:!text-[#8f968b]
                        `
                        : `
                          !bg-[#ffffff]
                          !text-[#22251f]
                        `
                    }
                  `}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  disabled
                  icon={Mail}
                  className={`
                    ${
                      darkMode
                        ? `
                          !bg-[#292c27]
                          !text-[#c8cdc4]
                          dark:!border-[#50564d]
                        `
                        : `
                          !bg-[#f1efe9]
                          !text-[#4d5047]
                        `
                    }
                  `}
                />

                <Input
                  label="University"
                  value={profile.university}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      university:
                        e.target.value,
                    })
                  }
                  icon={MapPin}
                  className={`
                    ${
                      darkMode
                        ? `
                          !bg-[#30342e]
                          !text-[#f5f6f2]
                          dark:!border-[#50564d]
                          dark:placeholder:!text-[#8f968b]
                        `
                        : `
                          !bg-[#ffffff]
                          !text-[#22251f]
                        `
                    }
                  `}
                />

                <Input
                  label="Course"
                  value={profile.course}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      course:
                        e.target.value,
                    })
                  }
                  icon={BookOpen}
                  className={`
                    ${
                      darkMode
                        ? `
                          !bg-[#30342e]
                          !text-[#f5f6f2]
                          dark:!border-[#50564d]
                          dark:placeholder:!text-[#8f968b]
                        `
                        : `
                          !bg-[#ffffff]
                          !text-[#22251f]
                        `
                    }
                  `}
                />

                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  className="
                    w-full
                    h-12
                    rounded-xl
                    bg-[#6f8061]
                    text-[#fffdf8]
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    hover:bg-[#5d6e51]
                    hover:-translate-y-0.5
                    transition-all
                  "
                >
                  <Save size={18} />
                  Save Profile
                </button>
              </div>
            </Card>

            {/* ===================================================
                LEARNING PREFERENCES
            =================================================== */}

            <Card
              className={`
                p-6
                md:p-8
                shadow-sm
                ${
                  darkMode
                    ? "!bg-[#22251f] !border-[#393e36]"
                    : "!bg-[#fffdf8] !border-[#e4ded2]"
                }
              `}
            >

              <div className="flex items-start gap-3 mb-7">

                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${
                      darkMode
                        ? "bg-[#293127]"
                        : "bg-[#e6ecdf]"
                    }
                  `}
                >
                  <BookOpen
                    size={19}
                    className="text-[#6f8061]"
                  />
                </div>

                <div>
                  <h2
                    className={`
                      font-display
                      text-2xl
                      ${
                        darkMode
                          ? "text-[#f1f2ed]"
                          : "text-[#3e4038]"
                      }
                    `}
                  >
                    Learning preferences
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    Tell your AI Professor how you
                    prefer to learn.
                  </p>
                </div>
              </div>

              <div className="space-y-5">

                {/* TEACHING STRATEGY */}

                <Select
                  label="Preferred Teaching Strategy"
                  options={teachingStrategies.map(
                    (strategy) => ({
                      value: strategy.id,
                      label: strategy.name,
                    })
                  )}
                  value={
                    preferences.teachingStrategy
                  }
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      teachingStrategy:
                        e.target.value,
                    })
                  }
                  className={`
                    !w-full
                    ${
                      darkMode
                        ? `
                          !bg-[#30342e]
                          !text-[#f5f6f2]
                          dark:!text-[#f5f6f2]
                          dark:!border-[#50564d]
                        `
                        : `
                          !bg-[#ffffff]
                          !text-[#22251f]
                        `
                    }
                  `}
                />

                {/* DIFFICULTY */}

                <Select
                  label="Preferred Difficulty Level"
                  options={[
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
                  value={
                    preferences.difficulty
                  }
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      difficulty:
                        e.target.value,
                    })
                  }
                  className={`
                    !w-full
                    ${
                      darkMode
                        ? `
                          !bg-[#30342e]
                          !text-[#f5f6f2]
                          dark:!text-[#f5f6f2]
                          dark:!border-[#50564d]
                        `
                        : `
                          !bg-[#ffffff]
                          !text-[#22251f]
                        `
                    }
                  `}
                />

                {/* CURRENT VALUES */}

                <div
                  className={`
                    rounded-xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "bg-[#293127] border-[#3d4738]"
                        : "bg-[#e6ecdf] border-[#d5ddcc]"
                    }
                  `}
                >

                  <div className="flex gap-3">

                    <Sparkles
                      size={19}
                      className="
                        text-[#6f8061]
                        mt-0.5
                        shrink-0
                      "
                    />

                    <div className="min-w-0">

                      <p
                        className={`
                          text-sm
                          font-semibold
                          ${
                            darkMode
                              ? "text-[#e4e8df]"
                              : "text-[#4d5047]"
                          }
                        `}
                      >
                        Personalized teaching
                      </p>

                      <p
                        className={`
                          text-xs
                          mt-1
                          leading-relaxed
                          ${
                            darkMode
                              ? "text-[#aeb3a9]"
                              : "text-[#73766b]"
                          }
                        `}
                      >
                        Strategy:{" "}
                        <strong>
                          {
                            preferences.teachingStrategy
                          }
                        </strong>
                        {" • "}
                        Difficulty:{" "}
                        <strong>
                          {
                            preferences.difficulty
                          }
                        </strong>
                      </p>

                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handlePreferencesUpdate
                  }
                  className="
                    w-full
                    h-12
                    rounded-xl
                    bg-[#6f8061]
                    text-[#fffdf8]
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    hover:bg-[#5d6e51]
                    hover:-translate-y-0.5
                    transition-all
                  "
                >
                  <CheckCircle size={18} />
                  Save Preferences
                </button>
              </div>
            </Card>

            {/* ===================================================
                APPEARANCE
            =================================================== */}

            <Card
              className={`
                p-6
                md:p-8
                shadow-sm
                ${
                  darkMode
                    ? "!bg-[#22251f] !border-[#393e36]"
                    : "!bg-[#fffdf8] !border-[#e4ded2]"
                }
              `}
            >

              <div className="flex items-start gap-3 mb-7">

                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    ${
                      darkMode
                        ? "bg-[#3a2e27]"
                        : "bg-[#f3e8df]"
                    }
                  `}
                >
                  {darkMode ? (
                    <Moon
                      size={19}
                      className="text-[#c98262]"
                    />
                  ) : (
                    <Sun
                      size={19}
                      className="text-[#c98262]"
                    />
                  )}
                </div>

                <div>
                  <h2
                    className={`
                      font-display
                      text-2xl
                      ${
                        darkMode
                          ? "text-[#f1f2ed]"
                          : "text-[#3e4038]"
                      }
                    `}
                  >
                    Appearance
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    Customize how TwinLearnAI
                    looks for you.
                  </p>
                </div>
              </div>

              <div
                className={`
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-5
                  p-5
                  rounded-2xl
                  border
                  ${
                    darkMode
                      ? "bg-[#292c27] border-[#3b4038]"
                      : "bg-[#faf7f0] border-[#e4ded2]"
                  }
                `}
              >

                <div className="flex items-center gap-4">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        darkMode
                          ? "bg-[#343932]"
                          : "bg-[#eee9df]"
                      }
                    `}
                  >
                    {darkMode ? (
                      <Moon
                        size={20}
                        className="text-[#6f8061]"
                      />
                    ) : (
                      <Sun
                        size={20}
                        className="text-[#c98262]"
                      />
                    )}
                  </div>

                  <div>

                    <p
                      className={`
                        font-semibold
                        ${
                          darkMode
                            ? "text-[#f1f2ed]"
                            : "text-[#4d5047]"
                        }
                      `}
                    >
                      Theme
                    </p>

                    <p
                      className={`
                        text-sm
                        mt-0.5
                        ${
                          darkMode
                            ? "text-[#aeb3a9]"
                            : "text-[#85877d]"
                        }
                      `}
                    >
                      {darkMode
                        ? "Dark mode is active"
                        : "Light mode is active"}
                    </p>

                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={disableDarkMode}
                    aria-pressed={!darkMode}
                    className={`
                      h-10
                      px-4
                      rounded-xl
                      border
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-semibold
                      transition-all
                      ${
                        !darkMode
                          ? `
                            bg-[#6f8061]
                            text-[#fffdf8]
                            border-[#6f8061]
                          `
                          : `
                            bg-[#30342e]
                            text-[#f1f2ed]
                            border-[#50564d]
                            hover:bg-[#3a4037]
                          `
                      }
                    `}
                  >
                    <Sun size={17} />
                    Light
                  </button>

                  <button
                    type="button"
                    onClick={enableDarkMode}
                    aria-pressed={darkMode}
                    className={`
                      h-10
                      px-4
                      rounded-xl
                      border
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-semibold
                      transition-all
                      ${
                        darkMode
                          ? `
                            bg-[#6f8061]
                            text-[#fffdf8]
                            border-[#6f8061]
                          `
                          : `
                            bg-[#fffdf8]
                            text-[#4d5047]
                            border-[#cfc9bc]
                            hover:bg-[#eee9df]
                          `
                      }
                    `}
                  >
                    <Moon size={17} />
                    Dark
                  </button>

                </div>
              </div>
            </Card>

            {/* ===================================================
                NOTIFICATIONS
            =================================================== */}

            <Card
              className={`
                p-6
                md:p-8
                shadow-sm
                ${
                  darkMode
                    ? "!bg-[#22251f] !border-[#393e36]"
                    : "!bg-[#fffdf8] !border-[#e4ded2]"
                }
              `}
            >

              <div className="flex items-start gap-3 mb-7">

                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    ${
                      darkMode
                        ? "bg-[#293127]"
                        : "bg-[#e6ecdf]"
                    }
                  `}
                >
                  <Bell
                    size={19}
                    className="text-[#6f8061]"
                  />
                </div>

                <div>

                  <h2
                    className={`
                      font-display
                      text-2xl
                      ${
                        darkMode
                          ? "text-[#f1f2ed]"
                          : "text-[#3e4038]"
                      }
                    `}
                  >
                    Notifications
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    Choose what updates you want
                    to receive.
                  </p>

                </div>
              </div>

              <div className="space-y-3">

                <NotificationRow
                  darkMode={darkMode}
                  title="In-app Notifications"
                  description="Get notified about new questions and progress updates."
                  enabled={
                    preferences.notifications
                  }
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      notifications:
                        !preferences.notifications,
                    })
                  }
                  label="Toggle in-app notifications"
                  Toggle={Toggle}
                />

                <NotificationRow
                  darkMode={darkMode}
                  title="Email Updates"
                  description="Receive your weekly learning summary and tips."
                  enabled={
                    preferences.emailUpdates
                  }
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      emailUpdates:
                        !preferences.emailUpdates,
                    })
                  }
                  label="Toggle email updates"
                  Toggle={Toggle}
                />

              </div>

              <button
                type="button"
                onClick={
                  handlePreferencesUpdate
                }
                className="
                  w-full
                  h-12
                  mt-5
                  rounded-xl
                  bg-[#6f8061]
                  text-[#fffdf8]
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-2
                  hover:bg-[#5d6e51]
                  transition-all
                "
              >
                <Save size={18} />
                Save Notification Settings
              </button>

            </Card>

            {/* ===================================================
                ACCOUNT ACTIONS
            =================================================== */}

            <Card
              className={`
                p-6
                md:p-8
                shadow-sm
                ${
                  darkMode
                    ? "!bg-[#22251f] !border-[#4a3730]"
                    : "!bg-[#fffdf8] !border-[#ead7ca]"
                }
              `}
            >

              <div className="flex items-start gap-3 mb-7">

                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    ${
                      darkMode
                        ? "bg-[#3a2e27]"
                        : "bg-[#f3e8df]"
                    }
                  `}
                >
                  <Shield
                    size={19}
                    className="text-[#c98262]"
                  />
                </div>

                <div>

                  <h2
                    className={`
                      font-display
                      text-2xl
                      ${
                        darkMode
                          ? "text-[#d99a7d]"
                          : "text-[#8c604c]"
                      }
                    `}
                  >
                    Account actions
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#85877d]"
                      }
                    `}
                  >
                    Manage your TwinLearnAI
                    account.
                  </p>

                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full
                  h-12
                  rounded-xl
                  bg-[#c98262]
                  text-[#fffdf8]
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-2
                  hover:bg-[#b56f52]
                  hover:-translate-y-0.5
                  transition-all
                "
              >
                <LogOut size={18} />
                Logout
              </button>

              <button
                type="button"
                disabled
                className={`
                  w-full
                  h-12
                  mt-3
                  rounded-xl
                  border
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-2
                  opacity-60
                  cursor-not-allowed
                  ${
                    darkMode
                      ? `
                        border-[#4a3730]
                        bg-[#292c27]
                        text-[#aaa69c]
                      `
                      : `
                        border-[#ead7ca]
                        bg-[#faf7f0]
                        text-[#aaa69c]
                      `
                  }
                `}
              >
                Delete Account
              </button>
            </Card>

            {/* ===================================================
                FOOTER INFO
            =================================================== */}

            <div
              className={`
                rounded-2xl
                border
                p-6
                ${
                  darkMode
                    ? "bg-[#293127] border-[#3d4738]"
                    : "bg-[#e6ecdf] border-[#d5ddcc]"
                }
              `}
            >

              <div className="flex gap-3">

                <Sparkles
                  size={19}
                  className="
                    text-[#6f8061]
                    mt-0.5
                    shrink-0
                  "
                />

                <div>

                  <h3
                    className={`
                      font-semibold
                      ${
                        darkMode
                          ? "text-[#e4e8df]"
                          : "text-[#4d5047]"
                      }
                    `}
                  >
                    Your AI Professor
                  </h3>

                  <p
                    className={`
                      text-sm
                      mt-1
                      leading-relaxed
                      ${
                        darkMode
                          ? "text-[#aeb3a9]"
                          : "text-[#73766b]"
                      }
                    `}
                  >
                    Your learning preferences help
                    TwinLearnAI create a more
                    personalized teaching experience.
                    You can change them whenever you
                    want.
                  </p>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ==============================================================
   NOTIFICATION ROW
============================================================== */

function NotificationRow({
  darkMode,
  title,
  description,
  enabled,
  onClick,
  label,
  Toggle,
}) {
  return (
    <div
      className={`
        flex
        items-center
        justify-between
        gap-4
        p-5
        border
        rounded-2xl
        ${
          darkMode
            ? "bg-[#292c27] border-[#3b4038]"
            : "bg-[#faf7f0] border-[#e4ded2]"
        }
      `}
    >

      <div>

        <p
          className={`
            font-semibold
            ${
              darkMode
                ? "text-[#f1f2ed]"
                : "text-[#4d5047]"
            }
          `}
        >
          {title}
        </p>

        <p
          className={`
            text-sm
            mt-1
            ${
              darkMode
                ? "text-[#aeb3a9]"
                : "text-[#85877d]"
            }
          `}
        >
          {description}
        </p>

      </div>

      <Toggle
        enabled={enabled}
        onClick={onClick}
        label={label}
      />

    </div>
  );
}