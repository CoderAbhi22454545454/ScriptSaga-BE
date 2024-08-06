import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    return <Navigate to="/" />; // Redirect to home or any other protected route
  }

  return <Outlet />;
};

export default PublicRoute;
