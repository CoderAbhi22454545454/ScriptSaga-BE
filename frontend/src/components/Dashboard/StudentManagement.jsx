import React, { useState, useEffect } from 'react';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/Navbar';

const StudentManagement = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    rollNo: "",
    classId: "",
    githubID: "",
    leetCodeID: ""
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/class/classes');
      setClasses(response.data.classes);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const response = await api.get(`/class/classes/${classId}/students`);
      setStudents(response.data.students);
      setSelectedClass(classes.find(c => c._id === classId));
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
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
      if (selectedClass) {
        fetchStudents(selectedClass._id);
      }
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        rollNo: "",
        classId: "",
        githubID: "",
        leetCodeID: ""
      });
    } catch (error) {
      // Show specific error message for roll number conflict
      if (error.response?.data?.message.includes('roll number')) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || (isEditing ? "Failed to update student" : "Failed to create student"));
      }
    }
  };

  const handleEdit = (student) => {
    setIsEditing(true);
    setEditingId(student._id);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      rollNo: student.rollNo,
      classId: student.classId._id,
      githubID: student.githubID || "",
      leetCodeID: student.leetCodeID || ""
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/user/delete-student/${id}`);
      toast.success("Student deleted successfully");
      if (selectedClass) {
        fetchStudents(selectedClass._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete student");
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchTermLower = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchTermLower) ||
      student.lastName.toLowerCase().includes(searchTermLower) ||
      student.rollNo.toLowerCase().includes(searchTermLower)
    );
  }).sort((a, b) => a.rollNo.localeCompare(b.rollNo));

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Student" : "Add New Student"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                placeholder="Roll Number"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.yearOfStudy} - {cls.branch} - {cls.division}
                  </option>
                ))}
              </select>
              <Input
                placeholder="GitHub Username"
                value={formData.githubID}
                onChange={(e) => setFormData({ ...formData, githubID: e.target.value })}
                required
              />
              <Input
                placeholder="LeetCode Username"
                value={formData.leetCodeID}
                onChange={(e) => setFormData({ ...formData, leetCodeID: e.target.value })}
                required
              />
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-3xl font-bold mb-6">Classes</h2>
        
        {!selectedClass ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <Card 
                key={cls._id} 
                className="cursor-pointer hover:bg-gray-50 rounded-lg border-b border-black bg-white"
                onClick={() => fetchStudents(cls._id)}
              >
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold">{cls.yearOfStudy}</h3>
                  <p className="text-gray-600">{cls.branch} - {cls.division}</p>
                  <p className="text-sm text-gray-500 mt-4">Total Students: {cls.totalStudents}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedClass.yearOfStudy} - {selectedClass.branch} - {selectedClass.division}
                </CardTitle>
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back to Classes
                </button>
              </div>
            </CardHeader>
            {students.length === 0 ? (
                <CardContent>
                    <p className='text-center text-red-500 py-4'>No students found</p>
                </CardContent>
            ) : (
            <CardContent>
              <Input
                type="search"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm mb-4"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>LeetCode</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.githubID || 'N/A'}</TableCell>
                      <TableCell>{student.leetCodeID || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button variant="outline" onClick={() => handleEdit(student)}>
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(student._id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            )}
          </Card>
        )}
      </div>
    </Navbar>
  );
};

export default StudentManagement;