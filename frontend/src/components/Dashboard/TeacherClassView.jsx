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
import { Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import AssignmentDialog from './AssignmentDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      const response = await api.get(`/assignments/${classId}`);
      setAssignments(response.data.assignments);
    } catch (error) {
      toast.error('Failed to fetch assignments');
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
      });
      
      if (response.data.success) {
        toast.success('Assignment created successfully');
        // Notify all students in the class
        await api.post(`/assignment/${response.data.assignment._id}/notify`);
        fetchAssignments();
        setIsAssignmentDialogOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment._id}>
                  <CardContent className="p-4">
                    <h3 className="text-xl font-semibold">{assignment.title}</h3>
                    <p className="text-gray-600 mt-2">{assignment.description}</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Points: {assignment.points}</p>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <a href={assignment.repoUrl} target="_blank" rel="noopener noreferrer">
                          View Repository
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <AssignmentDialog
          isOpen={isAssignmentDialogOpen}
          setIsOpen={setIsAssignmentDialogOpen}
          onSubmit={handleCreateAssignment}
        />
      </div>
    </Navbar>
  );
};

export default TeacherClassView;