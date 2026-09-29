import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";


// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext(null);


// ============================================================
// STORAGE KEY
// ============================================================

const AUTH_STORAGE_KEY = "twinalai_auth";


// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);


  // ==========================================================
  // RESTORE AUTHENTICATION
  // ==========================================================

  useEffect(() => {

    try {

      const storedAuth =
        localStorage.getItem(AUTH_STORAGE_KEY);

      if (!storedAuth) {
        setUser(null);
        setToken(null);
        return;
      }

      const auth =
        JSON.parse(storedAuth);


      // ------------------------------------------------------
      // NEW CORRECT FORMAT
      // ------------------------------------------------------

      if (auth?.user && auth?.token) {

        setUser(auth.user);
        setToken(auth.token);

        return;
      }


      // ------------------------------------------------------
      // OLD / INVALID FORMAT
      // ------------------------------------------------------

      console.warn(
        "Invalid authentication data found. Clearing storage."
      );

      localStorage.removeItem(
        AUTH_STORAGE_KEY
      );

      setUser(null);
      setToken(null);

    } catch (error) {

      console.error(
        "Failed to restore authentication:",
        error
      );

      localStorage.removeItem(
        AUTH_STORAGE_KEY
      );

      setUser(null);
      setToken(null);

    } finally {

      setLoading(false);

    }

  }, []);


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = (
    userData,
    accessToken,
    tokenType = "bearer"
  ) => {

    if (!userData || !accessToken) {

      console.error(
        "Login failed: user or token missing."
      );

      return false;
    }


    // --------------------------------------------------------
    // UPDATE REACT STATE
    // --------------------------------------------------------

    setUser(userData);
    setToken(accessToken);


    // --------------------------------------------------------
    // SAVE COMPLETE AUTH OBJECT
    // --------------------------------------------------------

    const authData = {

      user: userData,

      token: accessToken,

      tokenType: tokenType || "bearer",

      loginAt:
        new Date().toISOString(),

    };


    try {

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(authData)
      );

      console.log(
        "Authentication saved successfully."
      );

      console.log(
        "Token exists:",
        Boolean(accessToken)
      );

    } catch (error) {

      console.error(
        "Failed to save authentication:",
        error
      );

      return false;
    }


    return true;
  };


  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const updateUser = (updates) => {

    setUser((currentUser) => {

      if (!currentUser) {
        return currentUser;
      }


      const updatedUser = {
        ...currentUser,
        ...updates,
      };


      try {

        const storedAuth =
          localStorage.getItem(
            AUTH_STORAGE_KEY
          );

        const auth =
          storedAuth
            ? JSON.parse(storedAuth)
            : {};


        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            ...auth,
            user: updatedUser,
          })
        );

      } catch (error) {

        console.error(
          "Failed to save updated user:",
          error
        );

      }


      return updatedUser;

    });

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    try {

      authService.logout();

    } catch (error) {

      console.error(
        "Logout service failed:",
        error
      );

    }


    setUser(null);
    setToken(null);


    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

  };


  // ==========================================================
  // AUTH STATE
  // ==========================================================

  const isAuthenticated =
    Boolean(user && token);


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {

    user,

    token,

    loading,

    isAuthenticated,

    login,

    logout,

    updateUser,

  };


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

}


// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {

  const context =
    useContext(AuthContext);


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;

}