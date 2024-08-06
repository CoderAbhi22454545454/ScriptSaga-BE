import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ role }) => {
  const user = useSelector((state) => state.auth.user);
  let location = useLocation();

  if (!user || user.role !== role) {
    return <Navigate to="/login" state={{from : location}} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
