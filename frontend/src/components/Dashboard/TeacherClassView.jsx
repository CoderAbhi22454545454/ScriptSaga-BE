import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/Navbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { Label } from "@/components/ui/label";
import AssignmentDialog from './AssignmentDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelector } from 'react-redux';
import { Badge } from '@/components/ui/badge';

const TeacherClassView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    rollNo: "",
    classId: classId,
    githubID: "",
    leetCodeID: "",
    password: ""
  });
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submissionStats, setSubmissionStats] = useState({
    total: 0,
    submitted: 0,
    rate: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchAssignments();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/class/classes/${classId}/students`);
      setStudents(response.data.students);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const response = await api.get(`/assignment/${classId}`);
      
      if (response.data.success) {
        console.log('Fetched assignments:', response.data.assignments);
        setAssignments(response.data.assignments);
      } else {
        console.error('Failed to fetch assignments:', response.data);
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await api.put(`/user/update-student/${editingId}`, formData);
        if (response.data.success) {
          toast.success("Student updated successfully");
          setIsEditing(false);
          setEditingId(null);
        }
      } else {
        const response = await api.post("/user/create-student", formData);
        if (response.data.success) {
          toast.success("Student created successfully");
        }
      }
      fetchStudents();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        rollNo: "",
        classId: classId,
        githubID: "",
        leetCodeID: "",
        password: ""
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleStudentClick = (studentId) => {
    navigate(`/teacher/student/${studentId}`);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      rollNo: "",
      classId: classId,
      githubID: "",
      leetCodeID: "",
      password: ""
    });
  };

  const handleCreateAssignment = async (assignmentData) => {
    try {
      const response = await api.post('/assignment/create', {
        ...assignmentData,
        classId,
        teacherId: user._id
      });
      
      if (response.data.success) {
        toast.success('Assignment created successfully');
        fetchAssignments();
        setIsAssignmentDialogOpen(false);
      }
    } catch (error) {
      console.error('Assignment creation error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const getAssignmentStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Past Due", color: "bg-red-100 text-red-800" };
    if (diffDays <= 2) return { label: "Due Soon", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Upcoming", color: "bg-green-100 text-green-800" };
  };

  const handleViewSubmissions = async (assignmentId) => {
    try {
      setSubmissionsLoading(true);
      setIsSubmissionsDialogOpen(true);
      
      const response = await api.get(`/assignment/assignment/${assignmentId}`);
      if (response.data.success) {
        setSelectedAssignment(response.data.assignment);
        
        // Get the student repos with additional status information
        const studentRepos = response.data.assignment.studentRepos || [];
        
        // Calculate submission statistics
        const totalStudents = studentRepos.length;
        const submittedCount = studentRepos.filter(repo => repo.submitted).length;
        const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
        
        setSubmissionStats({
          total: totalStudents,
          submitted: submittedCount,
          rate: submissionRate
        });
        
        setSubmissions(studentRepos);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setIsAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/assignment/${assignmentId}`);
        if (response.data.success) {
          toast.success('Assignment deleted successfully');
          fetchAssignments();
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment');
      }
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = getAssignmentStatus(assignment.dueDate).label.toLowerCase();
    return matchesSearch && status.includes(statusFilter.toLowerCase());
  });

  const handleMarkAsSubmitted = async (assignmentId, studentId) => {
    try {
      const response = await api.post('/assignment/submit', {
        assignmentId,
        studentId
      });
      
      if (response.data.success) {
        toast.success('Assignment marked as submitted');
        // Refresh the submissions
        handleViewSubmissions(assignmentId);
      }
    } catch (error) {
      console.error('Error marking assignment as submitted:', error);
      toast.error('Failed to mark assignment as submitted');
    }
  };

  console.log(user);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Class Students</h1>
              <Dialog 
                open={isDialogOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    resetForm();
                  }
                  setIsDialogOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}>
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number</Label>
                      <Input
                        id="rollNo"
                        placeholder="Roll Number"
                        value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                        required
                      />
                    </div>

                    {!isEditing && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={formData.password || ""}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!isEditing}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="githubID">GitHub Username</Label>
                      <Input
                        id="githubID"
                        placeholder="GitHub Username"
                        value={formData.githubID}
                        onChange={(e) => setFormData({ ...formData, githubID: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leetCodeID">LeetCode Username</Label>
                      <Input
                        id="leetCodeID"
                        placeholder="LeetCode Username"
                        value={formData.leetCodeID}
                        onChange={(e) => setFormData({ ...formData, leetCodeID: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit">{isEditing ? "Update" : "Add"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell 
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => handleStudentClick(student._id)}
                        >
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            className="mr-2"
                            onClick={() => {
                              setIsEditing(true);
                              setEditingId(student._id);
                              setFormData({
                                firstName: student.firstName,
                                lastName: student.lastName,
                                email: student.email,
                                rollNo: student.rollNo,
                                classId: classId,
                                githubID: student.githubID || "",
                                leetCodeID: student.leetCodeID || "",
                                password: ""
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={async () => {
                              try {
                                await api.delete(`/user/delete-student/${student._id}`);
                                toast.success("Student deleted successfully");
                                fetchStudents();
                              } catch (error) {
                                toast.error("Failed to delete student");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Assignments</h2>
              <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                Create Assignment
              </Button>
            </div>

            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="border rounded p-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="due soon">Due Soon</option>
                <option value="past due">Past Due</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment.dueDate);
                  return (
                    <Card key={assignment._id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-semibold">{assignment.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">{assignment.description}</p>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">
                            Due: {new Date(assignment.dueDate).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">Points: {assignment.points}</p>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button variant="outline" asChild>
                            <a href={assignment.templateRepo} target="_blank" rel="noopener noreferrer">
                              Template Repo
                            </a>
                          </Button>
                          <Button variant="outline" onClick={() => handleViewSubmissions(assignment._id)}>
                            View Submissions
                          </Button>
                          <Button variant="outline" onClick={() => handleEditAssignment(assignment)}>
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => handleDeleteAssignment(assignment._id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="col-span-3 text-center text-gray-500">No assignments found matching your criteria.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <AssignmentDialog
          isOpen={isAssignmentDialogOpen}
          setIsOpen={setIsAssignmentDialogOpen}
          onSubmit={handleCreateAssignment}
        />

        <Dialog open={isSubmissionsDialogOpen} onOpenChange={setIsSubmissionsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAssignment?.title} - Student Submissions
              </DialogTitle>
              <div className="text-sm text-gray-500">
                Due: {selectedAssignment?.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : ''}
              </div>
            </DialogHeader>
            
            {submissionsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold">{submissionStats.total}</div>
                      <div className="text-sm text-gray-500">Total Students</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold">{submissionStats.submitted}</div>
                      <div className="text-sm text-gray-500">Submitted</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold">{Math.round(submissionStats.rate)}%</div>
                      <div className="text-sm text-gray-500">Submission Rate</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.studentId._id}>
                          <TableCell>{submission.studentId.firstName} {submission.studentId.lastName}</TableCell>
                          <TableCell>{submission.studentId.rollNo}</TableCell>
                          <TableCell>
                            {submission.submitted ? (
                              <Badge variant="success" className="bg-green-100 text-green-800">
                                Submitted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                Not Submitted
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {submission.submissionDate 
                              ? new Date(submission.submissionDate).toLocaleString() 
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(submission.repoUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Repo
                              </Button>
                              {!submission.submitted && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMarkAsSubmitted(selectedAssignment._id, submission.studentId._id)}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Submitted
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Navbar>
  );
};

export default TeacherClassView;