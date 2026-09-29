import api from "./api";

// ============================================================
// ERROR HELPER
// ============================================================

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;

  if (detail) {
    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.msg ||
            item?.message ||
            JSON.stringify(item)
          );
        })
        .join(", ");
    }

    if (typeof detail === "object") {
      return (
        detail?.message ||
        detail?.error ||
        JSON.stringify(detail)
      );
    }
  }

  const message = error?.response?.data?.message;

  if (message) {
    return typeof message === "string"
      ? message
      : JSON.stringify(message);
  }

  const apiError = error?.response?.data?.error;

  if (apiError) {
    return typeof apiError === "string"
      ? apiError
      : JSON.stringify(apiError);
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

// ============================================================
// NORMALIZE QUIZ RESPONSE
// ============================================================

const normalizeQuizResponse = (responseData) => {
  if (!responseData) {
    return null;
  }

  // Direct quiz
  if (
    responseData.quiz_id &&
    Array.isArray(responseData.questions)
  ) {
    return responseData;
  }

  // Wrapped in data
  if (
    responseData.data?.quiz_id &&
    Array.isArray(responseData.data.questions)
  ) {
    return responseData.data;
  }

  // Wrapped in quiz
  if (
    responseData.quiz?.quiz_id &&
    Array.isArray(responseData.quiz.questions)
  ) {
    return responseData.quiz;
  }

  // Wrapped in result
  if (
    responseData.result?.quiz_id &&
    Array.isArray(responseData.result.questions)
  ) {
    return responseData.result;
  }

  return responseData;
};

// ============================================================
// NORMALIZE SUBMISSION RESPONSE
// ============================================================

const normalizeSubmitResponse = (responseData) => {
  if (!responseData) {
    return null;
  }

  // Direct result
  if (
    responseData.score !== undefined ||
    responseData.percentage !== undefined ||
    Array.isArray(responseData.results)
  ) {
    return responseData;
  }

  // Wrapped in data
  if (responseData.data) {
    return responseData.data;
  }

  // Wrapped in result
  if (responseData.result) {
    return responseData.result;
  }

  return responseData;
};

// ============================================================
// NORMALIZE QUESTION
// ============================================================

const normalizeQuestion = (question, index) => {
  if (!question) {
    return null;
  }

  const questionId =
    question.question_id ??
    question.id ??
    `question-${index + 1}`;

  const questionText =
    question.question ??
    question.text ??
    question.question_text ??
    "";

  const options = Array.isArray(question.options)
    ? question.options.map((option) => String(option))
    : [];

  return {
    ...question,

    question_id: String(questionId),

    question: String(questionText),

    options,

    difficulty:
      question.difficulty ||
      question.level ||
      "medium",

    // Never expose correct answer while taking quiz
    correct_answer: undefined,
  };
};

// ============================================================
// NORMALIZE QUIZ HISTORY ITEM
// ============================================================

const normalizeQuizHistoryItem = (
  item,
  index
) => {
  if (!item) {
    return null;
  }

  const quizId =
    item.quiz_id ??
    item.attempt_id ??
    item.id ??
    `quiz-${index + 1}`;

  const lectureId =
    item.lecture_id ??
    item.lectureId ??
    null;

  const score = Number(
    item.score ??
      item.correct_answers ??
      item.correctAnswers ??
      0
  );

  const totalMarks = Number(
    item.total_marks ??
      item.totalMarks ??
      item.total_questions ??
      item.totalQuestions ??
      item.number_of_questions ??
      0
  );

  let percentage = 0;

  if (
    item.percentage !== undefined &&
    item.percentage !== null
  ) {
    percentage = Number(item.percentage);
  } else if (totalMarks > 0) {
    percentage = Math.round(
      (score / totalMarks) * 100
    );
  }

  const createdAt =
    item.created_at ??
    item.createdAt ??
    item.attempted_at ??
    item.attemptedAt ??
    item.completed_at ??
    item.completedAt ??
    item.submitted_at ??
    item.submittedAt ??
    item.date ??
    null;

  return {
    ...item,

    quiz_id: String(quizId),

    lecture_id: lectureId
      ? String(lectureId)
      : null,

    lecture_title:
      item.lecture_title ??
      item.lecture_name ??
      item.lectureTitle ??
      item.title ??
      "Quiz",

    topic:
      item.topic ??
      item.lecture_topic ??
      item.lectureTopic ??
      "General Quiz",

    teaching_strategy:
      item.teaching_strategy ??
      item.teachingStrategy ??
      item.strategy ??
      null,

    score,

    total_marks: totalMarks,

    percentage,

    passed:
      item.passed !== undefined &&
      item.passed !== null
        ? Boolean(item.passed)
        : percentage >= 50,

    created_at: createdAt,
  };
};

// ============================================================
// GENERATE QUIZ
// ============================================================

const generateQuiz = async ({
  lectureId,
  topic = null,

  // IMPORTANT:
  // Teaching strategy now comes from QuizPage
  teachingStrategy = "Simple",

  numberOfQuestions = 10,
}) => {
  try {
    // ----------------------------------------------------------
    // VALIDATE LECTURE ID
    // ----------------------------------------------------------

    if (!lectureId) {
      return {
        success: false,
        error: "Lecture ID is required.",
      };
    }

    // ----------------------------------------------------------
    // VALIDATE QUESTION COUNT
    // ----------------------------------------------------------

    const questionCount =
      Number(numberOfQuestions);

    if (
      !Number.isInteger(questionCount) ||
      questionCount < 5 ||
      questionCount > 20
    ) {
      return {
        success: false,
        error:
          "Number of questions must be between 5 and 20.",
      };
    }

    // ----------------------------------------------------------
    // NORMALIZE TEACHING STRATEGY
    // ----------------------------------------------------------

    const normalizedStrategy =
      typeof teachingStrategy === "string" &&
      teachingStrategy.trim()
        ? teachingStrategy.trim()
        : "Simple";

    // ----------------------------------------------------------
    // BUILD PAYLOAD
    // ----------------------------------------------------------

    const payload = {
      lecture_id: String(lectureId),

      topic:
        typeof topic === "string" &&
        topic.trim()
          ? topic.trim()
          : null,

      // IMPORTANT:
      // Backend receives the selected teaching strategy
      teaching_strategy: normalizedStrategy,

      number_of_questions:
        questionCount,
    };

    // ----------------------------------------------------------
    // DEBUG
    // ----------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "AI QUIZ - GENERATING"
    );

    console.log(
      "POST /quiz/generate"
    );

    console.log(
      "Payload:",
      payload
    );

    console.log(
      "Teaching Strategy:",
      normalizedStrategy
    );

    console.log(
      "========================================"
    );

    // ----------------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------------

    const response = await api.post(
      "/quiz/generate",
      payload
    );

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    console.log(
      "AI QUIZ - GENERATION SUCCESS"
    );

    console.log(
      "Response:",
      response.data
    );

    const quiz =
      normalizeQuizResponse(
        response.data
      );

    // ----------------------------------------------------------
    // VALIDATE RESPONSE
    // ----------------------------------------------------------

    if (!quiz) {
      return {
        success: false,
        error:
          "The server returned an empty quiz.",
      };
    }

    if (!quiz.quiz_id) {
      return {
        success: false,
        error:
          "Invalid quiz response: quiz ID is missing.",
      };
    }

    if (!Array.isArray(quiz.questions)) {
      return {
        success: false,
        error:
          "Invalid quiz response: questions are missing.",
      };
    }

    if (quiz.questions.length === 0) {
      return {
        success: false,
        error:
          "No questions were generated for this lecture.",
      };
    }

    // ----------------------------------------------------------
    // NORMALIZE QUESTIONS
    // ----------------------------------------------------------

    const normalizedQuestions =
      quiz.questions
        .map(normalizeQuestion)
        .filter(Boolean);

    if (
      normalizedQuestions.length === 0
    ) {
      return {
        success: false,
        error:
          "The server returned no valid quiz questions.",
      };
    }

    // ----------------------------------------------------------
    // NORMALIZED QUIZ
    // ----------------------------------------------------------

    const normalizedQuiz = {
      ...quiz,

      quiz_id: String(
        quiz.quiz_id
      ),

      lecture_id:
        quiz.lecture_id
          ? String(quiz.lecture_id)
          : String(lectureId),

      topic:
        quiz.topic ??
        topic ??
        null,

      // IMPORTANT:
      // Keep strategy from backend if returned.
      // Otherwise use selected strategy.
      teaching_strategy:
        quiz.teaching_strategy ??
        quiz.teachingStrategy ??
        normalizedStrategy,

      questions:
        normalizedQuestions,
    };

    console.log(
      "NORMALIZED QUIZ:",
      normalizedQuiz
    );

    return {
      success: true,
      data: normalizedQuiz,
    };
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "QUIZ GENERATION FAILED"
    );

    console.error(error);

    console.error(
      "Response:",
      error?.response?.data
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Failed to generate quiz."
      ),
    };
  }
};

