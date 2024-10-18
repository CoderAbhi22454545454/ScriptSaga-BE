import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const AllStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await api.get('/user/students');
                setStudents(response.data.students);
            } catch (error) {
                console.error('Error fetching students:', error);
                toast.error('Failed to fetch students. Please try again.');
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter((student) => {
        const searchTermLower = searchQuery.toLowerCase();
        return (
            student.firstName.toLowerCase().includes(searchTermLower) ||
            student.lastName.toLowerCase().includes(searchTermLower) ||
            student.email.toLowerCase().includes(searchTermLower)
        );
    });

    const handleStudentClick = (studentId) => {
        navigate(`/admin/student/${studentId}`);
    };

    return (
        <Navbar>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">All Students</h1>
                <div className="mb-6">
                    <Input
                        type="search"
                        placeholder="Search for Student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Class</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow
                                        key={student._id}
                                        onClick={() => handleStudentClick(student._id)}
                                        className="cursor-pointer hover:bg-gray-100"
                                    >
                                        <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{student.classId ? student.classId.className : 'N/A'}</TableCell>
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

export default AllStudentsPage;