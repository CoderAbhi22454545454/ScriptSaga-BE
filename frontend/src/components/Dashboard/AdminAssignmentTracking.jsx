import React, { useState, useEffect } from 'react';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminAssignmentTracking = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assignment/all');
      
      if (response.data.success) {
        setAssignments(response.data.assignments);
      } else {
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/class/all');
      if (response.data.success) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const getAssignmentStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Past Due", color: "text-red-600" };
    if (diffDays <= 2) return { label: "Due Soon", color: "text-yellow-600" };
    return { label: "Upcoming", color: "text-green-600" };
  };

  const calculateSubmissionRate = (studentRepos) => {
    if (!studentRepos || studentRepos.length === 0) return 0;
    const submittedCount = studentRepos.filter(repo => repo.submitted).length;
    return (submittedCount / studentRepos.length) * 100;
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.classId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getAssignmentStatus(assignment.dueDate).label.toLowerCase();
    const matchesStatus = statusFilter === 'all' || status.includes(statusFilter.toLowerCase());
    
    const matchesClass = classFilter === 'all' || assignment.classId._id === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Assignment Tracking Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{assignments.length}</div>
              <div className="text-sm text-gray-500">Total Assignments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">
                {assignments.filter(a => new Date(a.dueDate) > new Date()).length}
              </div>
              <div className="text-sm text-gray-500">Active Assignments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">
                {Math.round(
                  assignments.reduce((acc, a) => acc + calculateSubmissionRate(a.studentRepos), 0) / 
                  (assignments.length || 1)
                )}%
              </div>
              <div className="text-sm text-gray-500">Avg. Submission Rate</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="due soon">Due Soon</SelectItem>
              <SelectItem value="past due">Past Due</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                const status = getAssignmentStatus(assignment.dueDate);
                const submissionRate = calculateSubmissionRate(assignment.studentRepos);
                
                return (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-gray-500">
                        by {assignment.teacherId.firstName} {assignment.teacherId.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.classId.name}</TableCell>
                    <TableCell>{new Date(assignment.dueDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{Math.round(submissionRate)}%</span>
                          <span>{assignment.studentRepos.filter(r => r.submitted).length}/{assignment.studentRepos.length}</span>
                        </div>
                        <Progress value={submissionRate} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/assignment/${assignment._id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminAssignmentTracking; 