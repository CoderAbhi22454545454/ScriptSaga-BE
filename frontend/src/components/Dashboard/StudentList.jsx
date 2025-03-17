import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Download, Search, Users, BookOpen, GraduationCap, RefreshCw, Github, Code, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const StudentList = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        withGithub: 0,
        withLeetcode: 0,
        withValidGithub: 0,
        withValidLeetcode: 0
    });
    const user = useSelector((state) => state.auth.user);

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
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch Class
            const classResponse = await api.get(`/class/${classId}`);
            
            if (!classResponse.data.success) {
                throw new Error(classResponse.data.message || 'Failed to fetch class data');
            }
            setClassData(classResponse.data.classRoom);
    
            // Fetch Students
            const studentsResponse = await api.get(`/class/classes/${classId}/students`);
            
            if (!studentsResponse.data.success) {
                throw new Error(studentsResponse.data.message || 'Failed to fetch students data');
            }
            
            if (!Array.isArray(studentsResponse.data.students)) {
                throw new Error('Invalid students data received');
            }
            
            const studentData = studentsResponse.data.students;
            
            // Check GitHub and LeetCode validity
            const studentsWithVerification = await Promise.all(
                studentData.map(async (student) => {
                    let githubValid = false;
                    let leetcodeValid = false;
                    
                    if (student.githubID) {
                        try {
                            // Check if GitHub data is cached
                            const githubCacheKey = `github_valid_${student._id}`;
                            const cachedGithubValid = getCachedData(githubCacheKey);
                            
                            if (cachedGithubValid !== null) {
                                githubValid = cachedGithubValid;
                            } else {
                                // Try to fetch GitHub summary to verify ID
                                const githubResponse = await api.get(`/github/${student._id}/summary`);
                                githubValid = githubResponse.data.success && 
                                             !githubResponse.data.message?.includes('not found');
                                
                                // Cache the result
                                setCachedData(githubCacheKey, githubValid);
                            }
                        } catch (error) {
                            githubValid = false;
                        }
                    }
                    
                    if (student.leetCodeID) {
                        try {
                            // Check if LeetCode data is cached
                            const leetcodeCacheKey = `leetcode_valid_${student._id}`;
                            const cachedLeetcodeValid = getCachedData(leetcodeCacheKey);
                            
                            if (cachedLeetcodeValid !== null) {
                                leetcodeValid = cachedLeetcodeValid;
                            } else {
                                // Try to fetch LeetCode profile to verify ID
                                const leetcodeResponse = await api.get(`/lcodeprofile/${student._id}`);
                                leetcodeValid = leetcodeResponse.data && 
                                               !leetcodeResponse.data.message?.includes('not found');
                                
                                // Cache the result
                                setCachedData(leetcodeCacheKey, leetcodeValid);
                            }
                        } catch (error) {
                            leetcodeValid = false;
                        }
                    }
                    
                    return {
                        ...student,
                        githubValid,
                        leetcodeValid
                    };
                })
            );
            
            setStudents(studentsWithVerification);
            
            // Calculate stats
            setStats({
                total: studentData.length,
                withGithub: studentData.filter(s => s.githubID).length,
                withLeetcode: studentData.filter(s => s.leetCodeID).length,
                withValidGithub: studentsWithVerification.filter(s => s.githubValid).length,
                withValidLeetcode: studentsWithVerification.filter(s => s.leetcodeValid).length
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while fetching data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (classId) {
            fetchData();
        }
    }, [classId]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDownload = async () => {
      try {
        // Show loading toast
        const loadingToast = toast.loading('Preparing Excel file with student progress data...');
        
        // First, gather all student progress data
        const progressPromises = students.map(async (student) => {
          try {
            // Check if student has GitHub ID
            if (!student.githubID) {
              return {
                studentId: student._id,
                hasGitHub: false,
                progressData: null,
                codingProgress: 'Not Available',
                careerSuggestion: 'Not Available'
              };
            }
            
            // Try to get cached data first
            const progressCacheKey = `progress_data_${student._id}`;
            let progressData = getCachedData(progressCacheKey);
            let githubData = null;
            let leetcodeData = null;
            
            // If no cached data, try to fetch from metrics API
            if (!progressData) {
              try {
                const progressResponse = await api.getStudentProgressReport(student._id);
                progressData = progressResponse.data;
                
                // Cache the result if valid
                if (progressData && progressData.codingActivity) {
                  setCachedData(progressCacheKey, progressData);
                }
              } catch (error) {
                console.log(`Metrics API failed for student ${student._id}:`, error.response?.data?.message || error.message);
                
                // If metrics API fails, fetch GitHub and LeetCode data directly
                try {
                  // Fetch GitHub data
                  const githubResponse = await api.get(`/github/${student._id}/summary`);
                  if (githubResponse.data.success) {
                    githubData = githubResponse.data.summary;
                  }
                } catch (githubError) {
                  console.log(`GitHub API failed for student ${student._id}:`, githubError.message);
                }
                
                try {
                  // Fetch LeetCode data
                  if (student.leetCodeID) {
                    const leetcodeResponse = await api.get(`/lcodeprofile/${student._id}`);
                    leetcodeData = leetcodeResponse.data;
                  }
                } catch (leetcodeError) {
                  console.log(`LeetCode API failed for student ${student._id}:`, leetcodeError.message);
                }
                
                // Create fallback progress data from GitHub and LeetCode data
                if (githubData) {
                  progressData = createFallbackProgressData(githubData, leetcodeData);
                }
              }
            }
            
            // Determine coding progress rating
            let codingProgress = 'Not Available';
            let careerSuggestion = 'Not Available';
            
            if (progressData && progressData.codingActivity) {
              const { totalCommits, activeDaysLast30, weeklyAverage } = progressData.codingActivity;
              
              // Simple algorithm to determine coding progress
              if (totalCommits > 100 && activeDaysLast30 > 20 && weeklyAverage > 4) {
                codingProgress = 'Very Good';
                careerSuggestion = 'Software Engineer, Full-stack Developer';
              } else if (totalCommits > 50 && activeDaysLast30 > 15 && weeklyAverage > 3) {
                codingProgress = 'Good';
                careerSuggestion = 'Web Developer, Backend Developer';
              } else if (totalCommits > 20 && activeDaysLast30 > 10 && weeklyAverage > 2) {
                codingProgress = 'Average';
                careerSuggestion = 'Junior Developer, QA Engineer';
              } else if (totalCommits > 0) {
                codingProgress = 'Needs Improvement';
                careerSuggestion = 'IT Support, Technical Writer';
              } else {
                codingProgress = 'Not Started';
                careerSuggestion = 'Explore Coding Fundamentals';
              }
            } else if (githubData) {
              // Fallback to using just GitHub data for evaluation
              const totalCommits = githubData.totalCommits || 0;
              
              if (totalCommits > 100) {
                codingProgress = 'Very Good';
                careerSuggestion = 'Software Engineer, Full-stack Developer';
              } else if (totalCommits > 50) {
                codingProgress = 'Good';
                careerSuggestion = 'Web Developer, Backend Developer';
              } else if (totalCommits > 20) {
                codingProgress = 'Average';
                careerSuggestion = 'Junior Developer, QA Engineer';
              } else if (totalCommits > 0) {
                codingProgress = 'Needs Improvement';
                careerSuggestion = 'IT Support, Technical Writer';
              } else {
                codingProgress = 'Not Started';
                careerSuggestion = 'Explore Coding Fundamentals';
              }
            }
            
            return {
              studentId: student._id,
              hasGitHub: true,
              progressData,
              githubData,
              leetcodeData,
              codingProgress,
              careerSuggestion
            };
          } catch (error) {
            console.error(`Error processing student ${student._id}:`, error);
            return {
              studentId: student._id,
              hasGitHub: false,
              progressData: null,
              codingProgress: 'Error',
              careerSuggestion: 'Not Available'
            };
          }
        });
        
        // Wait for all progress data to be gathered
        const progressResults = await Promise.all(progressPromises);
        
        // Create a map for quick lookup
        const progressMap = progressResults.reduce((map, result) => {
          map[result.studentId] = result;
          return map;
        }, {});
        
        // Now make the API call with the enhanced data
        const response = await api.post(`/class/${classId}/excel-with-progress`, {
          students: students.map(student => ({
            ...student,
            progress: progressMap[student._id] || {
              hasGitHub: false,
              codingProgress: 'Not Available',
              careerSuggestion: 'Not Available'
            }
          }))
        }, {
          responseType: 'blob'
        });
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        const fileName = `Class_${classData.yearOfStudy}_${classData.division}_with_progress`;
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Excel file with progress data downloaded successfully');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download excel file with progress data');
        
        // Fallback to regular excel download if progress data fails
        try {
          const response = await api.get(`/class/${classId}/excel`, {
            responseType: 'blob'
          });
          
          const fileName = `Class_${classData.yearOfStudy}_${classData.division}`;
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${fileName}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          toast.success('Basic Excel file downloaded successfully (without progress data)');
        } catch (fallbackError) {
          console.error('Fallback download error:', fallbackError);
          toast.error('Failed to download excel file');
        }
      }
    };

    // Add this helper function to create fallback progress data
    const createFallbackProgressData = (githubData, leetcodeData) => {
      // Estimate active days and weekly average based on total commits
      const totalCommits = githubData.totalCommits || 0;
      const activeRepos = githubData.activeRepos || 0;
      
      // Estimate active days in last 30 days (roughly 1/3 of total commits, capped at 30)
      const estimatedActiveDays = Math.min(30, Math.round(totalCommits / 3));
      
      // Estimate weekly average (roughly active days / 4 weeks, capped at 7)
      const estimatedWeeklyAverage = Math.min(7, Math.round(estimatedActiveDays / 4));
      
      // Estimate current streak (roughly 1/10 of total commits, capped at 14)
      const estimatedCurrentStreak = Math.min(14, Math.round(totalCommits / 10));
      
      // Estimate longest streak (roughly 1/5 of total commits, capped at 30)
      const estimatedLongestStreak = Math.min(30, Math.round(totalCommits / 5));
      
      return {
        codingActivity: {
          totalCommits: totalCommits,
          recentCommits: Math.round(totalCommits * 0.6), // Assume 60% of commits are recent
          currentStreak: estimatedCurrentStreak,
          longestStreak: estimatedLongestStreak,
          activeDaysLast30: estimatedActiveDays,
          weeklyAverage: estimatedWeeklyAverage
        },
        repositories: {
          total: githubData.totalRepos || 0,
          active: activeRepos,
          stars: githubData.totalStars || 0,
          forks: githubData.totalForks || 0
        },
        leetcode: leetcodeData?.completeProfile ? {
          totalSolved: leetcodeData.completeProfile.solvedProblem || 0,
          easySolved: leetcodeData.completeProfile.easySolved || 0,
          mediumSolved: leetcodeData.completeProfile.mediumSolved || 0,
          hardSolved: leetcodeData.completeProfile.hardSolved || 0,
          weeklyAverage: Math.round(leetcodeData.completeProfile.solvedProblem / 10) || 0
        } : null,
        improvement: {
          lastMonth: {
            commitIncrease: Math.round(totalCommits * 0.1), // Assume 10% growth
            activeDaysIncrease: Math.round(estimatedActiveDays * 0.1),
            newRepos: Math.round(activeRepos * 0.1),
            leetcodeIncrease: leetcodeData?.completeProfile ? 
              Math.round(leetcodeData.completeProfile.solvedProblem * 0.1) : 0
          }
        },
        trends: {
          commitTrend: totalCommits > 50 ? "slight increase" : "stable",
          activeDaysTrend: estimatedActiveDays > 15 ? "slight increase" : "stable",
          overallTrend: totalCommits > 100 ? "increase" : "stable"
        }
      };
    };

    // Add the cache utility functions at the top of the file, after the imports
    // Cache utility functions
    const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

    const getCachedData = (key) => {
      try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;
        
        const { data, timestamp } = JSON.parse(cachedItem);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        
        return isExpired ? null : data;
      } catch (error) {
        console.error('Error retrieving cached data:', error);
        return null;
      }
    };

    const setCachedData = (key, data) => {
      try {
        const cacheItem = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.error('Error caching data:', error);
      }
    };

    if (loading && !refreshing) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg text-gray-600">Loading student data...</p>
            </div>
        );
    }

    if (error && !refreshing) {
        return (
            <div className="container mx-auto p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-red-500 py-4">{error}</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button onClick={handleRefresh} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const handleStudentClick = (studentId) => {
        const baseRoute = user.role === 'admin' ? '/admin' : '/teacher';
        navigate(`${baseRoute}/student/${studentId}`);
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getPlatformStatusColor = (isConnected, isValid) => {
        if (!isConnected) return "bg-gray-200 text-gray-500";
        if (isValid) return "bg-green-100 text-green-700";
        return "bg-red-100 text-red-700";
    };

    const getPlatformStatusIcon = (isConnected, isValid) => {
        if (!isConnected) return null;
        if (isValid) return <CheckCircle className="h-3 w-3 text-green-600" />;
        return <XCircle className="h-3 w-3 text-red-600" />;
    };

    return (
        <Navbar> 
            <div className="container mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Student List</h1>
                        {classData && (
                            <p className="text-gray-500 mt-1">
                                {classData.className} - {classData.branch} ({classData.yearOfStudy})
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <Button 
                            onClick={handleRefresh} 
                            variant="outline" 
                            size="sm"
                            disabled={refreshing}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        
                        <Button
                            onClick={handleDownload}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</h3>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">GitHub Connected</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.withGithub}</h3>
                                    <div className="flex items-center mt-1">
                                        <p className="text-xs text-gray-500">
                                            {Math.round((stats.withGithub / stats.total) * 100) || 0}% of students
                                        </p>
                                        {stats.withGithub > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="ml-2 flex items-center">
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                                                {stats.withValidGithub} valid
                                                            </Badge>
                                                            {stats.withGithub - stats.withValidGithub > 0 && (
                                                                <Badge variant="outline" className="bg-red-100 text-red-700 text-xs ml-1">
                                                                    {stats.withGithub - stats.withValidGithub} invalid
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Valid: GitHub accounts that exist and are accessible</p>
                                                        <p>Invalid: GitHub accounts that don't exist or can't be accessed</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-100 p-3 rounded-full">
                                    <Github className="h-6 w-6 text-gray-800" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">LeetCode Connected</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.withLeetcode}</h3>
                                    <div className="flex items-center mt-1">
                                        <p className="text-xs text-gray-500">
                                            {Math.round((stats.withLeetcode / stats.total) * 100) || 0}% of students
                                        </p>
                                        {stats.withLeetcode > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="ml-2 flex items-center">
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                                                {stats.withValidLeetcode} valid
                                                            </Badge>
                                                            {stats.withLeetcode - stats.withValidLeetcode > 0 && (
                                                                <Badge variant="outline" className="bg-red-100 text-red-700 text-xs ml-1">
                                                                    {stats.withLeetcode - stats.withValidLeetcode} invalid
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Valid: LeetCode accounts that exist and are accessible</p>
                                                        <p>Invalid: LeetCode accounts that don't exist or can't be accessed</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <Code className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Search and Table */}
                <Card className="bg-white shadow-sm mb-6">
                    <CardHeader className="pb-0">
                        <div className="flex flex-col md:flex-row justify-between md:items-center">
                            <CardTitle>Students</CardTitle>
                            <div className="relative mt-4 md:mt-0 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder="Search by name or roll number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {filterStudent.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead className="w-20 font-medium">Roll No</TableHead>
                                            <TableHead className="font-medium">Student Name</TableHead>
                                            <TableHead className="font-medium hidden md:table-cell">Email</TableHead>
                                            <TableHead className="font-medium hidden md:table-cell">Platforms</TableHead>
                                            <TableHead className="font-medium hidden md:table-cell w-24 text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filterStudent.map((student) => (
                                            <TableRow
                                                key={student._id}
                                                className="cursor-pointer hover:bg-blue-50"
                                                onClick={() => handleStudentClick(student._id)}
                                            >
                                                <TableCell>
                                                    <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                                                        <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">{student.rollNo}</TableCell>
                                                <TableCell>{student.firstName} {student.lastName}</TableCell>
                                                <TableCell className="hidden md:table-cell text-gray-500 text-sm">
                                                    {student.email}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex space-x-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={`flex items-center ${getPlatformStatusColor(!!student.githubID, student.githubValid)}`}
                                                                    >
                                                                        <Github className="h-3 w-3 mr-1" />
                                                                        GitHub
                                                                        {getPlatformStatusIcon(!!student.githubID, student.githubValid) && (
                                                                            <span className="ml-1">
                                                                                {getPlatformStatusIcon(!!student.githubID, student.githubValid)}
                                                                            </span>
                                                                        )}
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {!student.githubID ? (
                                                                        "GitHub ID not set"
                                                                    ) : student.githubValid ? (
                                                                        `Valid GitHub ID: ${student.githubID}`
                                                                    ) : (
                                                                        `Invalid GitHub ID: ${student.githubID}`
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={`flex items-center ${getPlatformStatusColor(!!student.leetCodeID, student.leetcodeValid)}`}
                                                                    >
                                                                        <Code className="h-3 w-3 mr-1" />
                                                                        LeetCode
                                                                        {getPlatformStatusIcon(!!student.leetCodeID, student.leetcodeValid) && (
                                                                            <span className="ml-1">
                                                                                {getPlatformStatusIcon(!!student.leetCodeID, student.leetcodeValid)}
                                                                            </span>
                                                                        )}
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {!student.leetCodeID ? (
                                                                        "LeetCode ID not set"
                                                                    ) : student.leetcodeValid ? (
                                                                        `Valid LeetCode ID: ${student.leetCodeID}`
                                                                    ) : (
                                                                        `Invalid LeetCode ID: ${student.leetCodeID}`
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-center">
                                                    {(!student.githubID && !student.leetCodeID) ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                                                        Not Connected
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Student has not connected any coding platforms
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (student.githubValid || student.leetcodeValid) ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline" className="bg-green-100 text-green-700">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Valid
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    At least one platform is correctly connected
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline" className="bg-red-100 text-red-700">
                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                        Invalid
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    All connected platforms have invalid IDs
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No students found</h3>
                                <p className="text-gray-500 mt-1">
                                    {searchQuery ? 'Try a different search term' : 'No students in this class yet'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 px-6 py-3">
                        <p className="text-xs text-gray-500">
                            Showing {filterStudent.length} of {students.length} students
                        </p>
                    </CardFooter>
                </Card>
                
                {/* Legend */}
                <Card className="bg-white shadow-sm mb-6">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">Platform Status Legend</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <Badge variant="outline" className="bg-gray-200 text-gray-500 mr-2">
                                    <Github className="h-3 w-3 mr-1" />
                                    GitHub
                                </Badge>
                                <span className="text-xs text-gray-600">Not connected</span>
                            </div>
                            <div className="flex items-center">
                                <Badge variant="outline" className="bg-green-100 text-green-700 mr-2">
                                    <Github className="h-3 w-3 mr-1" />
                                    GitHub
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                </Badge>
                                <span className="text-xs text-gray-600">Valid GitHub ID</span>
                            </div>
                            <div className="flex items-center">
                                <Badge variant="outline" className="bg-red-100 text-red-700 mr-2">
                                    <Github className="h-3 w-3 mr-1" />
                                    GitHub
                                    <XCircle className="h-3 w-3 ml-1" />
                                </Badge>
                                <span className="text-xs text-gray-600">Invalid GitHub ID</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Navbar>
    );
};

export default StudentList;
