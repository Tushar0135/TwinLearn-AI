import api from "./api";

// ============================================================
// ERROR HELPER
// ============================================================

const getErrorMessage = (error, fallback) => {
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;

    if (typeof detail === "string") {
      return detail;
    }

    return JSON.stringify(detail);
  }

  if (error?.response?.data?.message) {
    const message = error.response.data.message;

    if (typeof message === "string") {
      return message;
    }

    return JSON.stringify(message);
  }

  if (error?.response?.data?.error) {
    const apiError = error.response.data.error;

    if (typeof apiError === "string") {
      return apiError;
    }

    return JSON.stringify(apiError);
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};


// ============================================================
// NORMALIZE LECTURE LIST
// ============================================================

const normalizeLectureList = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.lectures)) {
    return responseData.lectures;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  return [];
};


// ============================================================
// UPLOAD LECTURE FILE
// ============================================================

export const uploadLecture = async ({
  file,
  title,
  subject,
  topic = "",
  description = "",
}) => {
  try {
    if (!file) {
      return {
        success: false,
        error: "Please select a lecture file.",
      };
    }

    if (!title?.trim()) {
      return {
        success: false,
        error: "Lecture title is required.",
      };
    }

    if (!subject?.trim()) {
      return {
        success: false,
        error: "Subject is required.",
      };
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("subject", subject.trim());
    formData.append("topic", topic?.trim() || "");
    formData.append(
      "description",
      description?.trim() || ""
    );

    console.log(
      "========================================"
    );
    console.log(
      "TWINLEARN AI - UPLOAD LECTURE"
    );
    console.log("File:", file.name);
    console.log("Size:", file.size);
    console.log("Type:", file.type);
    console.log("Title:", title);
    console.log("Subject:", subject);
    console.log("Topic:", topic);
    console.log(
      "========================================"
    );

    // Do NOT manually set Content-Type.
    // Axios/browser creates the multipart boundary.

    const response = await api.post(
      "/upload",
      formData
    );

    console.log(
      "========================================"
    );
    console.log(
      "BACKEND UPLOAD SUCCESS"
    );
    console.log("Response:", response.data);
    console.log(
      "========================================"
    );

    return {
      success: true,
      data: response.data,
    };

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "LECTURE UPLOAD FAILED"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Lecture upload failed."
      ),
    };
  }
};


// ============================================================
// UPLOAD YOUTUBE LECTURE
// ============================================================

export const uploadYoutubeLecture = async ({
  youtubeUrl,
  title,
  subject,
  topic = "",
  description = "",
}) => {
  try {
    if (!youtubeUrl?.trim()) {
      return {
        success: false,
        error: "Please enter a YouTube URL.",
      };
    }

    if (!title?.trim()) {
      return {
        success: false,
        error: "Lecture title is required.",
      };
    }

    if (!subject?.trim()) {
      return {
        success: false,
        error: "Subject is required.",
      };
    }

    const payload = {
      youtube_url: youtubeUrl.trim(),
      title: title.trim(),
      subject: subject.trim(),
      topic: topic?.trim() || "",
      description: description?.trim() || "",
    };

    console.log(
      "========================================"
    );
    console.log(
      "TWINLEARN AI - YOUTUBE UPLOAD"
    );
    console.log("Payload:", payload);
    console.log(
      "========================================"
    );

    const response = await api.post(
      "/upload-youtube",
      payload
    );

    console.log(
      "========================================"
    );
    console.log(
      "YOUTUBE BACKEND SUCCESS"
    );
    console.log("Response:", response.data);
    console.log(
      "========================================"
    );

    return {
      success: true,
      data: response.data,
    };

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "YOUTUBE UPLOAD FAILED"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "YouTube lecture processing failed."
      ),
    };
  }
};


// ============================================================
// GET LECTURE HISTORY
// ============================================================

