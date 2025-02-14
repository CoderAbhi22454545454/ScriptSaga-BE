// components/AuthRedirect.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthRedirect = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (user.role === "student") {
    return <Navigate to="/" replace />;
  } else if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  } else if (user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }

  return children;
};

export default AuthRedirect;
