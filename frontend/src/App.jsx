import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentList from './components/Dashboard/StudentList';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import StudentDetail from './components/Dashboard/Github/studentMetrics/StudentDetailGit';
import StudentDetailGit from './components/Dashboard/Github/studentMetrics/StudentDetailGit';
import AllStudentsPage from './components/Dashboard/AllStudentsPage';
import ClassesPage from './components/Dashboard/ClassesPage';
import ClassManagement from './components/Dashboard/ClassManagement';
import StudentManagement from './components/Dashboard/StudentManagement';
import Settings from './components/Dashboard/Settings';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import TeacherManagement from './components/Dashboard/TeacherManagement';
import TeacherClassView from './components/Dashboard/TeacherClassView';
const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        path: '',  // Add this empty path for root route
        element: <Login />
      },
      ,{
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
      },
      {
        path: 'classes',
        element: <ClassesPage />,
      },
      {
        path: 'students',
        element: <AllStudentsPage />,
      },
      {
        path: 'class-management',
        element: <ClassManagement />,
      },
      {
        path: 'student-management',
        element: <StudentManagement />,
      },
      {
        path: 'settings/:id',
        element: <Settings />,
      },
      {
        path: 'teacher-management',
        element: <TeacherManagement />,
      },
    ],
  },
  {
    path: '/teacher',
    element: <ProtectedRoute role="teacher" />,
    children: [
      {
        path: '',
        element: <TeacherDashboard />,
      },
      {
        path: 'class/:classId',
        element: <TeacherClassView />,
      },
      {
        path: 'student/:userId',
        element: <StudentDetailGit />,
      },
      {
        path: 'classes',
        element: <TeacherDashboard />,
      },
      {
        path: 'students',
        element: <AllStudentsPage />,
      },
      {
        path: 'settings/:id',
        element: <Settings />,
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
      {
        path: 'settings/:id', 
        element: <Settings />,
      },
    ],
  },
  {
    path: '/dashboard/:id?',
    element: <StudentDashboard />,
  },
]);

function App() {
  return (
    <RouterProvider router={appRouter} />
  );
}

export default App;