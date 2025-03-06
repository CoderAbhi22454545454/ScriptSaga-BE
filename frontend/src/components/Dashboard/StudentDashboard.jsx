import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/Navbar";
import { useSelector } from "react-redux";
import api from "@/constants/constant";
import { toast } from "sonner";
import CalHeatMap from "cal-heatmap";
import "cal-heatmap/cal-heatmap.css";
import { Loader2 } from "lucide-react";
import StudentSuggestions from "./Github/StudentSuggestions";
import DetailedStudentProgress from "./Github/studentMetrics/DetailedStudent";
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ExternalLink, CheckCircle, Clock, AlertTriangle, ClipboardCopy } from 'lucide-react';
import StudentNotifications from "./StudentNotifications";
import {
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Cell,
} from "recharts";
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GitHubMetrics = ({ repos }) => {
  // Calculate metrics
  const totalRepos = repos.length;
  const totalCommits = repos.reduce(
    (sum, repo) => sum + repo.commits.length,
    0
  );
  const activeRepos = repos.filter((repo) => repo.commits.length > 0).length;
  const recentActivity = repos.filter((repo) => {
    const lastPush = new Date(repo.pushed_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return lastPush > oneMonthAgo;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard title="Total Repositories" value={totalRepos} />
      <StatCard title="Active Repositories" value={activeRepos} />
      <StatCard title="Total Commits" value={totalCommits} />
      <StatCard title="Recent Activity" value={`${recentActivity} repos`} />
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-lg p-4 shadow">
    <h3 className="text-sm text-gray-500">{title}</h3>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const ProgressMetric = ({ label, value, total }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span>{label}</span>
      <span>{Math.round((value / total) * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${(value / total) * 100}%` }}
      />
    </div>
  </div>
);

const calculateActivityScore = (metrics) => {
  return Math.min(
    ((metrics.recentActivity.commits / 90) * 40 +
    (metrics.recentActivity.activeDays.size / 90) * 30 +
    (metrics.recentActivity.repositories.size / 5) * 30),
    100
  );
};

const calculateCodeQualityScore = (metrics) => {
  const commitFrequencyScore = Math.min((metrics.recentActivity.commits / 150) * 40, 40);
  const activeDaysScore = (metrics.recentActivity.activeDays.size / 90) * 30;
  const reposDiversityScore = (metrics.recentActivity.repositories.size / 5) * 30;

  return Math.min(
    Math.round(commitFrequencyScore + activeDaysScore + reposDiversityScore),
    100
  );
};

const calculateImpactScore = (metrics) => {
  const starsScore = Math.min((metrics.impact.totalStars * 2), 50);
  const forksScore = Math.min((metrics.impact.totalForks * 5), 50);
  return Math.min(starsScore + forksScore, 100);
};

const calculateGitHubMetrics = (repos) => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
  
  const metrics = {
    recentActivity: {
      commits: 0,
      activeDays: new Set(),
      repositories: new Set(),
    },
    impact: {
      totalStars: 0,
      totalForks: 0,
      contributionStreak: 0,
    }
  };

  if (!repos || repos.length === 0) {
    return {
      raw: metrics,
      scores: {
        activity: 0,
        quality: 0,
        impact: 0
      }
    };
  }

  // Process each repository
  repos.forEach(repo => {
    if (!repo.commits) return;

    // Recent Activity
    repo.commits.forEach(commit => {
      const commitDate = new Date(commit.date);
      if (commitDate >= ninetyDaysAgo) {
        metrics.recentActivity.commits++;
        metrics.recentActivity.activeDays.add(commit.date.split('T')[0]);
        metrics.recentActivity.repositories.add(repo.name);
      }
    });

    // Impact Metrics
    metrics.impact.totalStars += repo.stargazers_count || 0;
    metrics.impact.totalForks += repo.forks_count || 0;
  });

  return {
    raw: metrics,
    scores: {
      activity: calculateActivityScore(metrics),
      quality: calculateCodeQualityScore(metrics),
      impact: calculateImpactScore(metrics)
    }
  };
};

const processCommitFrequency = (repos, start, end) => {
  const commitCounts = {};
  repos.forEach((repo) => {
    repo.commits?.forEach((commit) => {
      const date = new Date(commit.date.split("T")[0]);
      if ((!start || date >= start) && (!end || date <= end)) {
        const dateString = date.toISOString().split("T")[0];
        commitCounts[dateString] = (commitCounts[dateString] || 0) + 1;
      }
    });
  });
  return Object.entries(commitCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const processLanguageUsage = (repos) => {
  const languageCounts = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });
  return languageCounts;
};

const getMostActiveRepos = (repos) => {
  return repos
    .sort((a, b) => (b.commits?.length || 0) - (a.commits?.length || 0))
    .slice(0, 5)
    .map((repo) => ({ name: repo.name, commitCount: repo.commits?.length || 0 }));
};

const getAssignmentStatus = (dueDate, submitted) => {
  if (submitted) return { 
    label: "Submitted", 
    color: "bg-green-100 text-green-800", 
    icon: <CheckCircle className="h-4 w-4" /> 
  };
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { 
    label: "Past Due", 
    color: "bg-red-100 text-red-800", 
    icon: <AlertTriangle className="h-4 w-4" /> 
  };
  if (diffDays <= 2) return { 
    label: "Due Soon", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: <Clock className="h-4 w-4" /> 
  };
  return { 
    label: "Upcoming", 
    color: "bg-blue-100 text-blue-800", 
    icon: <Clock className="h-4 w-4" /> 
  };
};

const StudentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [student, setStudent] = useState();
  const [classData, setClassData] = useState();
  const [studentRepos, setStudentRepos] = useState([]);
  const [studentLeetCode, setStudentLeetCode] = useState({});
  const [repoPage, setRepoPage] = useState(1);
  const [commitPage, setCommitPage] = useState(1);
  const [hasMoreRepos, setHasMoreRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [commitFrequency, setCommitFrequency] = useState([]);
  const [languageUsage, setLanguageUsage] = useState({});
  const [mostActiveRepos, setMostActiveRepos] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)), // Last 90 days
    endDate: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState({
    student: null,
    classData: null,
    repos: [],
    leetCode: null
  });
  const [githubStats, setGithubStats] = useState({
    commitFrequency: [],
    languageUsage: {},
    mostActiveRepos: [],
    totalCommits: 0,
    detailedMetrics: null
  });
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const navigate = useNavigate();

  const findStudentRepo = (assignment) => {
    if (!assignment?.studentRepos || !user?._id) return null;
    
    return assignment.studentRepos.find(repo => 
      (repo.studentId._id === user._id) || 
      (typeof repo.studentId === 'string' && repo.studentId === user._id)
    );
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        // Fetch student data
        const studentResponse = await api.get(`/user/${user._id}`);
        const studentData = studentResponse.data.user;
        
        // Set notifications from user data if available
        if (studentData && studentData.notifications) {
          setNotifications(studentData.notifications || []);
          setNotificationsLoading(false);
        }

        // Fetch GitHub repos
        const studentRepo = await api.get(`/github/${user._id}/repos`);
        const repos = studentRepo.data.repos || [];

        // Process GitHub stats
        const stats = {
          commitFrequency: processCommitFrequency(repos, dateRange.startDate, dateRange.endDate),
          languageUsage: processLanguageUsage(repos),
          mostActiveRepos: getMostActiveRepos(repos),
          totalCommits: repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0),
          detailedMetrics: calculateGitHubMetrics(repos)
        };

        // Get LeetCode data if available
        let leetCodeData = null;
        if (studentData.leetCodeID) {
          try {
            const leetCodeResponse = await api.get(`/lcodeprofile/${user._id}`);
            leetCodeData = leetCodeResponse.data;
          } catch (error) {
            console.error("Error fetching LeetCode data:", error);
          }
        }

        setStudentData({
          student: studentData,
          classData: studentData.classId,
          repos: repos,
          leetCode: leetCodeData,
        });
        setGithubStats(stats);
        
        // Fetch assignments separately
        fetchAssignments();
        
        // If notifications weren't in the user data, fetch them separately
        if (!studentData.notifications) {
          fetchNotifications();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch your data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user?._id, dateRange.startDate, dateRange.endDate]);

  const fetchAssignments = async () => {
    if (!user?._id) return;
    
    try {
      setAssignmentsLoading(true);
      
      // First try to get assignments directly associated with the student
      const response = await api.get(`/assignment/student/${user._id}`);
      
      if (response.data.success && response.data.assignments?.length > 0) {
        setAssignments(response.data.assignments);
      } else {
        // If no assignments found, try to get assignments for the student's class
        if (studentData.student?.classId) {
          const classId = Array.isArray(studentData.student.classId) 
            ? studentData.student.classId[0]
            : studentData.student.classId;
            
          console.log("Trying to fetch assignments for class:", classId);
          
          // Try to fetch assignments for the student's class
          const classResponse = await api.get(`/assignment/class/${classId}`);
          
          if (classResponse.data.success && classResponse.data.assignments) {
            // Process assignments to add empty studentRepo entries if needed
            const processedAssignments = classResponse.data.assignments.map(assignment => {
              // If student doesn't have a repo entry yet, add a placeholder
              if (!assignment.studentRepos?.some(repo => repo.studentId === user._id)) {
                assignment.studentRepos = [
                  ...(assignment.studentRepos || []),
                  { studentId: { _id: user._id }, submitted: false }
                ];
              }
              return assignment;
            });
            
            setAssignments(processedAssignments);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?._id) return;
    
    try {
      setNotificationsLoading(true);
      // Instead of using a dedicated notifications endpoint, we can use the user data
      // that already contains notifications
      if (studentData.student && studentData.student.notifications) {
        setNotifications(studentData.student.notifications || []);
      } else {
        // Try to fetch user data specifically for notifications
        const response = await api.get(`/user/${user._id}`);
        if (response.data.success && response.data.user) {
          setNotifications(response.data.user.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const response = await api.post('/assignment/submit', {
        assignmentId,
        studentId: user._id
      });
      
      if (response.data.success) {
        toast.success('Assignment marked as submitted');
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
        <p>Loading Awesome stuff...</p>
      </div>
    );
  }

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">Name:</span>{" "}
                    {studentData.student?.firstName || "No data"}{" "}
                    {studentData.student?.lastName}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {studentData.student?.email || "No Data"}
                  </p>
                  <p>
                    <span className="font-semibold">Year of Study:</span>{" "}
                    {studentData.classData?.yearOfStudy || "No class found"}
                  </p>
                  <p>
                    <span className="font-semibold">Branch:</span>{" "}
                    {studentData.classData?.branch || "No class found"}
                  </p>
                  <p>
                    <span className="font-semibold">Division:</span>{" "}
                    {studentData.classData?.division || "No class found"}
                  </p>
                </div>
                <Badge variant="outline" className="mt-4 bg-green-300 border-0">
                  Student
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-git-branch"
                  >
                    <line x1="6" x2="6" y1="3" y2="15" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M18 9a9 9 0 0 1-9 9" />
                  </svg>
                  GitHub Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Total Repositories:</span>{" "}
                    {studentData.repos.length}
                  </p>
                  <p>
                    <span className="font-semibold">Total Commits:</span>{" "}
                    {studentData.repos.reduce(
                      (sum, repo) =>
                        sum + (repo.commits ? repo.commits.length : 0),
                      0
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-code"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                LeetCode Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentData.leetCode ? (
                studentData.leetCode?.completeProfile ? (
                  <>
                    <div className="user-profile mb-10 mt-4 bg-gray-100 p-4 rounded-lg">
                      <h1 className="text-md font-semibold">Basic Profile</h1>
                      <p className="text-sm mt-4">
                        <span className="font-semibold">Username:</span>{" "}
                        {studentData.leetCode.basicProfile.username}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Rank:</span>{" "}
                        {studentData.leetCode.basicProfile.ranking}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Contribution:</span>{" "}
                        {studentData.leetCode.basicProfile.reputation}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Total Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentData.leetCode.completeProfile.solvedProblem ||
                            0}
                        </p>
                      </div>
                      <div className="bg-green-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Easy Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentData.leetCode.completeProfile.easySolved || 0}
                        </p>
                      </div>
                      <div className="bg-yellow-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Medium Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentData.leetCode.completeProfile.mediumSolved ||
                            0}
                        </p>
                      </div>
                      <div className="bg-red-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Hard Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentData.leetCode.completeProfile.hardSolved || 0}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">
                    No LeetCode data available
                  </p>
                )
              ) : (
                <p className="text-center text-gray-500">
                  User has not linked their LeetCode account
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-folder"
                >
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                </svg>
                Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentData.repos.length > 0 ? (
                <div className="h-[450px] overflow-y-auto">
                  <Accordion type="single" collapsible>
                    {studentData.repos.map((repo, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <div className="flex flex-col items-start text-left w-full">
                            <h3 className="font-semibold text-lg">
                              {repo.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {repo.description || "No description"}
                            </p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {repo.commits.length} commits
                              </span>
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {repo.language || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {repo.commits && repo.commits.length > 0 ? (
                            <div className="space-y-4">
                              {repo.commits.map((commit, commitIndex) => (
                                <div
                                  key={commitIndex}
                                  className="bg-gray-100 p-3 rounded-lg shadow-sm"
                                >
                                  <p className="font-medium text-lg mb-2">
                                    {commit.message}
                                  </p>
                                  <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>
                                      {new Date(
                                        commit.date
                                      ).toLocaleDateString()}
                                    </span>
                                    <a
                                      href={commit.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      View on GitHub
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">
                              No commits for this repository.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No Repositories found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GitHubMetrics repos={studentData.repos} />
            </CardContent>
          </Card>

          {/* Teacher Notifications */}
          {/* <TeacherNotifications /> */}

          {/* Improvement Suggestions */}
          <StudentSuggestions
            githubData={{
              totalCommits: githubStats.totalCommits,
              languages: githubStats.languageUsage,
              metrics: githubStats.detailedMetrics,
              recentActivity: {
                commits: githubStats.detailedMetrics.raw.recentActivity.commits,
                activeDays: githubStats.detailedMetrics.raw.recentActivity.activeDays.size,
                repositories: githubStats.detailedMetrics.raw.recentActivity.repositories.size
              },
              scores: githubStats.detailedMetrics.scores
            }}
            leetCodeData={studentData.leetCode}
          />

          {/* Assignments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                My Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((assignment) => {
                    const studentRepo = findStudentRepo(assignment);
                    const status = getAssignmentStatus(
                      assignment.dueDate, 
                      studentRepo?.submitted || false
                    );
                    
                    const dueDate = new Date(assignment.dueDate);
                    const now = new Date();
                    const totalTime = new Date(assignment.dueDate) - new Date(assignment.createdAt);
                    const remainingTime = dueDate - now;
                    const progressPercentage = Math.max(
                      0, 
                      Math.min(100, 100 - (remainingTime / totalTime) * 100)
                    );

                    // Format the template repo URL for display
                    const templateRepoUrl = assignment.templateRepo ? 
                      `https://github.com/${assignment.templateRepo}` : 
                      null;

                    return (
                      <Card key={assignment._id} className="overflow-hidden">
                        <CardHeader className={`${status.color} border-b`}>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              {status.icon}
                              {status.label}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 space-y-4">
                          <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Due: </span>
                              <span className="font-medium">
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Points: </span>
                              <span className="font-medium">{assignment.points}</span>
                            </div>
                          </div>
                          
                          {/* Add Template Repository URL */}
                          <div className="mt-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Template Repository:</h4>
                            {templateRepoUrl ? (
                              <div className="flex items-center bg-gray-50 p-2 rounded-md border">
                                <input 
                                  type="text" 
                                  value={templateRepoUrl} 
                                  readOnly 
                                  className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(templateRepoUrl);
                                    toast.success("Template repository URL copied to clipboard");
                                  }}
                                  className="ml-2"
                                >
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No template repository available</p>
                            )}
                          </div>
                          
                          {/* Student Repository URL */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Repository:</h4>
                            {studentRepo?.repoUrl ? (
                              <div className="flex items-center bg-gray-50 p-2 rounded-md border">
                                <input 
                                  type="text" 
                                  value={studentRepo.repoUrl} 
                                  readOnly 
                                  className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(studentRepo.repoUrl);
                                    toast.success("Repository URL copied to clipboard");
                                  }}
                                  className="ml-2"
                                >
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No repository URL available</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {/* Template Repository Button */}
                            {templateRepoUrl && (
                              <Button variant="outline" className="flex items-center" asChild>
                                <a href={templateRepoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Template Repository
                                </a>
                              </Button>
                            )}
                            
                            {/* Student Repository Button */}
                            {studentRepo?.repoUrl && (
                              <Button variant="outline" className="flex items-center" asChild>
                                <a href={studentRepo.repoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Your Repository
                                </a>
                              </Button>
                            )}
                            
                            {!studentRepo?.submitted && (
                              <Button 
                                size="sm"
                                onClick={() => handleSubmitAssignment(assignment._id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark as Submitted
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No assignments found.</p>
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <p className="text-xs text-gray-400 mt-2">
                        Debug: API endpoint used: /assignment/student/{user._id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Note: Assignments may need to be explicitly assigned to students by teachers.
                      </p>
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/student/assignments')}
                >
                  View All Assignments
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <StudentNotifications notifications={notifications} />
                  {process.env.NODE_ENV === 'development' && notifications.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Debug: Notifications source: {studentData.student?.notifications ? 'User data' : 'Separate API call'}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Charts */}
        {/* Tracking Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Commit Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[450px]">
                <CommitFrequencyChart data={githubStats.commitFrequency} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Language Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <LanguageUsageChart data={githubStats.languageUsage} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                Most Active Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MostActiveReposList repos={githubStats.mostActiveRepos} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Navbar>
  );
};

export default StudentDashboard;

const CommitFrequencyChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
        interval="preserveStartEnd"
      />
      <YAxis />
      <Tooltip
        labelFormatter={(label) => new Date(label).toLocaleDateString()}
        formatter={(value) => [`${value} commits`, "Commits"]}
      />
      <Line
        type="monotone"
        dataKey="count"
        stroke="#8884d8"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

const LanguageUsageChart = ({ data }) => {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F06292",
    "#AED581",
    "#7986CB",
    "#9575CD",
    "#4DB6AC",
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="horizontal"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" radius={[5, 5, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const MostActiveReposList = ({ repos }) => (
  <div className="space-y-4">
    {repos.map((repo, index) => (
      <div
        key={index}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{repo.name}</h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {repo.commitCount} commits
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-300 h-2.5 rounded-full"
              style={{
                width: `${(repo.commitCount / repos[0].commitCount) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
