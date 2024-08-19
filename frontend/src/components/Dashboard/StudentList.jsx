import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';


const StudentList = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null)
    const [searchQuery, setSearchQuery] = useState('');


    const filterStudent = students.filter((student) => {
        const searchTermLower = searchQuery.toLowerCase()

        return (
            student.firstName.toLowerCase().includes(searchTermLower) ||
            student.lastName.toLowerCase().includes(searchTermLower) ||
            student.rollNo.toLowerCase().includes(searchTermLower)
        )
    }).sort((a, b) => {
        const rollNoA = parseInt(a.rollNo, 10);
        const rollNoB = parseInt(b.rollNo, 10);

        if (isNaN(rollNoA) || isNaN(rollNoB)) {
            return a.rollNo.localeCompare(b.rollNo);
        }
        return rollNoA - rollNoB
    })


    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Fetch Class
                const classResponse = await api.get(`/class/${classId}`);
                if (classResponse.data.success) {
                    setClassData(classResponse.data.classRoom);
                } else {
                    throw new Error('Failed to fetch class data');
                }

                // Fetch Students
                const response = await api.get(`/class/classes/${classId}/students`);
                setStudents(response.data.students);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, [classId]);

    const handleStudentClick = (studentId) => {
        navigate(`/admin/student/${studentId}`);
    };

    return (
        <Navbar>
            <div>
                <h2>Students</h2>

                {classData ? (
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold">Class Details:</h3>
                        <p><strong>Class Name:</strong> {classData.className}</p>
                        <p><strong>Year of Study:</strong> {classData.yearOfStudy}</p>
                        <p><strong>Branch:</strong> {classData.branch}</p>
                        <p><strong>Division:</strong> {classData.division}</p>
                    </div>
                ) : (
                    <h3>Loading class details...</h3>
                )}

                <Input
                    type="search"
                    placeholder="Search for User..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-3 mb-3 bg-gray-100 "
                />

                {
                    filterStudent.length > 0 ?
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Student Name</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filterStudent.map((student) => (
                                    <TableRow key={student._id} onClick={() => handleStudentClick(student._id)} className="cursor-pointer">
                                        <TableCell>{student.rollNo}</TableCell>
                                        <TableCell>{student.firstName} {student.lastName} </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        :
                        <h3>
                            No student Found
                        </h3>
                }

            </div>
        </Navbar>
    );
};

export default StudentList;
