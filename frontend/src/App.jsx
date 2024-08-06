import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import StudentList from './components/Dashboard/StudentList'
import AdminDashboard from './components/Dashboard/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        path: '/',
        element: <AdminDashboard />,
      },
      {
        path: '/class/:classId',
        element: <StudentList />,
      },
    ],
  },
  {
    path: '/login',
    element: <PublicRoute />,
    children: [
      {
        path: '',
        element: <Login />,
      },
    ],
  },
  {
    path: '/register',
    element: <PublicRoute />,
    children: [
      {
        path: '',
        element: <Register />,
      },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={appRouter} />
  );
}

export default App