// ============================================================
// SUBMIT QUIZ
// ============================================================

const submitQuiz = async ({
  quizId,
  answers = [],
  teachingStrategy = null,
}) => {
  try {
    // ----------------------------------------------------------
    // VALIDATE QUIZ ID
    // ----------------------------------------------------------

    if (!quizId) {
      return {
        success: false,
        error: "Quiz ID is required.",
      };
    }

    // ----------------------------------------------------------
    // VALIDATE ANSWERS
    // ----------------------------------------------------------

    if (!Array.isArray(answers)) {
      return {
        success: false,
        error:
          "Quiz answers must be an array.",
      };
    }

    // ----------------------------------------------------------
    // FORMAT ANSWERS
    // ----------------------------------------------------------

    const formattedAnswers =
      answers.map((answer) => ({
        question_id:
          answer?.question_id
            ? String(answer.question_id)
            : "",

        selected_answer:
          typeof answer?.selected_answer ===
          "string"
            ? answer.selected_answer
            : "",
      }));

    // ----------------------------------------------------------
    // BUILD PAYLOAD
    // ----------------------------------------------------------

    const payload = {
      quiz_id: String(quizId),

      answers:
        formattedAnswers,
    };

    // Only send strategy when available.
    // This prevents breaking an older backend.
    if (
      typeof teachingStrategy === "string" &&
      teachingStrategy.trim()
    ) {
      payload.teaching_strategy =
        teachingStrategy.trim();
    }

    // ----------------------------------------------------------
    // DEBUG
    // ----------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "AI QUIZ - SUBMITTING"
    );

    console.log(
      "POST /quiz/submit"
    );

    console.log(
      "Payload:",
      payload
    );

    console.log(
      "========================================"
    );

    // ----------------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------------

    const response = await api.post(
      "/quiz/submit",
      payload
    );

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    console.log(
      "AI QUIZ - SUBMISSION SUCCESS"
    );

    console.log(
      "Response:",
      response.data
    );

    const result =
      normalizeSubmitResponse(
        response.data
      );

    if (!result) {
      return {
        success: false,
        error:
          "The server returned an empty quiz result.",
      };
    }

    // ----------------------------------------------------------
    // NORMALIZE QUESTION RESULTS
    // ----------------------------------------------------------

    const normalizedResults =
      Array.isArray(result.results)
        ? result.results.map(
            (item, index) => ({
              ...item,

              question_id:
                item?.question_id ??
                item?.id ??
                `question-${index + 1}`,

              question:
                item?.question ??
                item?.question_text ??
                item?.text ??
                "",

              selected_answer:
                item?.selected_answer ??
                item?.selectedAnswer ??
                "",

              correct_answer:
                item?.correct_answer ??
                item?.correctAnswer ??
                "",

              explanation:
                item?.explanation ??
                "",

              is_correct:
                item?.is_correct !== undefined
                  ? Boolean(item.is_correct)
                  : Boolean(
                      item?.isCorrect
                    ),
            })
          )
        : [];

    // ----------------------------------------------------------
    // NORMALIZED RESULT
    // ----------------------------------------------------------

    const normalizedResult = {
      ...result,

      quiz_id:
        result.quiz_id
          ? String(result.quiz_id)
          : String(quizId),

      lecture_id:
        result.lecture_id
          ? String(result.lecture_id)
          : null,

      score:
        Number(result.score ?? 0),

      total_marks:
        Number(result.total_marks ?? 0),

      percentage:
        Number(result.percentage ?? 0),

      passed:
        Boolean(result.passed),

      teaching_strategy:
        result.teaching_strategy ??
        result.teachingStrategy ??
        teachingStrategy ??
        null,

      results:
        normalizedResults,
    };

    return {
      success: true,
      data: normalizedResult,
    };
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "QUIZ SUBMISSION FAILED"
    );

    console.error(error);

    console.error(
      "Response:",
      error?.response?.data
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Failed to submit quiz."
      ),
    };
  }
};

