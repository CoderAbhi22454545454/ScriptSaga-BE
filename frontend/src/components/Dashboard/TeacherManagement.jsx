import React, { useState, useEffect } from 'react';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/Navbar';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    classIds: [],
    githubUsername: "",
  });

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/teachers');
      setTeachers(response.data.teachers);
    } catch (error) {
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/class/classes');
      setClasses(response.data.classes);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await api.put(`/user/update-teacher/${editingId}`, formData);
        if (response.data.success) {
          toast.success("Teacher updated successfully");
          setIsEditing(false);
          setEditingId(null);
        }
      } else {
        const response = await api.post("/user/create-teacher", formData);
        if (response.data.success) {
          toast.success("Teacher created successfully");
        }
      }
      fetchTeachers();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        classIds: [],
        githubUsername: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (teacher) => {
    setIsEditing(true);
    setEditingId(teacher._id);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      classIds: teacher.classId.map(c => c._id),
      githubUsername: teacher.githubUsername || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/user/delete-teacher/${id}`);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to delete teacher");
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
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</CardTitle>
          </CardHeader>
          <CardContent>
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

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <Input
                  id="githubUsername"
                  placeholder="GitHub Username"
                  value={formData.githubUsername}
                  onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  required
                />
              </div>

             

              <div className="space-y-2">
                <Label htmlFor="classes">Classes</Label>
                <select
                  id="classes"
                  multiple
                  className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.classIds}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    classIds: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.yearOfStudy} - {cls.branch} - {cls.division}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit">{isEditing ? "Update" : "Add"} Teacher</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Teachers List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>GitHub Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher._id}>
                    <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      {teacher.classId.map(cls => 
                        `${cls.yearOfStudy}-${cls.branch}-${cls.division}`
                      ).join(', ')}
                    </TableCell>
                    <TableCell>{teacher.githubUsername}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => handleEdit(teacher)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleDelete(teacher._id)}
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
      </div>
    </Navbar>
  );
};

export default TeacherManagement;