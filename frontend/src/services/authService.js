import axios from "axios";

const API_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "twinalai_auth";


// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {

  // ==========================================================
  // REGISTER
  // ==========================================================

  register: async (userData) => {
    try {

      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          full_name: userData.full_name,
          email: userData.email,
          password: userData.password,
        }
      );

      return {
        success: true,
        message: response.data.message,
        email: response.data.email,
      };

    } catch (error) {

      console.error("REGISTER ERROR:", error);

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Registration failed. Please try again.",
      };
    }
  },


  // ==========================================================
  // LOGIN
  // ==========================================================

  login: async (email, password, rememberMe = false) => {
    try {

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      const data = response.data;

      /*
        Expected backend response:

        {
          access_token: "...",
          token_type: "bearer",
          student: {
            student_id: "...",
            full_name: "...",
            email: "...",
            created_at: "..."
          }
        }
      */

      const authData = {
        token: data.access_token,
        tokenType: data.token_type || "bearer",
        user: data.student,
        rememberMe,
        loginAt: new Date().toISOString(),
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authData)
      );

      return {
        success: true,
        token: data.access_token,
        user: data.student,
      };

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Invalid email or password.",
      };
    }
  },


  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  verifyOTP: async (email, otp) => {
    try {

      const response = await axios.post(
        `${API_URL}/auth/verify-otp`,
        {
          email: email.trim(),
          otp: otp.trim(),
        }
      );

      const data = response.data;

      /*
        Backend returns JWT after successful OTP verification.
      */

      const authData = {
        token: data.access_token,
        tokenType: data.token_type || "bearer",
        user: data.student,
        loginAt: new Date().toISOString(),
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authData)
      );

      return {
        success: true,
        token: data.access_token,
        user: data.student,
      };

    } catch (error) {

      console.error("OTP ERROR:", error);

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "OTP verification failed.",
      };
    }
  },


  // ==========================================================
  // RESEND OTP
  // ==========================================================

  resendOTP: async (email) => {
    try {

      const response = await axios.post(
        `${API_URL}/auth/resend-otp`,
        {
          email: email.trim(),
        }
      );

      return {
        success: true,
        message: response.data.message,
        email: response.data.email,
      };

    } catch (error) {

      console.error("RESEND OTP ERROR:", error);

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Unable to resend OTP.",
      };
    }
  },


  // ==========================================================
  // LOGOUT
  // ==========================================================

  logout: () => {

    localStorage.removeItem(STORAGE_KEY);

  },


  // ==========================================================
  // GET AUTH DATA
  // ==========================================================

  getAuthData: () => {

    const auth = localStorage.getItem(STORAGE_KEY);

    if (!auth) {
      return null;
    }

    try {

      return JSON.parse(auth);

    } catch (error) {

      console.error(
        "Invalid authentication data:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);

      return null;
    }
  },


  // ==========================================================
  // GET CURRENT USER
  // ==========================================================

  getCurrentUser: () => {

    const authData = authService.getAuthData();

    return authData?.user || null;
  },


  // ==========================================================
  // GET JWT TOKEN
  // ==========================================================

  getToken: () => {

    const authData = authService.getAuthData();

    return authData?.token || null;
  },


  // ==========================================================
  // CHECK AUTHENTICATION
  // ==========================================================

  isAuthenticated: () => {

    const authData = authService.getAuthData();

    if (!authData) {
      return false;
    }

    return Boolean(
      authData.token &&
      authData.user
    );
  },


  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  forgotPassword: async () => {

    return {
      success: false,
      error:
        "Password reset is not implemented yet.",
    };
  },

};