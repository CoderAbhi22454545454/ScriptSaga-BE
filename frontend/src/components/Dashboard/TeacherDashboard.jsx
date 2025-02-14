import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const TeacherDashboard = () => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedClasses();
  }, [user._id]);

  const fetchAssignedClasses = async () => {
    try {
      const response = await api.get(`/class/teacher/${user._id}/classes`);
      setAssignedClasses(response.data.classes);
    } catch (error) {
      toast.error('Failed to fetch assigned classes');
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

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Classes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedClasses.map((cls) => (
            <Card 
              key={cls._id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleClassClick(cls._id)}
            >
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold">
                  {cls.yearOfStudy} - {cls.branch}
                </h2>
                <p className="text-gray-600">Division: {cls.division}</p>
                <p className="text-gray-600">Students: {cls.students.length}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Navbar>
  );
};

export default TeacherDashboard; 