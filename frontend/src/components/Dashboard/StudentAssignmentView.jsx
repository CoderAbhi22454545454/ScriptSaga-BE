import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, CheckCircle, Clock, AlertTriangle, ClipboardCopy } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

const StudentAssignmentView = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const studentData = useSelector((state) => state.student);
  const [solutionUrls, setSolutionUrls] = useState({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      console.log("Fetching assignments for student ID:", user._id);
      
      // First try to get assignments directly associated with the student
      const response = await api.get(`/assignment/student/${user._id}`);
      
      if (response.data.success && response.data.assignments?.length > 0) {
        console.log("Found assignments directly associated with student:", response.data.assignments);
        setAssignments(response.data.assignments);
        
        // Initialize solution URLs from existing submissions
        const initialSolutionUrls = {};
        response.data.assignments.forEach(assignment => {
          const studentRepo = assignment.studentRepos.find(
            repo => repo.studentId._id === user._id
          );
          if (studentRepo) {
            initialSolutionUrls[assignment._id] = studentRepo.repoUrl || '';
          }
        });
        setSolutionUrls(initialSolutionUrls);
      } else {
        console.log("No assignments found for student, checking class assignments");
        
        // If no assignments found, try to get assignments for the student's class
        if (studentData.student?.classId) {
          const classId = Array.isArray(studentData.student.classId) 
            ? studentData.student.classId[0]
            : studentData.student.classId;
            
          console.log("Fetching assignments for class:", classId);
          
          // Try to fetch assignments for the student's class
          const classResponse = await api.get(`/assignment/${classId}`);
          
          if (classResponse.data.success && classResponse.data.assignments) {
            console.log("Found class assignments:", classResponse.data.assignments);
            
            // Process assignments to add empty studentRepo entries if needed
            const processedAssignments = classResponse.data.assignments.map(assignment => {
              // Create a copy of the assignment to avoid mutating the original
              const assignmentCopy = {...assignment};
              
              // If student doesn't have a repo entry yet, add a placeholder
              const hasStudentRepo = assignmentCopy.studentRepos?.some(
                repo => repo.studentId._id === user._id
              );
              
              if (!hasStudentRepo) {
                if (!assignmentCopy.studentRepos) {
                  assignmentCopy.studentRepos = [];
                }
                
                assignmentCopy.studentRepos.push({
                  studentId: { 
                    _id: user._id,
                    firstName: studentData.student.firstName,
                    lastName: studentData.student.lastName
                  },
                  submitted: false
                });
              }
              
              return assignmentCopy;
            });
            
            console.log("Processed assignments with student repos:", processedAssignments);
            setAssignments(processedAssignments);
            
            // Initialize solution URLs for class assignments
            const initialSolutionUrls = {};
            processedAssignments.forEach(assignment => {
              const studentRepo = assignment.studentRepos.find(
                repo => repo.studentId._id === user._id
              );
              if (studentRepo) {
                initialSolutionUrls[assignment._id] = studentRepo.repoUrl || '';
              }
            });
            setSolutionUrls(initialSolutionUrls);
          } else {
            console.log("No class assignments found");
          }
        } else {
          console.log("Student has no class ID");
        }
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

  const handleUpdateSolutionUrl = (assignmentId, url) => {
    setSolutionUrls(prev => ({
      ...prev,
      [assignmentId]: url
    }));
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const solutionUrl = solutionUrls[assignmentId];
      
      // Validate URL
      if (!solutionUrl.match(/^https?:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_]+\/?$/)) {
        toast.error('Please enter a valid GitHub repository URL');
        return;
      }
      
      const response = await api.post('/assignment/submit', {
        assignmentId,
        studentId: user._id,
        solutionUrl
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((assignment) => {
              const studentRepo = assignment.studentRepos.find(
                repo => repo.studentId._id === user._id
              );
              
              const status = getAssignmentStatus(
                assignment.dueDate, 
                studentRepo?.submitted || false
              );

              return (
                <Card key={assignment._id} className="overflow-hidden">
                  <CardHeader className={`${status.color} border-b`}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium">{new Date(assignment.dueDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Points:</span>
                        <span className="font-medium">{assignment.points}</span>
                      </div>
                    </div>
                    
                    {/* Assignment Repository URL */}
                    <div className="mt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Repository:</h4>
                      <div className="flex items-center bg-gray-50 p-2 rounded-md border">
                        <input 
                          type="text" 
                          value={assignment.repoUrl || ""} 
                          readOnly 
                          className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            navigator.clipboard.writeText(assignment.repoUrl || "");
                            toast.success("Repository URL copied to clipboard");
                          }}
                          className="ml-2"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Your Solution Repository URL */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Solution Repository URL:</h4>
                      {studentRepo?.submitted ? (
                        <div className="flex items-center bg-green-50 p-2 rounded-md border border-green-200">
                          <input 
                            type="text" 
                            value={studentRepo.repoUrl || ""} 
                            readOnly 
                            className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(studentRepo.repoUrl || "");
                              toast.success("Your solution URL copied to clipboard");
                            }}
                            className="ml-2"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="https://github.com/yourusername/your-solution-repo"
                            value={solutionUrls[assignment._id] || ""}
                            onChange={(e) => handleUpdateSolutionUrl(assignment._id, e.target.value)}
                            className="w-full text-sm"
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitAssignment(assignment._id)}
                            className="bg-green-600 hover:bg-green-700 w-full"
                          >
                            Submit Solution & Mark as Complete
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {/* Assignment Repository Button */}
                      <Button variant="outline" className="flex items-center" asChild>
                        <a href={assignment.repoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Assignment Repository
                        </a>
                      </Button>
                      
                      {/* Solution Repository Button */}
                      {studentRepo?.submitted && studentRepo.repoUrl && (
                        <Button variant="outline" className="flex items-center" asChild>
                          <a href={studentRepo.repoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Your Solution
                          </a>
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