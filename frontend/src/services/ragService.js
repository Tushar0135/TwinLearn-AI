import api from "./api";

/**
 * ============================================================
 * RAG SERVICE
 * ============================================================
 *
 * Frontend
 *    ↓
 * lecture_id
 * question
 * teaching_strategy
 *    ↓
 * POST /rag/ask
 *    ↓
 * FastAPI
 *    ↓
 * Teaching Strategy
 *    ↓
 * Retrieval
 *    ↓
 * Context
 *    ↓
 * PromptService
 *    ↓
 * Gemini
 *    ↓
 * Answer
 *
 * ============================================================
 */


// ============================================================
// ASK QUESTION
// ============================================================

const askQuestion = async (
  lectureId,
  question,
  teachingStrategy = null
) => {

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!lectureId) {

    return {
      success: false,
      error: "Lecture ID is required.",
    };

  }


  if (
    !question ||
    !question.trim()
  ) {

    return {
      success: false,
      error: "Question cannot be empty.",
    };

  }


  // ----------------------------------------------------------
  // NORMALIZE STRATEGY
  // ----------------------------------------------------------

  const strategy = teachingStrategy
    ? String(teachingStrategy)
        .trim()
        .toLowerCase()
    : null;


  // ----------------------------------------------------------
  // PAYLOAD
  // ----------------------------------------------------------

  const payload = {

    lecture_id:
      String(lectureId),

    question:
      question.trim(),

    top_k:
      5,

    teaching_strategy:
      strategy,

  };


  // ----------------------------------------------------------
  // DEBUG
  // ----------------------------------------------------------

  console.log(
    "========================================"
  );

  console.log(
    "AI PROFESSOR RAG REQUEST"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Lecture ID:",
    lectureId
  );

  console.log(
    "Question:",
    question
  );

  console.log(
    "Teaching Strategy:",
    strategy
  );

  console.log(
    "Payload:",
    payload
  );

  console.log(
    "========================================"
  );


  // ----------------------------------------------------------
  // API CALL
  // ----------------------------------------------------------

  try {

    const response =
      await api.post(
        "/rag/ask",
        payload
      );


    const data =
      response.data;


    // --------------------------------------------------------
    // RESPONSE DEBUG
    // --------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "AI PROFESSOR RAG RESPONSE"
    );

    console.log(
      data
    );

    console.log(
      "Backend Strategy:",
      data?.teaching_strategy
    );

    console.log(
      "========================================"
    );


    // --------------------------------------------------------
    // NORMALIZE RESPONSE
    // --------------------------------------------------------

    return {

      success: true,

      data: {

        answer:
          data?.answer ||
          "I could not generate an answer.",


        sources:
          normalizeSources(
            data?.sources
          ),


        retrievedChunks:
          Number(
            data?.retrieved_chunks ?? 0
          ),


        grounded:
          data?.grounded === true,


        teaching_strategy:
          data?.teaching_strategy ||
          data?.strategy ||
          strategy,

      },

    };

  } catch (error) {

    console.error(
      "========================================"
    );

    console.error(
      "AI PROFESSOR RAG REQUEST FAILED"
    );

    console.error(
      error
    );

    console.error(
      "========================================"
    );


    const backendError =
      error?.response?.data?.detail;


    let message =
      "Failed to get an answer from the AI Professor.";


    if (
      typeof backendError === "string"
    ) {

      message =
        backendError;

    }

    else if (
      Array.isArray(backendError)
    ) {

      message =
        backendError
          .map(
            item =>
              item?.msg ||
              "Validation error"
          )
          .join(", ");

    }

    else if (
      error?.message
    ) {

      message =
        error.message;

    }


    return {

      success: false,

      error:
        message,

      status:
        error?.response?.status ||
        null,

    };

  }

};


// ============================================================
// NORMALIZE SOURCES
// ============================================================

const normalizeSources = (
  sources
) => {

  if (
    !Array.isArray(sources)
  ) {

    return [];

  }


  return sources.map(
    (
      source,
      index
    ) => {

      if (!source) {

        return {

          id:
            `source-${index}`,

          chunkId:
            null,

          lectureId:
            null,

          title:
            "Lecture",

          lectureTitle:
            "Lecture",

          sourceFile:
            "Lecture material",

          chunkNumber:
            null,

          page:
            null,

          relevance:
            null,

        };

      }


      return {

        id:
          source.chunk_id ||
          source.chunkId ||
          `source-${index}`,

        chunkId:
          source.chunk_id ??
          source.chunkId ??
          null,

        lectureId:
          source.lecture_id ??
          source.lectureId ??
          null,

        title:
          source.lecture_title ??
          source.lectureTitle ??
          "Lecture",

        lectureTitle:
          source.lecture_title ??
          source.lectureTitle ??
          "Lecture",

        sourceFile:
          source.source_file ??
          source.sourceFile ??
          "Lecture material",

        chunkNumber:
          source.chunk_number ??
          source.chunkNumber ??
          null,

        page:
          source.page ??
          null,

        relevance:
          source.relevance ??
          null,

      };

    }
  );

};


// ============================================================
// FOLLOW-UP QUESTION
// ============================================================

const followUpQuestion = async (
  lectureId,
  question,
  teachingStrategy = null
) => {

  return askQuestion(
    lectureId,
    question,
    teachingStrategy
  );

};


// ============================================================
// RECOMMENDED QUESTIONS
// ============================================================

const getRecommendedQuestions = async (
  lectureId
) => {

  if (!lectureId) {

    return {

      success: false,

      error:
        "Lecture ID is required.",

    };

  }


  const questions = [

    "What are the key concepts in this lecture?",

    "Can you explain the main concept simply?",

    "What are the most important points to remember?",

    "Can you give me a real-world example?",

    "What are the common mistakes students make?",

  ];


  return {

    success: true,

    data: questions,

  };

};


// ============================================================
// SUMMARY
// ============================================================

const generateSummary = async (
  lectureId
) => {

  if (!lectureId) {

    return {

      success: false,

      error:
        "Lecture ID is required.",

    };

  }


  return {

    success: false,

    error:
      "Summary endpoint is not available in the backend yet.",

  };

};


// ============================================================
// FEEDBACK
// ============================================================

const markResponseHelpful = async (
  responseId,
  helpful
) => {

  console.log(
    "Response feedback:",
    {
      responseId,
      helpful,
    }
  );


  return {

    success: true,

    message:
      "Feedback recorded locally.",

  };

};


// ============================================================
// EXPORT
// ============================================================

export const ragService = {

  askQuestion,

  followUpQuestion,

  getRecommendedQuestions,

  generateSummary,

  markResponseHelpful,

};