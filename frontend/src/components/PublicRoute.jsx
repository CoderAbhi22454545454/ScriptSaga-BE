import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" />
      case "student":
        return <Navigate to="/student" />
      case "teacher":
        return <Navigate to="/teacher" />
      default:
        return <Navigate to="/" />
    }
  }

  return <Outlet />;
};

export default PublicRoute;