// ============================================================
// GET QUIZ BY ID
// ============================================================

const getQuiz = async (quizId) => {
  try {
    if (!quizId) {
      return {
        success: false,
        error: "Quiz ID is required.",
      };
    }

    console.log(
      "Fetching quiz:",
      quizId
    );

    const response =
      await api.get(
        `/quiz/${quizId}`
      );

    const quiz =
      normalizeQuizResponse(
        response.data
      );

    if (!quiz) {
      return {
        success: false,
        error:
          "Quiz could not be found.",
      };
    }

    // Normalize questions if available
    const normalizedQuiz = {
      ...quiz,

      quiz_id: quiz.quiz_id
        ? String(quiz.quiz_id)
        : String(quizId),

      questions:
        Array.isArray(quiz.questions)
          ? quiz.questions
              .map(normalizeQuestion)
              .filter(Boolean)
          : [],

      teaching_strategy:
        quiz.teaching_strategy ??
        quiz.teachingStrategy ??
        null,
    };

    return {
      success: true,
      data: normalizedQuiz,
    };
  } catch (error) {
    console.error(
      "Failed to fetch quiz:",
      error
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to fetch quiz."
      ),
    };
  }
};

// ============================================================
// GET QUIZ HISTORY
// ============================================================
//
// getQuizHistory()
//     -> ALL quiz attempts
//
// getQuizHistory(lectureId)
//     -> quiz attempts for one lecture
//
// Backend endpoints:
//
// GET /quiz/history
// GET /quiz/lecture/{lectureId}/history
//
// ============================================================

