// components/AuthRedirect.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthRedirect = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (user.role === "student") {
    Navigate('/student');
  } else if (user.role === "admin") {
    Navigate('/admin');
  }

  return children;
};

export default AuthRedirect;
