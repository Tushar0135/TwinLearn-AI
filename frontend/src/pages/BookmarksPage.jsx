import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/Layout";

import {
  Card,
  Button,
  Loading,
  Alert,
} from "../components/UI";

import {
  Trash2,
  FileText,
  MessageSquare,
  BookMarked,
  Upload,
  Sparkles,
  ArrowRight,
  Bookmark,
  CheckCircle,
} from "lucide-react";

import { bookmarkService } from "../services/bookmarkService";

/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function BookmarksPage() {
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD BOOKMARKS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await bookmarkService.getBookmarks();

      console.log("Bookmarks response:", result);

      if (result?.success) {
        setBookmarks(result.data || []);
      } else {
        setErrorMessage(
          result?.error || "Unable to load your bookmarks."
        );
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);

      setErrorMessage(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load your bookmarks."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE BOOKMARK
  |--------------------------------------------------------------------------
  */

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!bookmarkId) return;

    setDeletingId(bookmarkId);
    setErrorMessage("");

    try {
      const result =
        await bookmarkService.removeBookmark(bookmarkId);

      console.log("Remove bookmark response:", result);

      if (result?.success) {
        setBookmarks((prev) =>
          prev.filter(
            (bookmark) => bookmark.id !== bookmarkId
          )
        );

        setSuccessMessage("Bookmark removed successfully.");

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrorMessage(
          result?.error || "Unable to remove bookmark."
        );
      }
    } catch (error) {
      console.error(
        "Failed to remove bookmark:",
        error
      );

      setErrorMessage(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to remove bookmark."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BOOKMARK ICON
  |--------------------------------------------------------------------------
  */

  const getBookmarkIcon = (type, size = 18) => {
    switch (type) {
      case "explanation":
        return (
          <FileText
            size={size}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />
        );

      case "question":
        return (
          <MessageSquare
            size={size}
            className="
              text-[#c98262]
              dark:text-[#e2a082]
            "
          />
        );

      case "section":
        return (
          <BookMarked
            size={size}
            className="
              text-[#6f8061]
              dark:text-[#aeb8a1]
            "
          />
        );

      default:
        return (
          <Bookmark
            size={size}
            className="
              text-[#85877d]
              dark:text-gray-400
            "
          />
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BOOKMARK TYPE LABEL
  |--------------------------------------------------------------------------
  */

  const getBookmarkTypeLabel = (type) => {
    switch (type) {
      case "explanation":
        return "Explanations";

      case "question":
        return "Questions";

      case "section":
        return "Sections";

      default:
        return "Other";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BOOKMARK DESCRIPTION
  |--------------------------------------------------------------------------
  */

  const getBookmarkTypeDescription = (type) => {
    switch (type) {
      case "explanation":
        return "Important explanations you've saved.";

      case "question":
        return "Questions you want to revisit.";

      case "section":
        return "Lecture sections you've bookmarked.";

      default:
        return "Other saved learning content.";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GROUP BOOKMARKS
  |--------------------------------------------------------------------------
  */

  const groupedBookmarks = bookmarks.reduce(
    (acc, bookmark) => {
      const type = bookmark?.type || "other";

      if (!acc[type]) {
        acc[type] = [];
      }

      acc[type].push(bookmark);

      return acc;
    },
    {}
  );

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatBookmarkDate = (date) => {
    if (!date) {
      return "Recently";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently";
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleUploadLecture = () => {
    navigate("/upload");
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
                <BookMarked
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
                Your Library
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
                  Your saved ideas.
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
                  Keep important explanations, questions,
                  and lecture sections close so you can
                  revisit them anytime.
                </p>
              </div>

              {!loading && bookmarks.length > 0 && (
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
                    <Bookmark
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
                      Saved
                    </p>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-[#4d5047]
                        dark:text-gray-200
                      "
                    >
                      {bookmarks.length}{" "}
                      {bookmarks.length === 1
                        ? "bookmark"
                        : "bookmarks"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              ALERTS
          ========================================================= */}

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

          {errorMessage && (
            <div className="mb-6">
              <Alert
                variant="error"
                message={errorMessage}
                onClose={() =>
                  setErrorMessage("")
                }
              />
            </div>
          )}

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
                Loading your saved content...
              </p>
            </Card>
          ) : bookmarks.length === 0 ? (
            /* =========================================================
               EMPTY STATE
            ========================================================= */

            <EmptyBookmarks
              onUploadLecture={
                handleUploadLecture
              }
            />
          ) : (
            /* =========================================================
               BOOKMARK CONTENT
            ========================================================= */

            <div className="space-y-8">
              {Object.entries(
                groupedBookmarks
              ).map(([type, typeBookmarks]) => (
                <BookmarkSection
                  key={type}
                  type={type}
                  bookmarks={typeBookmarks}
                  getBookmarkIcon={
                    getBookmarkIcon
                  }
                  getBookmarkTypeLabel={
                    getBookmarkTypeLabel
                  }
                  getBookmarkTypeDescription={
                    getBookmarkTypeDescription
                  }
                  formatBookmarkDate={
                    formatBookmarkDate
                  }
                  deletingId={deletingId}
                  onDelete={
                    handleDeleteBookmark
                  }
                />
              ))}

              {/* =====================================================
                  BOTTOM INFO
              ===================================================== */}

              <div
                className="
                  rounded-2xl
                  bg-[#e6ecdf]
                  dark:bg-gray-800
                  border
                  border-[#d5ddcc]
                  dark:border-gray-700
                  p-6
                "
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-[#fffdf8]
                      dark:bg-gray-900
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Sparkles
                      size={20}
                      className="
                        text-[#6f8061]
                        dark:text-[#aeb8a1]
                      "
                    />
                  </div>

                  <div>
                    <h3
                      className="
                        font-semibold
                        text-[#4d5047]
                        dark:text-gray-200
                      "
                    >
                      Keep building your learning
                      library.
                    </h3>

                    <p
                      className="
                        text-sm
                        text-[#73766b]
                        dark:text-gray-400
                        mt-1
                        leading-relaxed
                      "
                    >
                      Bookmark useful explanations,
                      questions, and sections while
                      learning with your AI Professor.
                      They'll stay here for quick
                      revision later.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleUploadLecture
                      }
                      className="
                        mt-4
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-[#5d6e51]
                        dark:text-[#aeb8a1]
                        hover:gap-3
                        transition-all
                      "
                    >
                      Upload another lecture
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| BOOKMARK SECTION
|--------------------------------------------------------------------------
*/

function BookmarkSection({
  type,
  bookmarks,
  getBookmarkIcon,
  getBookmarkTypeLabel,
  getBookmarkTypeDescription,
  formatBookmarkDate,
  deletingId,
  onDelete,
}) {
  return (
    <section>
      {/* =============================================================
          SECTION HEADER
      ============================================================= */}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
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
            "
          >
            {getBookmarkIcon(type, 19)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2
                className="
                  font-display
                  text-2xl
                  text-[#3e4038]
                  dark:text-gray-100
                "
              >
                {getBookmarkTypeLabel(type)}
              </h2>

              <span
                className="
                  inline-flex
                  items-center
                  justify-center
                  min-w-7
                  h-7
                  px-2
                  rounded-full
                  bg-[#eee9df]
                  dark:bg-gray-800
                  text-xs
                  font-semibold
                  text-[#73766b]
                  dark:text-gray-400
                "
              >
                {bookmarks.length}
              </span>
            </div>

            <p
              className="
                text-sm
                text-[#85877d]
                dark:text-gray-400
                mt-0.5
              "
            >
              {getBookmarkTypeDescription(type)}
            </p>
          </div>
        </div>
      </div>

      {/* =============================================================
          CARDS
      ============================================================= */}

      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            getBookmarkIcon={
              getBookmarkIcon
            }
            formatBookmarkDate={
              formatBookmarkDate
            }
            deletingId={deletingId}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| BOOKMARK CARD
|--------------------------------------------------------------------------
*/

function BookmarkCard({
  bookmark,
  getBookmarkIcon,
  formatBookmarkDate,
  deletingId,
  onDelete,
}) {
  const isDeleting =
    deletingId === bookmark.id;

  return (
    <Card
      className="
        p-5
        md:p-6
        bg-[#fffdf8]
        dark:bg-gray-900
        border-[#e4ded2]
        dark:border-gray-800
        shadow-sm
        dark:shadow-none
        hover:shadow-md
        dark:hover:shadow-none
        transition-all
      "
    >
      <div
        className="
          flex
          items-start
          gap-4
        "
      >
        {/* =========================================================
            ICON
        ========================================================= */}

        <div
          className="
            w-11
            h-11
            rounded-xl
            bg-[#faf7f0]
            dark:bg-gray-800
            border
            border-[#e4ded2]
            dark:border-gray-700
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          {getBookmarkIcon(
            bookmark.type,
            19
          )}
        </div>

        {/* =========================================================
            CONTENT
        ========================================================= */}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className="
                font-semibold
                text-[#4d5047]
                dark:text-gray-200
              "
            >
              {bookmark.type ===
              "explanation"
                ? "Saved Explanation"
                : bookmark.type ===
                  "question"
                ? "Saved Question"
                : bookmark.type ===
                  "section"
                ? "Saved Section"
                : "Saved Content"}
            </h3>
          </div>

          {/* Content */}

          <div
            className="
              rounded-xl
              bg-[#faf7f0]
              dark:bg-gray-800
              border
              border-[#eee9df]
              dark:border-gray-700
              p-4
              mb-4
            "
          >
            <p
              className="
                text-sm
                leading-6
                text-[#5f6259]
                dark:text-gray-300
                whitespace-pre-wrap
                break-words
              "
            >
              {bookmark.content ||
                "No content available."}
            </p>
          </div>

          {/* Metadata */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-2
              text-xs
              text-[#85877d]
              dark:text-gray-500
            "
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />

              Saved{" "}
              {formatBookmarkDate(
                bookmark.createdAt ||
                  bookmark.created_at
              )}
            </span>

            {bookmark.topic && (
              <span>
                Topic: {bookmark.topic}
              </span>
            )}

            {bookmark.lectureTitle && (
              <span>
                Lecture:{" "}
                {bookmark.lectureTitle}
              </span>
            )}
          </div>
        </div>

        {/* =========================================================
            DELETE
        ========================================================= */}

        <button
          type="button"
          disabled={isDeleting}
          title="Remove bookmark"
          onClick={() =>
            onDelete(bookmark.id)
          }
          className="
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            text-[#85877d]
            dark:text-gray-500
            hover:bg-[#f3e8df]
            dark:hover:bg-red-950/30
            hover:text-[#c98262]
            dark:hover:text-red-400
            transition-all
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          {isDeleting ? (
            <span
              className="
                w-4
                h-4
                border-2
                border-[#c98262]
                border-t-transparent
                rounded-full
                animate-spin
              "
            />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function EmptyBookmarks({
  onUploadLecture,
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
      {/* Icon */}

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
        <BookMarked
          size={36}
          className="
            text-[#6f8061]
            dark:text-[#aeb8a1]
          "
        />
      </div>

      {/* Eyebrow */}

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
        Nothing saved yet
      </p>

      {/* Heading */}

      <h2
        className="
          font-display
          text-3xl
          md:text-4xl
          text-[#3e4038]
          dark:text-gray-100
        "
      >
        Build your learning library.
      </h2>

      {/* Description */}

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
        When you find an explanation,
        question, or lecture section that
        you want to revisit, bookmark it.
        Your saved content will appear here.
      </p>

      {/* What can be saved */}

      <div
        className="
          grid
          sm:grid-cols-3
          gap-3
          mt-8
          mb-8
        "
      >
        <EmptyFeature
          icon={<FileText size={18} />}
          title="Explanations"
        />

        <EmptyFeature
          icon={<MessageSquare size={18} />}
          title="Questions"
        />

        <EmptyFeature
          icon={<BookMarked size={18} />}
          title="Sections"
        />
      </div>

      {/* CTA */}

      <button
        type="button"
        onClick={onUploadLecture}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          h-13
          px-6
          rounded-xl
          bg-[#6f8061]
          text-[#fffdf8]
          font-semibold
          hover:bg-[#5d6e51]
          dark:hover:bg-[#7f906f]
          hover:-translate-y-0.5
          transition-all
        "
      >
        <Upload size={18} />
        Upload a Lecture
        <ArrowRight size={18} />
      </button>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY FEATURE
|--------------------------------------------------------------------------
*/

function EmptyFeature({
  icon,
  title,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        gap-2
        p-3
        rounded-xl
        bg-[#faf7f0]
        dark:bg-gray-800
        border
        border-[#e4ded2]
        dark:border-gray-700
      "
    >
      <span
        className="
          text-[#6f8061]
          dark:text-[#aeb8a1]
        "
      >
        {icon}
      </span>

      <span
        className="
          text-xs
          font-semibold
          text-[#666960]
          dark:text-gray-300
        "
      >
        {title}
      </span>
    </div>
  );
}