const getQuizHistory = async (
  lectureId = null
) => {
  try {
    let endpoint = "";

    // ----------------------------------------------------------
    // ALL QUIZ HISTORY
    // ----------------------------------------------------------

    if (!lectureId) {
      endpoint = "/quiz/history";

      console.log(
        "========================================"
      );

      console.log(
        "QUIZ HISTORY - ALL ATTEMPTS"
      );

      console.log(
        "GET /quiz/history"
      );

      console.log(
        "========================================"
      );
    }

    // ----------------------------------------------------------
    // LECTURE QUIZ HISTORY
    // ----------------------------------------------------------

    else {
      endpoint =
        `/quiz/lecture/${lectureId}/history`;

      console.log(
        "========================================"
      );

      console.log(
        "QUIZ HISTORY - LECTURE"
      );

      console.log(
        `GET ${endpoint}`
      );

      console.log(
        "========================================"
      );
    }

    // ----------------------------------------------------------
    // API
    // ----------------------------------------------------------

    const response =
      await api.get(endpoint);

    console.log(
      "QUIZ HISTORY - SUCCESS"
    );

    console.log(
      "Response:",
      response.data
    );

    // ----------------------------------------------------------
    // NORMALIZE RESPONSE
    // ----------------------------------------------------------

    let history = [];

    if (Array.isArray(response.data)) {
      history = response.data;
    }

    else if (
      Array.isArray(
        response.data?.data
      )
    ) {
      history =
        response.data.data;
    }

    else if (
      Array.isArray(
        response.data?.history
      )
    ) {
      history =
        response.data.history;
    }

    else if (
      Array.isArray(
        response.data?.result
      )
    ) {
      history =
        response.data.result;
    }

    else if (
      Array.isArray(
        response.data?.attempts
      )
    ) {
      history =
        response.data.attempts;
    }

    // ----------------------------------------------------------
    // NORMALIZE ITEMS
    // ----------------------------------------------------------

    const normalizedHistory =
      history
        .map(
          normalizeQuizHistoryItem
        )
        .filter(Boolean);

    // ----------------------------------------------------------
    // NEWEST FIRST
    // ----------------------------------------------------------

    normalizedHistory.sort(
      (a, b) => {
        if (
          !a.created_at &&
          !b.created_at
        ) {
          return 0;
        }

        if (!a.created_at) {
          return 1;
        }

        if (!b.created_at) {
          return -1;
        }

        const dateA =
          new Date(
            a.created_at
          ).getTime();

        const dateB =
          new Date(
            b.created_at
          ).getTime();

        return dateB - dateA;
      }
    );

    return {
      success: true,
      data: normalizedHistory,
    };
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "QUIZ HISTORY FAILED"
    );

    console.error(error);

    console.error(
      "Response:",
      error?.response?.data
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to fetch quiz history."
      ),
    };
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

const quizService = {
  generateQuiz,
  submitQuiz,
  getQuiz,
  getQuizHistory,
};

export default quizService;