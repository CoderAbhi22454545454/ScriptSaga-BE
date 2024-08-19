import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentList from './components/Dashboard/StudentList';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import StudentDetail from './components/Dashboard/Github/StudentDetailGit';
import StudentDetailGit from './components/Dashboard/Github/StudentDetailGit';

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        path: '',
        element: <AdminDashboard />,
      },
      {
        path: 'class/:classId',
        element: <StudentList />,
      },
      {
        path: 'StudentDetail',
        element: <StudentDetail />,
      },
      {
        path: 'student/:userId',
        element: <StudentDetailGit />
      }
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute role="student" />,
    children: [
      {
        path: '',
        element: <StudentDashboard />,
      },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={appRouter} />
  );
}

export default App;