export const getLectureHistory = async () => {
  try {
    const response = await api.get(
      "/history"
    );

    console.log(
      "LECTURE HISTORY:",
      response.data
    );

    return {
      success: true,
      data: normalizeLectureList(
        response.data
      ),
    };

  } catch (error) {
    console.error(
      "FAILED TO FETCH LECTURE HISTORY:",
      error
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to fetch lecture history."
      ),
    };
  }
};


// ============================================================
// GET ALL LECTURES
// ============================================================
//
// Used by:
// - MyLecturesPage
// - AIProfessorPage
// - Other pages that need lecture list
//
// Backend:
// GET /history
//

export const getLectures = async () => {
  try {
    console.log(
      "========================================"
    );
    console.log(
      "TWINLEARN AI - FETCHING LECTURES"
    );
    console.log("GET /history");
    console.log(
      "========================================"
    );

    const response = await api.get(
      "/history"
    );

    console.log(
      "========================================"
    );
    console.log(
      "LECTURES RESPONSE"
    );
    console.log(response.data);
    console.log(
      "========================================"
    );

    const lectures =
      normalizeLectureList(
        response.data
      );

    console.log(
      "NORMALIZED LECTURES:",
      lectures
    );

    return {
      success: true,
      data: lectures,
    };

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "FAILED TO FETCH LECTURES"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to fetch lectures."
      ),
    };
  }
};


// ============================================================
// GET SINGLE LECTURE
// ============================================================
//
// Backend route:
//
// GET /history/{lecture_id}
//
// IMPORTANT:
// Previously this function called:
//
// /lectures/{lectureId}
//
// But your backend history_routes.py defines:
//
// /history/{lecture_id}
//
// Therefore this must use /history/.
//
// ============================================================

export const getLecture = async (
  lectureId
) => {
  try {
    if (!lectureId) {
      return {
        success: false,
        error: "Lecture ID is required.",
      };
    }

    console.log(
      "========================================"
    );
    console.log(
      "FETCHING SINGLE LECTURE"
    );
    console.log(
      "Lecture ID:",
      lectureId
    );
    console.log(
      "GET:",
      `/history/${lectureId}`
    );
    console.log(
      "========================================"
    );

    const response = await api.get(
      `/history/${lectureId}`
    );

    console.log(
      "========================================"
    );
    console.log(
      "LECTURE DETAILS RESPONSE"
    );
    console.log(response.data);
    console.log(
      "========================================"
    );

    return {
      success: true,
      data: response.data,
    };

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "FAILED TO FETCH SINGLE LECTURE"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to fetch lecture."
      ),
    };
  }
};


// ============================================================
// DELETE LECTURE
// ============================================================
//
// Your MyLecturesPage already calls:
//
// lectureService.deleteLecture(lectureId)
//
// So this function needs to exist here.
//
// IMPORTANT:
// The exact backend DELETE route must match your backend.
// This assumes:
//
// DELETE /lectures/{lecture_id}
//
// If your backend uses another route, send me that route.
// ============================================================

export const deleteLecture = async (
  lectureId
) => {
  try {
    if (!lectureId) {
      return {
        success: false,
        error: "Lecture ID is required.",
      };
    }

    console.log(
      "========================================"
    );
    console.log(
      "DELETING LECTURE"
    );
    console.log(
      "Lecture ID:",
      lectureId
    );
    console.log(
      "DELETE:",
      `/lectures/${lectureId}`
    );
    console.log(
      "========================================"
    );

    const response = await api.delete(
      `/lectures/${lectureId}`
    );

    console.log(
      "LECTURE DELETE SUCCESS:",
      response.data
    );

    return {
      success: true,
      data: response.data,
    };

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "FAILED TO DELETE LECTURE"
    );
    console.error(error);
    console.error(
      "========================================"
    );

    return {
      success: false,
      error: getErrorMessage(
        error,
        "Unable to delete lecture."
      ),
    };
  }
};


// ============================================================
// DEFAULT EXPORT
// ============================================================

const lectureService = {
  uploadLecture,
  uploadYoutubeLecture,
  getLectureHistory,
  getLectures,
  getLecture,
  deleteLecture,
};

export default lectureService;