import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Trash2, UserPlus } from 'lucide-react';

const AllStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [classes, setClasses] = useState([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        rollNo: "",
        classId: "",
        githubID: "",
        leetCodeID: ""
    });
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/class/classes');
            setClasses(response.data.classes);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to fetch classes');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/user/all-students');
            setStudents(response.data.students);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to fetch students. Please try again.');
        }
    };

    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setFormData({
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            rollNo: student.rollNo,
            classId: student.classId?._id || "",
            githubID: student.githubID || "",
            leetCodeID: student.leetCodeID || ""
        });
        setIsEditDialogOpen(true);
    };

    const handleDeleteStudent = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await api.delete(`/user/delete-student/${studentId}`);
                toast.success('Student deleted successfully');
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
                toast.error('Failed to delete student');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedStudent) {
                await api.put(`/user/update-student/${selectedStudent._id}`, formData);
                toast.success('Student updated successfully');
            } else {
                await api.post('/user/create-student', formData);
                toast.success('Student created successfully');
            }
            setIsEditDialogOpen(false);
            fetchStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error('Failed to save student');
        }
    };

    const handleStudentClick = (studentId) => {
        const baseRoute = user.role === 'admin' ? '/admin' : '/teacher';
        navigate(`${baseRoute}/student/${studentId}`);
    };

    // Group students by class
    const groupedStudents = students.reduce((acc, student) => {
        const classId = student.classId?._id || 'unassigned';
        if (!acc[classId]) {
            acc[classId] = [];
        }
        acc[classId].push(student);
        return acc;
    }, {});

    // Filter and sort students within each class
    const filteredGroupedStudents = Object.entries(groupedStudents).reduce((acc, [classId, classStudents]) => {
        const filtered = classStudents.filter((student) => {
            const searchTermLower = searchQuery.toLowerCase();
            return (
                student.firstName.toLowerCase().includes(searchTermLower) ||
                student.lastName.toLowerCase().includes(searchTermLower) ||
                student.email.toLowerCase().includes(searchTermLower) ||
                (student.rollNo && student.rollNo.toLowerCase().includes(searchTermLower))
            );
        }).sort((a, b) => {
            const rollA = parseInt(a.rollNo) || 0;
            const rollB = parseInt(b.rollNo) || 0;
            return rollA - rollB;
        });
        
        if (filtered.length > 0) {
            acc[classId] = filtered;
        }
        return acc;
    }, {});

    return (
        <Navbar>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">All Students</h1>
                    <Button onClick={() => {
                        setSelectedStudent(null);
                        setFormData({
                            firstName: "",
                            lastName: "",
                            email: "",
                            rollNo: "",
                            classId: "",
                            githubID: "",
                            leetCodeID: ""
                        });
                        setIsEditDialogOpen(true);
                    }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Student
                    </Button>
                </div>
                <div className="mb-6">
                    <Input
                        type="search"
                        placeholder="Search for Student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                {Object.entries(filteredGroupedStudents).map(([classId, classStudents]) => {
                    const classInfo = classes.find(c => c._id === classId) || { yearOfStudy: 'Unassigned', branch: '', division: '' };
                    return (
                        <Card key={classId} className="mb-6">
                            <CardHeader>
                                <CardTitle>
                                    {classId === 'unassigned' 
                                        ? 'Unassigned Students' 
                                        : `${classInfo.yearOfStudy} - ${classInfo.branch} ${classInfo.division}`}
                                </CardTitle>
                            </CardHeader>
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
                                        {classStudents.map((student) => (
                                            <TableRow key={student._id}>
                                                <TableCell>{student.rollNo || 'N/A'}</TableCell>
                                                <TableCell 
                                                    className="cursor-pointer hover:text-blue-600"
                                                    onClick={() => handleStudentClick(student._id)}
                                                >
                                                    {`${student.firstName} ${student.lastName}`}
                                                </TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditStudent(student);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteStudent(student._id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                    </DialogHeader>
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
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            required
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.yearOfStudy} - {cls.branch} {cls.division}
                                </option>
                            ))}
                        </select>
                        <Input
                            placeholder="GitHub Username"
                            value={formData.githubID}
                            onChange={(e) => setFormData({ ...formData, githubID: e.target.value })}
                        />
                        <Input
                            placeholder="LeetCode Username"
                            value={formData.leetCodeID}
                            onChange={(e) => setFormData({ ...formData, leetCodeID: e.target.value })}
                        />
                        <DialogFooter>
                            <Button type="submit">
                                {selectedStudent ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Navbar>
    );
};

export default AllStudentsPage;