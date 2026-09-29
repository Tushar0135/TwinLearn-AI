import axios from "axios";


// ============================================================
// API CONFIG
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const STORAGE_KEY =
  "twinalai_auth";


// ============================================================
// AXIOS CLIENT
// ============================================================

const api = axios.create({

  baseURL: API_URL,

  // 10 minutes
  timeout: 600000,

});


// ============================================================
// GET AUTH DATA
// ============================================================

const getAuthData = () => {

  try {

    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {

      return null;

    }


    const auth =
      JSON.parse(stored);


    return auth;

  } catch (error) {

    console.error(
      "Failed to parse authentication data:",
      error
    );

    return null;

  }

};


// ============================================================
// GET TOKEN
// ============================================================

export const getAuthToken = () => {

  const auth =
    getAuthData();

  return auth?.token || null;

};


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(

  (config) => {

    // --------------------------------------------------------
    // GET AUTH DATA
    // --------------------------------------------------------

    const auth =
      getAuthData();


    // --------------------------------------------------------
    // GET TOKEN
    // --------------------------------------------------------

    const token =
      auth?.token;


    // --------------------------------------------------------
    // TOKEN TYPE
    // --------------------------------------------------------

    const tokenType =
      auth?.token_type ||
      auth?.tokenType ||
      "bearer";


    // --------------------------------------------------------
    // ATTACH AUTHORIZATION
    // --------------------------------------------------------

    if (token) {

      config.headers =
        config.headers || {};


      config.headers.Authorization =
        `${tokenType} ${token}`;

    }


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "API REQUEST"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Method:",
      config.method?.toUpperCase()
    );

    console.log(
      "URL:",
      `${config.baseURL}${config.url}`
    );

    console.log(
      "AUTH:",
      token
        ? "TOKEN ATTACHED"
        : "NO TOKEN"
    );

    if (token) {

      console.log(
        "TOKEN PREFIX:",
        `${token.substring(0, 15)}...`
      );

      console.log(
        "TOKEN TYPE:",
        tokenType
      );

    }


    console.log(
      "========================================"
    );


    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(

  (response) => {

    console.log(
      "========================================"
    );

    console.log(
      "API RESPONSE"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Status:",
      response.status
    );

    console.log(
      "URL:",
      response.config?.url
    );

    console.log(
      "========================================"
    );


    return response;

  },


  (error) => {

    console.error(
      "========================================"
    );

    console.error(
      "API ERROR"
    );

    console.error(
      "========================================"
    );

    console.error(
      "URL:",
      error.config?.url
    );

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Response:",
      error.response?.data
    );

    console.error(
      "========================================"
    );


    // --------------------------------------------------------
    // TIMEOUT
    // --------------------------------------------------------

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {

      console.error(
        "REQUEST TIMED OUT."
      );

    }


    // --------------------------------------------------------
    // 401
    // --------------------------------------------------------

    if (
      error.response?.status === 401
    ) {

      console.error(
        "401 UNAUTHORIZED"
      );

      console.error(
        "JWT is missing, expired, malformed, or rejected by backend."
      );


      /*
       * IMPORTANT:
       *
       * Do NOT automatically remove the token here.
       *
       * Otherwise the user could get logged out
       * while debugging another protected endpoint.
       */

    }


    return Promise.reject(error);

  }

);


export default api;