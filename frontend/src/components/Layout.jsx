import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  Home,
  BookOpen,
  Upload,
  MessageSquare,
  BarChart3,
  Tags,
  Bookmark,
  Settings,
  LogOut,
  Search,
  Bell,
  Moon,
  Sun,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/helpers";


// ============================================================
// STORAGE KEY
// ============================================================

const AVATAR_STORAGE_KEY = "twinalai_avatar";


// ============================================================
// SIDEBAR LINK
// ============================================================

const SidebarLink = ({
  to,
  icon: Icon,
  label,
  active,
  onClick,
  darkMode,
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "font-medium transition-all duration-200",

        active
          ? darkMode
            ? "bg-[#293127] text-[#cbd8c2]"
            : "bg-[#e6ecdf] text-[#5d6e51]"
          : darkMode
            ? "text-gray-300 hover:bg-[#292c27] hover:text-[#f1f2ed]"
            : "text-gray-700 hover:bg-[#f1efe9] hover:text-[#3e4038]"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};


// ============================================================
// SIDEBAR
// ============================================================

export const Sidebar = ({
  open,
  onClose,
}) => {
  const location = useLocation();
  const { darkMode } = useTheme();

  const menuItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard",
    },
    {
      to: "/lectures",
      icon: BookOpen,
      label: "My Lectures",
    },
    {
      to: "/upload",
      icon: Upload,
      label: "Upload Lecture",
    },
    {
      to: "/ai-professor",
      icon: MessageSquare,
      label: "AI Professor",
    },
    {
      to: "/progress",
      icon: BarChart3,
      label: "Learning Progress",
    },
    {
      to: "/topics",
      icon: Tags,
      label: "Topics",
    },
    {
      to: "/bookmarks",
      icon: Bookmark,
      label: "Bookmarks",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  /*
   * AI Professor should remain active for:
   *
   * /ai-professor
   *
   * and
   *
   * /ai-professor/:lectureId
   */
  const isActive = (path) => {
    if (path === "/ai-professor") {
      return location.pathname.startsWith(
        "/ai-professor"
      );
    }

    return location.pathname === path;
  };

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {open && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            z-30
            lg:hidden
          "
          onClick={onClose}
        />
      )}


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64",
          "border-r",
          "z-40",
          "transform transition-transform duration-300",
          "overflow-y-auto",

          "lg:relative lg:translate-x-0",

          darkMode
            ? "bg-[#171916] border-[#393e36]"
            : "bg-[#fffdf8] border-[#e4ded2]",

          open
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div
          className={cn(
            "p-6 border-b",

            darkMode
              ? "border-[#393e36]"
              : "border-[#e4ded2]"
          )}
        >

          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2"
          >

            <div
              className="
                w-8
                h-8
                rounded-lg
                bg-[#6f8061]
                flex
                items-center
                justify-center
                text-[#fffdf8]
                font-bold
              "
            >
              T
            </div>

            <span
              className="
                font-bold
                text-xl
                text-[#3e4038]
                dark:text-[#f1f2ed]
              "
            >
              TwinLearnAI
            </span>

          </Link>

        </div>


        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav className="p-4 space-y-2">

          {menuItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={isActive(item.to)}
              onClick={onClose}
              darkMode={darkMode}
            />
          ))}

        </nav>

      </aside>
    </>
  );
};


// ============================================================
// TOPBAR
// ============================================================

export const Topbar = ({
  onSidebarOpen,
}) => {

  const {
    user,
    logout,
  } = useAuth();

  const {
    darkMode,
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,
  } = useTheme();

  const navigate = useNavigate();

  const [
    showDropdown,
    setShowDropdown,
  ] = useState(false);

  /*
   * ==========================================================
   * AVATAR
   * ==========================================================
   */

  const [
    avatar,
    setAvatar,
  ] = useState(() => {
    return (
      localStorage.getItem(
        AVATAR_STORAGE_KEY
      ) || ""
    );
  });


  /*
   * ==========================================================
   * LOAD AVATAR
   * ==========================================================
   */

  useEffect(() => {

    const loadAvatar = () => {

      const savedAvatar =
        localStorage.getItem(
          AVATAR_STORAGE_KEY
        ) || "";

      setAvatar(savedAvatar);
    };


    loadAvatar();


    /*
     * Custom event allows Settings page
     * to immediately update Dashboard avatar.
     */

    window.addEventListener(
      "twinalai-avatar-updated",
      loadAvatar
    );


    /*
     * Storage event handles updates from
     * another browser tab.
     */

    window.addEventListener(
      "storage",
      loadAvatar
    );


    return () => {

      window.removeEventListener(
        "twinalai-avatar-updated",
        loadAvatar
      );

      window.removeEventListener(
        "storage",
        loadAvatar
      );

    };

  }, []);


  /*
   * ==========================================================
   * USER LETTER
   * ==========================================================
   */

  const avatarLetter =
    user?.name?.[0]?.toUpperCase() ||
    "U";


  /*
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  const handleLogout = () => {

    logout();

    localStorage.removeItem(
      "twinalai_auth"
    );

    navigate("/login");

  };


  /*
   * ==========================================================
   * THEME
   * ==========================================================
   *
   * Supports your newer ThemeContext where you have:
   *
   * enableDarkMode()
   * disableDarkMode()
   *
   * and also keeps compatibility with:
   *
   * toggleDarkMode()
   */

  const handleThemeToggle = () => {

    if (darkMode) {

      if (disableDarkMode) {
        disableDarkMode();
      } else if (toggleDarkMode) {
        toggleDarkMode();
      }

    } else {

      if (enableDarkMode) {
        enableDarkMode();
      } else if (toggleDarkMode) {
        toggleDarkMode();
      }

    }

  };


  return (

    <header
      className={cn(
        "sticky top-0 z-20 border-b",

        darkMode
          ? "bg-[#171916] border-[#393e36]"
          : "bg-[#fffdf8] border-[#e4ded2]"
      )}
    >

      <div
        className="
          flex
          items-center
          justify-between
          h-16
          px-4
          lg:px-6
        "
      >

        {/* ==================================================
            MOBILE MENU
        ================================================== */}

        <button
          onClick={onSidebarOpen}
          className={cn(
            "lg:hidden p-2 rounded-lg",
            "transition-colors",

            darkMode
              ? "text-gray-200 hover:bg-[#292c27]"
              : "text-gray-700 hover:bg-[#f1efe9]"
          )}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <div
          className="
            flex-1
            hidden
            md:flex
            items-center
            gap-4
            max-w-md
            mx-4
          "
        >

          <Search
            size={20}
            className={
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }
          />

          <input
            type="text"
            placeholder="Search lectures..."
            className={cn(
              "w-full",
              "text-sm",
              "focus:outline-none",
              "!bg-transparent",
              "border-none",
              "outline-none",

              darkMode
                ? "text-gray-100 placeholder-gray-500"
                : "text-gray-900 placeholder-gray-400"
            )}
          />

        </div>


        {/* ==================================================
            RIGHT CONTROLS
        ================================================== */}

        <div
          className="
            flex
            items-center
            gap-2
            sm:gap-4
          "
        >

          {/* ==================================================
              THEME
          ================================================== */}

          <button
            onClick={handleThemeToggle}
            className={cn(
              "p-2 rounded-lg",
              "transition-colors",

              darkMode
                ? "text-gray-200 hover:bg-[#292c27]"
                : "text-gray-700 hover:bg-[#f1efe9]"
            )}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >

            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}

          </button>


          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <button
            className={cn(
              "relative p-2 rounded-lg",
              "transition-colors",

              darkMode
                ? "text-gray-200 hover:bg-[#292c27]"
                : "text-gray-700 hover:bg-[#f1efe9]"
            )}
            aria-label="Notifications"
          >

            <Bell size={20} />

            <span
              className="
                absolute
                top-1
                right-1
                w-2
                h-2
                bg-red-600
                rounded-full
              "
            />

          </button>


          {/* ==================================================
              USER MENU
          ================================================== */}

          <div className="relative">

            <button
              onClick={() =>
                setShowDropdown(
                  !showDropdown
                )
              }
              className={cn(
                "flex items-center gap-2 p-1.5 rounded-lg",
                "transition-colors",

                darkMode
                  ? "hover:bg-[#292c27]"
                  : "hover:bg-[#f1efe9]"
              )}
              aria-label="Open user menu"
            >

              {/* AVATAR */}

              <div
                className="
                  w-9
                  h-9
                  rounded-full
                  overflow-hidden
                  bg-[#6f8061]
                  flex
                  items-center
                  justify-center
                  text-[#fffdf8]
                  text-sm
                  font-bold
                  shrink-0
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

            </button>


            {/* ==================================================
                DROPDOWN
            ================================================== */}

            {showDropdown && (

              <div
                className={cn(
                  "absolute right-0 mt-2 w-56",
                  "border rounded-xl",
                  "shadow-lg overflow-hidden",

                  darkMode
                    ? "bg-[#22251f] border-[#393e36]"
                    : "bg-[#fffdf8] border-[#e4ded2]"
                )}
              >

                {/* USER INFO */}

                <div
                  className={cn(
                    "p-4 border-b",

                    darkMode
                      ? "border-[#393e36]"
                      : "border-[#e4ded2]"
                  )}
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
                        w-10
                        h-10
                        rounded-full
                        overflow-hidden
                        bg-[#6f8061]
                        flex
                        items-center
                        justify-center
                        text-white
                        font-bold
                        shrink-0
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

                    <div className="min-w-0">

                      <p
                        className={cn(
                          "font-semibold truncate",

                          darkMode
                            ? "text-gray-50"
                            : "text-gray-900"
                        )}
                      >
                        {user?.name ||
                          "User"}
                      </p>

                      <p
                        className={cn(
                          "text-sm truncate",

                          darkMode
                            ? "text-gray-400"
                            : "text-gray-600"
                        )}
                      >
                        {user?.email || ""}
                      </p>

                    </div>

                  </div>

                </div>


                {/* DROPDOWN NAVIGATION */}

                <nav className="p-2">

                  <Link
                    to="/settings"
                    onClick={() =>
                      setShowDropdown(false)
                    }
                    className={cn(
                      "block px-4 py-2 rounded-lg",
                      "transition-colors",

                      darkMode
                        ? "text-gray-300 hover:bg-[#292c27]"
                        : "text-gray-700 hover:bg-[#f1efe9]"
                    )}
                  >
                    Settings
                  </Link>


                  <Link
                    to="/ai-professor"
                    onClick={() =>
                      setShowDropdown(false)
                    }
                    className={cn(
                      "block px-4 py-2 rounded-lg",
                      "transition-colors",

                      darkMode
                        ? "text-gray-300 hover:bg-[#292c27]"
                        : "text-gray-700 hover:bg-[#f1efe9]"
                    )}
                  >
                    AI Professor
                  </Link>


                  <button
                    onClick={handleLogout}
                    className={cn(
                      "w-full",
                      "text-left",
                      "px-4",
                      "py-2",
                      "rounded-lg",
                      "transition-colors",
                      "flex",
                      "items-center",
                      "gap-2",

                      darkMode
                        ? "text-red-400 hover:bg-[#292c27]"
                        : "text-red-600 hover:bg-[#f1efe9]"
                    )}
                  >

                    <LogOut size={18} />

                    <span>
                      Logout
                    </span>

                  </button>

                </nav>

              </div>

            )}

          </div>

        </div>

      </div>

    </header>
  );
};


// ============================================================
// DASHBOARD LAYOUT
// ============================================================

export const DashboardLayout = ({
  children,
}) => {

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const { darkMode } =
    useTheme();


  /*
   * Close mobile sidebar whenever
   * route changes.
   */

  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  return (

    <div
      className={cn(
        "flex h-screen",

        darkMode
          ? "bg-[#171916]"
          : "bg-[#f7f3ea]"
      )}
    >

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />


      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div
        className="
          flex-1
          flex
          flex-col
          overflow-hidden
          min-w-0
        "
      >

        {/* TOPBAR */}

        <Topbar
          onSidebarOpen={() =>
            setSidebarOpen(true)
          }
        />


        {/* ====================================================
            CONTENT
        ==================================================== */}

        <main
          className={cn(
            "flex-1 overflow-auto",

            darkMode
              ? "bg-[#171916]"
              : "bg-[#f7f3ea]"
          )}
        >

          <div
            className="
              max-w-7xl
              mx-auto
              p-4
              lg:p-6
            "
          >

            {children}

          </div>

        </main>

      </div>

    </div>
  );
};