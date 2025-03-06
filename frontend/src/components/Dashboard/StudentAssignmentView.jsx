import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const StudentAssignmentView = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignment/student/${user._id}`);
      
      if (response.data.success) {
        setAssignments(response.data.assignments);
      } else {
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatus = (dueDate, submitted) => {
    if (submitted) return { label: "Submitted", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> };
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Past Due", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> };
    if (diffDays <= 2) return { label: "Due Soon", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> };
    return { label: "Upcoming", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-4 w-4" /> };
  };

  const handleSubmitAssignment = async (assignmentId, repoUrl) => {
    try {
      const response = await api.post('/assignment/submit', {
        assignmentId,
        studentId: user._id
      });
      
      if (response.data.success) {
        toast.success('Assignment marked as submitted');
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">My Assignments</h1>
        
        {assignments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No assignments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => {
              const studentRepo = assignment.studentRepos.find(
                repo => repo.studentId._id === user._id
              );
              
              const status = getAssignmentStatus(
                assignment.dueDate, 
                studentRepo?.submitted || false
              );
              
              const dueDate = new Date(assignment.dueDate);
              const now = new Date();
              const totalTime = new Date(assignment.dueDate) - new Date(assignment.createdAt);
              const remainingTime = dueDate - now;
              const progressPercentage = Math.max(
                0, 
                Math.min(100, 100 - (remainingTime / totalTime) * 100)
              );

              return (
                <Card key={assignment._id} className="overflow-hidden">
                  <div className={`h-2 ${studentRepo?.submitted ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold">{assignment.title}</h3>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium">{dueDate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Points:</span>
                        <span className="font-medium">{assignment.points}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Class:</span>
                        <span className="font-medium">{assignment.classId.name}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" className="flex items-center" asChild>
                        <a href={studentRepo?.repoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Repository
                        </a>
                      </Button>
                      
                      {!studentRepo?.submitted && (
                        <Button 
                          onClick={() => handleSubmitAssignment(assignment._id, studentRepo?.repoUrl)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark as Submitted
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentView; 