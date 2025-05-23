import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import StudentProgressMetrics from './StudentProgressMetrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, BookOpen, School, BarChart, UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="flex flex-col flex-wrap sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome back, {user.firstName}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button onClick={handleManageStudents} className="w-full sm:w-auto">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Students
                        </Button>
                        <Button onClick={handleManageTeachers} className="w-full sm:w-auto">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Manage Teachers
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalStudents}</h3>
                                </div>
                                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Active Students</span>
                                    <span className="font-medium">{stats.activeStudents}</span>
                                </div>
                                <Progress 
                                    value={(stats.activeStudents / stats.totalStudents) * 100} 
                                    className="mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalClasses}</h3>
                                </div>
                                <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                                    <School className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Active Classes</span>
                                    <span className="font-medium">{stats.totalClasses}</span>
                                </div>
                                <Progress 
                                    value={100} 
                                    className="mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold mt-1">{stats.activeStudents}</h3>
                                </div>
                                <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                                    <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Engagement Rate</span>
                                    <span className="font-medium">
                                        {Math.round((stats.activeStudents / stats.totalStudents) * 100)}%
                                    </span>
                                </div>
                                <Progress 
                                    value={(stats.activeStudents / stats.totalStudents) * 100} 
                                    className="mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Section */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
                        <div>
                            <CardTitle className="text-xl">Classes</CardTitle>
                            <CardDescription>Manage your classes and view student details</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddClass} className="w-full sm:w-auto hover:bg-gray-100">
                            Add Class
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.map((classItem) => (
                                <Card 
                                    key={classItem._id} 
                                    className="group cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
                                    onClick={() => handleClassClick(classItem._id)}
                                >
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex flex-col space-y-3 sm:space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-base sm:text-lg group-hover:text-blue-600 transition-colors">
                                                    {classItem.className}
                                                </h3>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    {classItem.yearOfStudy || classItem.className.split('-')[0]}
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <School className="h-4 w-4 mr-2" />
                                                <span>{classItem.branch} - {classItem.division}</span>
                                            </div>
                                            
                                            <div className="mt-2">
                                                <span className="text-sm flex items-center text-muted-foreground">
                                                    <Users className="h-4 w-4 mr-2" />
                                                    <span>{classItem.totalStudents || 0} students</span>
                                                </span>
                                            </div>
                                            
                                            <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-muted-foreground flex items-center">
                                                <ChevronRight className="h-3.5 w-3.5 mr-1" />
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
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
                        <div>
                            <CardTitle className="text-lg sm:text-xl">Teachers</CardTitle>
                            <CardDescription className="text-sm sm:text-base">View and manage faculty members</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleManageTeachers} className="w-full sm:w-auto hover:bg-gray-100">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Teacher
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="min-w-[800px] sm:min-w-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-semibold text-sm sm:text-base">Name</TableHead>
                                            <TableHead className="font-semibold text-sm sm:text-base">Email</TableHead>
                                            <TableHead className="font-semibold text-sm sm:text-base">Classes</TableHead>
                                            <TableHead className="font-semibold text-sm sm:text-base">GitHub Username</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teachers.length > 0 ? (
                                            teachers.map((teacher) => (
                                                <TableRow key={teacher._id} className="hover:bg-gray-50 cursor-pointer">
                                                    <TableCell className="font-medium text-sm sm:text-base">
                                                        {teacher.firstName} {teacher.lastName}
                                                    </TableCell>
                                                    <TableCell className="text-sm sm:text-base">{teacher.email}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {teacher.classId && teacher.classId.length > 0 ? 
                                                                teacher.classId.map(cls => (
                                                                    <Badge 
                                                                        key={cls._id} 
                                                                        variant="outline" 
                                                                        className="bg-gray-50 text-xs sm:text-sm"
                                                                    >
                                                                        {`${cls.yearOfStudy || cls.className?.split('-')[0] || ''}-${cls.branch || ''}-${cls.division || ''}`}
                                                                    </Badge>
                                                                )) : 
                                                                <span className="text-muted-foreground text-sm">No classes assigned</span>
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm sm:text-base">
                                                        {teacher.githubUsername || 
                                                            <span className="text-muted-foreground">Not set</span>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                                                    No teachers found. Add teachers to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Student Progress Metrics */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="text-xl">Student Progress Metrics</CardTitle>
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
