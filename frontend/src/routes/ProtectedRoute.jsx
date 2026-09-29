import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


// ============================================================
// PROTECTED ROUTE
// ============================================================

export function ProtectedRoute({ children }) {

  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();


  // ----------------------------------------------------------
  // WAIT FOR AUTH
  // ----------------------------------------------------------

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-[#f7f3ea]
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-[#6f8061]
              flex
              items-center
              justify-center
              mx-auto
              mb-4
              animate-pulse
            "
          >

            <span
              className="
                text-white
                font-bold
                text-xl
              "
            >
              T
            </span>

          </div>


          <p className="text-[#6f7068]">
            Loading TwinLearn...
          </p>

        </div>

      </div>

    );

  }


  // ----------------------------------------------------------
  // NOT AUTHENTICATED
  // ----------------------------------------------------------

  if (!isAuthenticated) {

    return (

      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />

    );

  }


  // ----------------------------------------------------------
  // AUTHENTICATED
  // ----------------------------------------------------------

  return children;

}


// ============================================================
// PUBLIC ROUTE
// ============================================================

export function PublicRoute({ children }) {

  const {
    isAuthenticated,
    loading,
  } = useAuth();


  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-[#f7f3ea]
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-[#6f8061]
              flex
              items-center
              justify-center
              mx-auto
              mb-4
              animate-pulse
            "
          >

            <span
              className="
                text-white
                font-bold
                text-xl
              "
            >
              T
            </span>

          </div>


          <p className="text-[#6f7068]">
            Loading TwinLearn...
          </p>

        </div>

      </div>

    );

  }


  if (isAuthenticated) {

    return (

      <Navigate
        to="/dashboard"
        replace
      />

    );

  }


  return children;

}