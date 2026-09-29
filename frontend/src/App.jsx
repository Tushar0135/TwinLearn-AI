import React, {
  Suspense,
  lazy,
} from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  ThemeProvider,
} from "./context/ThemeContext";

import {
  ProtectedRoute,
  PublicRoute,
} from "./routes/ProtectedRoute";


// ============================================================
// LAZY LOAD PAGES
// ============================================================

const LandingPage = lazy(
  () => import("./pages/LandingPage")
);

const LoginPage = lazy(
  () => import("./pages/LoginPage")
);

const RegisterPage = lazy(
  () => import("./pages/RegisterPage")
);

const VerifyOTPPage = lazy(
  () => import("./pages/VerifyOTPPage")
);

const DashboardPage = lazy(
  () => import("./pages/DashboardPage")
);

const MyLecturesPage = lazy(
  () => import("./pages/MyLecturesPage")
);

const UploadLecturePage = lazy(
  () => import("./pages/UploadLecturePage")
);

const AIProfessorPage = lazy(
  () => import("./pages/AIProfessorPage")
);


// ============================================================
// QUIZ PAGE
// ============================================================

const QuizPage = lazy(
  () => import("./pages/QuizPage")
);


// ============================================================
// OTHER PAGES
// ============================================================

const LearningProgressPage = lazy(
  () => import("./pages/LearningProgressPage")
);

const TopicsPage = lazy(
  () => import("./pages/TopicsPage")
);

const BookmarksPage = lazy(
  () => import("./pages/BookmarksPage")
);

const SettingsPage = lazy(
  () => import("./pages/SettingsPage")
);

const NotFoundPage = lazy(
  () => import("./pages/NotFoundPage")
);


// ============================================================
// LOADING SCREEN
// ============================================================

function PageLoader() {

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f3ea",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >

      <div
        style={{
          textAlign: "center",
        }}
      >

        {/* Loader */}

        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #e4ded2",
            borderTop: "4px solid #6f8061",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />

        {/* Logo */}

        <h2
          style={{
            color: "#3e4038",
            marginBottom: "8px",
          }}
        >
          TwinLearnAI
        </h2>

        {/* Loading */}

        <p
          style={{
            color: "#85877d",
          }}
        >
          Loading...
        </p>

        <style>
          {`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>

      </div>

    </div>
  );
}


// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {

  return (
    <Suspense
      fallback={<PageLoader />}
    >

      <Routes>

        {/* ====================================================
            PUBLIC ROUTES
        ==================================================== */}

        <Route
          path="/"
          element={
            <LandingPage />
          }
        />


        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />


        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />


        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <VerifyOTPPage />
            </PublicRoute>
          }
        />


        <Route
          path="/forgot-password"
          element={
            <LoginPage />
          }
        />


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            MY LECTURES
        ==================================================== */}

        {/* Main route */}

        <Route
          path="/lectures"
          element={
            <ProtectedRoute>
              <MyLecturesPage />
            </ProtectedRoute>
          }
        />


        {/* Alias route
            Useful if your sidebar uses /my-lectures */}

        <Route
          path="/my-lectures"
          element={
            <ProtectedRoute>
              <MyLecturesPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            UPLOAD LECTURE
        ==================================================== */}

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadLecturePage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            AI PROFESSOR
        ==================================================== */}

        {/* Lecture-specific AI Professor */}

        <Route
          path="/ai-professor/:lectureId"
          element={
            <ProtectedRoute>
              <AIProfessorPage />
            </ProtectedRoute>
          }
        />


        {/* AI Professor without lecture */}

        <Route
          path="/ai-professor"
          element={
            <ProtectedRoute>
              <AIProfessorPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            QUIZ
        ==================================================== */}

        {/*

          Your MyLecturesPage currently does:

          navigate(
            `/quiz/setup/${lectureId}`,
            {
              state: {
                lectureId,
                lecture,
              },
            }
          );

          Therefore this route MUST exist.

        */}

        <Route
          path="/quiz/setup/:lectureId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />


        {/*

          Also support:

          /quiz/:lectureId

          This keeps compatibility with your existing routing.

        */}

        <Route
          path="/quiz/:lectureId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            LEARNING PROGRESS
        ==================================================== */}

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <LearningProgressPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            TOPICS
        ==================================================== */}

        <Route
          path="/topics"
          element={
            <ProtectedRoute>
              <TopicsPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            BOOKMARKS
        ==================================================== */}

        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <BookmarksPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            SETTINGS
        ==================================================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            404
        ==================================================== */}

        <Route
          path="/404"
          element={
            <NotFoundPage />
          }
        />


        {/* Catch everything else */}

        <Route
          path="*"
          element={
            <NotFoundPage />
          }
        />

      </Routes>

    </Suspense>
  );
}


// ============================================================
// APP
// ============================================================

export default function App() {

  return (
    <Router>

      <AuthProvider>

        <ThemeProvider>

          <AppContent />

        </ThemeProvider>

      </AuthProvider>

    </Router>
  );
}