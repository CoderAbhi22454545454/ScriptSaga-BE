import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '@/components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, BookOpen, Calendar, Bell } from 'lucide-react';

const TeacherDashboard = () => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    upcomingAssignments: 0,
    recentNotifications: []
  });
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  console.log('User from Redux:', user);

  useEffect(() => {
    console.log('Effect triggered, user._id:', user?._id);
    if (user?._id) {
      fetchAssignedClasses();
      fetchDashboardStats();
    }
  }, [user?._id]);

  const fetchDashboardStats = async () => {
    try {
      // Get assigned classes to calculate all stats
      const response = await api.get(`/class/teacher/${user._id}/classes`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch classes');
      }

      const classes = response.data.classes || [];
      
      // Calculate stats from classes data
      const totalStudents = classes.reduce((sum, cls) => {
        return sum + (cls.totalStudents || 0);
      }, 0);

      const totalAssignments = classes.reduce((sum, cls) => {
        return sum + (cls.totalAssignments || 0);
      }, 0);

      const activeAssignments = classes.reduce((sum, cls) => {
        return sum + (cls.activeAssignments || 0);
      }, 0);

      // Calculate average completion rate (if available)
      const totalCompletionRate = classes.reduce((sum, cls) => {
        return sum + (cls.completionRate || 0);
      }, 0);
      const averageCompletionRate = classes.length > 0 ? Math.round(totalCompletionRate / classes.length) : 0;

      setStats({
        totalStudents,
        totalAssignments,
        upcomingAssignments: activeAssignments, // Using activeAssignments as upcoming
        recentNotifications: [], // We'll handle notifications separately if needed
        averageCompletionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  const fetchAssignedClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/class/teacher/${user._id}/classes`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch classes');
      }
      
      setAssignedClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.message);
      toast.error('Failed to fetch assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/teacher/class/${classId}`);
  };

  if (!user) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <Navbar>
        <div className='flex justify-center items-center h-[calc(100vh-4rem)]'>
          <Loader2 className="mr-2 h-10 w-10 animate-spin" />
        </div>
      </Navbar>
    );
  }

  if (error) {
    return (
      <Navbar>
        <div className="container mx-auto p-6">
          <div className="text-red-500 text-center">
            Error: {error}
          </div>
        </div>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-600 mt-2">Here's an overview of your teaching dashboard</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50">
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <h3 className="text-2xl font-bold">{stats.totalAssignments}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Upcoming Due</p>
                <h3 className="text-2xl font-bold">{stats.upcomingAssignments}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50">
            <CardContent className="flex items-center p-6">
              <Bell className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Avg. Completion Rate</p>
                <h3 className="text-2xl font-bold">{stats.averageCompletionRate}%</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">My Classes</h2>
          {assignedClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedClasses.map((cls) => (
                <Card 
                  key={cls._id} 
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500"
                  onClick={() => handleClassClick(cls._id)}
                >
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {cls.yearOfStudy} - {cls.branch}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-gray-600">Division: {cls.division}</p>
                      <p className="text-gray-600">Total Students: {cls.totalStudents || 0}</p>
                      <div className="flex justify-between items-center mt-4 text-sm">
                        <span className="text-blue-600">Active Assignments: {cls.activeAssignments || 0}</span>
                        <span className="text-green-600">Completion Rate: {cls.completionRate || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50">
              <CardContent className="p-6 text-center text-gray-500">
                <p className="mb-2">No classes assigned yet.</p>
                <p className="text-sm">Contact the administrator to get your class assignments.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Notifications */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
          <Card>
            <CardContent className="p-6">
              {stats.recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentNotifications.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-500 mt-1" />
                      <div>
                        <p className="text-gray-800">{notification.message}</p>
                        <p className="text-sm text-gray-500">{notification.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No new notifications</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Navbar>
  );
};

export default TeacherDashboard; 