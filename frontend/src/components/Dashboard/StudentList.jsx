import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';


const StudentList = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

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
                setLoading(true);
                setError(null);
                
                // Fetch Class
                const classResponse = await api.get(`/class/${classId}`);
                console.log('Class Response:', classResponse.data);
                
                if (!classResponse.data.success) {
                    throw new Error(classResponse.data.message || 'Failed to fetch class data');
                }
                setClassData(classResponse.data.classRoom);

                // Fetch Students
                const studentsResponse = await api.get(`/class/classes/${classId}/students`);
                console.log('Students Response:', studentsResponse.data);
                
                if (!studentsResponse.data.success) {
                    throw new Error(studentsResponse.data.message || 'Failed to fetch students data');
                }
                
                if (!Array.isArray(studentsResponse.data.students)) {
                    throw new Error('Invalid students data received');
                }
                
                setStudents(studentsResponse.data.students);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message || 'An error occurred while fetching data');
                toast.error(error.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchStudents();
        }
    }, [classId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="mr-2 h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent>
                        <p className="text-center text-red-500 py-4">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleStudentClick = (studentId) => {
        navigate(`/admin/student/${studentId}`);
    };

    return (
        <Navbar> 
  <div className="">
          <h2 className="text-3xl font-bold mb-6">Students</h2>
      
          {classData ? (
            <Card className="mb-6 bg-gray-100">
              <CardHeader>
                <CardTitle className='font-medium'>Class Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row gap-20 text-start">
                  {/* <div>
                    <p className="font-semibold">Class Name:</p>
                    <p>{classData.className}</p>
                  </div> */}
                  <div>
                    <p className="font-medium text-sm text-gray-500 capitalize font-sans ">Year of Study:</p>
                    <p className='font-medium text-lg capitalize font-sans text-blue-700 '>{classData.yearOfStudy}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 capitalize font-sans ">Branch:</p>
                    <p className='font-medium text-lg capitalize font-sans text-blue-700 '>{classData.branch}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 capitalize font-sans ">Division:</p>
                    <p className='font-medium text-lg capitalize font-sans text-blue-700 '>{classData.division}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent>
                <p className="text-center">Loading class details...</p>
              </CardContent>
            </Card>
          )}
      
          <div className="mb-6 mt-5 ">
            <Input
              type="search"
              placeholder="Search for Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
      
          {filterStudent.length > 0 ? (
            <Card className='p-4'>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-100'>
                      <TableHead className='font-medium text-sm text-gray-500 capitalize font-sans '  >Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterStudent.map((student) => (
                      <TableRow
                        key={student._id}
                        onClick={() => handleStudentClick(student._id)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <p className="text-center py-4">No students found</p>
              </CardContent>
            </Card>
          )}
        </div>
        </Navbar>
      
    );
};

export default StudentList;
