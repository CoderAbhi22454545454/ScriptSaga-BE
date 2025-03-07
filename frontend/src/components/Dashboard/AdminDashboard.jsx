import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import StudentProgressMetrics from './StudentProgressMetrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, BookOpen, School, BarChart, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';

const AdminDashboard = () => {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        activeStudents: 0
    });
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'admin') {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    // Fetch classes
                    const classesResponse = await api.get('/class/classes');
                    setClasses(classesResponse.data.classes);
                    
                    // Fetch student metrics for stats
                    const metricsResponse = await api.get('/user/student-metrics');
                    const metrics = metricsResponse.data.metrics;
                    
                    // Fetch teachers
                    const teachersResponse = await api.get('/user/teachers');
                    setTeachers(teachersResponse.data.teachers);
                    
                    setStats({
                        totalStudents: metrics.totalStudents || 0,
                        totalClasses: classesResponse.data.classes.length,
                        activeStudents: metrics.activeStudents || Math.min(
                            (metrics.githubActiveStudents + metrics.leetcodeActiveStudents), 
                            metrics.totalStudents
                        )
                    });
                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                    toast.error('Failed to fetch dashboard data. Please try again.');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [user]);

    const handleClassClick = (classId) => {
        navigate(`/admin/class/${classId}`);
    };

    const handleAddClass = () => {
        navigate('/admin/class-management');
    };

    const handleManageStudents = () => {
        navigate('/admin/student-management');
    };

    const handleManageTeachers = () => {
        navigate('/admin/teacher-management');
    };

    if (!user) {
        return (
            <div className='flex justify-center items-center h-screen'>
                <Loader2 className="mr-2 h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (loading) {
        return (
            <Navbar>
                <div className='flex justify-center items-center h-screen'>
                    <Loader2 className="mr-2 h-10 w-10 animate-spin" />
                </div>
            </Navbar>
        );
    }

    return (
        <Navbar>
            <div className="container mx-auto py-6 space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <div className="flex gap-2">
                        <Button onClick={handleManageStudents}>Manage Students</Button>
                        <Button onClick={handleManageTeachers}>Manage Teachers</Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <Users className="h-6 w-6 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <School className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Classes</p>
                                <h3 className="text-2xl font-bold">{stats.totalClasses}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-purple-100 p-3 rounded-full mr-4">
                                <BarChart className="h-6 w-6 text-purple-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active Students</p>
                                <h3 className="text-2xl font-bold">{stats.activeStudents}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Section */}
                <Card className="mb-8">
                    <CardHeader className="flex flex-row items-center justify-between bg-gray-50">
                        <div>
                            <CardTitle>Classes</CardTitle>
                            <CardDescription>Manage your classes and view student details</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddClass}>
                            Add Class
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.map((classItem) => (
                                <Card 
                                    key={classItem._id} 
                                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                                    onClick={() => handleClassClick(classItem._id)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col space-y-4">
                                            {/* Class Header with Badge */}
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-lg">{classItem.className}</h3>
                                                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                                    {classItem.yearOfStudy || classItem.className.split('-')[0]}
                                                </div>
                                            </div>
                                            
                                            {/* Class Details */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <span>{classItem.branch} - {classItem.division}</span>
                                            </div>
                                            
                                            {/* Student Count - No Progress Bar */}
                                            <div className="mt-2">
                                                <span className="text-sm flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    <span>{classItem.totalStudents || 0} students</span>
                                                </span>
                                            </div>
                                            
                                            {/* Action Hint */}
                                            <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Click to view class details
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Teachers Section */}
                <Card className="mb-8">
                    <CardHeader className="flex flex-row items-center justify-between bg-gray-50">
                        <div>
                            <CardTitle>Teachers</CardTitle>
                            <CardDescription>View and manage faculty members</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleManageTeachers} className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Teacher
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Classes</TableHead>
                                    <TableHead>GitHub Username</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.length > 0 ? (
                                    teachers.map((teacher) => (
                                        <TableRow key={teacher._id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/admin/teacher/${teacher._id}`)}>
                                            <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                                            <TableCell>{teacher.email}</TableCell>
                                            <TableCell>
                                                {teacher.classId && teacher.classId.length > 0 ? 
                                                    teacher.classId.map(cls => 
                                                        `${cls.yearOfStudy || cls.className?.split('-')[0] || ''}-${cls.branch || ''}-${cls.division || ''}`
                                                    ).join(', ') : 
                                                    <span className="text-gray-400">No classes assigned</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {teacher.githubUsername || <span className="text-gray-400">Not set</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                            No teachers found. Add teachers to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Student Progress Metrics */}
                <Card>
                    <CardHeader className="bg-gray-50">
                        <CardTitle>Student Progress Metrics</CardTitle>
                        <CardDescription>Track student performance across platforms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StudentProgressMetrics />
                    </CardContent>
                </Card>
            </div>
        </Navbar>
    );
};

export default AdminDashboard;
