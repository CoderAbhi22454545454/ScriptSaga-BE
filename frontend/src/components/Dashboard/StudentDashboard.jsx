import React, { useEffect, useState, useMemo, useRef } from "react";
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
import ImprovementSuggestions from './Github/studentMetrics/ImprovementSuggestions';
import DomainRecommendations from './Github/studentMetrics/DomainRecommendations';
import LearningResources from './Github/studentMetrics/LearningResources';
import CareerRoadmap from './Github/studentMetrics/CareerRoadmap';
import { getDomainSuggestions } from '@/utils/domainSuggestions';
import { Input } from "@/components/ui/input";

const GitHubMetrics = ({ stats }) => {
  // Use the summary data from stats
  const totalRepos = stats.totalRepos || 0;
  const totalCommits = stats.totalCommits || 0;
  const activeRepos = stats.activeRepos || 0;
  const recentActivity = stats.activeRepos || 0;

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

const calculateSkillLevel = (metrics) => {
  const activityScore = calculateActivityScore(metrics);
  const qualityScore = calculateCodeQualityScore(metrics);
  const impactScore = calculateImpactScore(metrics);
  
  const overallScore = (activityScore + qualityScore + impactScore) / 3;
  
  if (overallScore >= 80) return 'Advanced';
  if (overallScore >= 60) return 'Intermediate';
  if (overallScore >= 40) return 'Beginner';
  return 'Novice';
};

const getSkillColor = (level) => {
  switch (level) {
    case 'Advanced': return 'bg-green-100 text-green-800';
    case 'Intermediate': return 'bg-blue-100 text-blue-800';
    case 'Beginner': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getActivityLevel = (activeDays) => {
  if (activeDays >= 20) return 'Very Active';
  if (activeDays >= 10) return 'Active';
  if (activeDays >= 5) return 'Moderate';
  return 'Inactive';
};

const calculateGitHubMetrics = (repos, summary = null) => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
  
  const metrics = {
    recentActivity: {
      commits: 0,
      activeDays: new Set(),
      repositories: new Set(),
    },
    impact: {
      totalStars: summary?.totalStars || 0,
      totalForks: summary?.totalForks || 0,
      contributionStreak: 0,
    }
  };

  if ((!repos || repos.length === 0) && !summary) {
    return {
      raw: metrics,
      scores: {
        activity: 0,
        quality: 0,
        impact: 0
      }
    };
  }

  // If we have summary data but no detailed repos, use the summary
  if ((!repos || repos.length === 0) && summary) {
    // Estimate activity metrics from summary
    metrics.recentActivity.commits = Math.round(summary.totalCommits * 0.3); // Estimate 30% of commits are recent
    metrics.recentActivity.repositories = new Set(Array(summary.activeRepos).fill().map((_, i) => `repo-${i}`));
    metrics.recentActivity.activeDays = new Set(Array(Math.min(30, summary.activeRepos * 3)).fill().map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }));
    
    metrics.impact.totalStars = summary.totalStars;
    metrics.impact.totalForks = summary.totalForks;
    
    return {
      raw: metrics,
      scores: {
        activity: calculateActivityScore(metrics),
        quality: calculateCodeQualityScore(metrics),
        impact: calculateImpactScore(metrics)
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

  // If we have summary data, use it to enhance our metrics
  if (summary) {
    // If summary has more stars/forks than what we calculated, use the summary values
    if (summary.totalStars > metrics.impact.totalStars) {
      metrics.impact.totalStars = summary.totalStars;
    }
    if (summary.totalForks > metrics.impact.totalForks) {
      metrics.impact.totalForks = summary.totalForks;
    }
  }

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
  const languages = {};
  
  repos.forEach(repo => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });
  
  // Make sure we're returning a non-empty object
  console.log("Processed languages:", languages);
  return languages; // Always return the languages object, even if empty
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

const SkillAssessment = ({ studentRepos, studentLeetCode }) => {
  const metrics = calculateGitHubMetrics(studentRepos);
  const skillLevel = calculateSkillLevel(metrics.raw);
  const activityLevel = getActivityLevel(metrics.raw.recentActivity.activeDays.size);
  
  return (
    <Card className="mb-6">
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
            className="lucide lucide-award"
          >
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          Skill Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">GitHub Skills</h3>
              <div className={`inline-block px-3 py-1 rounded-full ${getSkillColor(skillLevel)}`}>
                {skillLevel}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Activity Level</h3>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {activityLevel}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
              <ProgressMetric
                label="Commits in last 90 days"
                value={metrics.raw.recentActivity.commits}
                total={150}
              />
              <ProgressMetric
                label="Active Days"
                value={metrics.raw.recentActivity.activeDays.size}
                total={90}
              />
              <ProgressMetric
                label="Active Repositories"
                value={metrics.raw.recentActivity.repositories.size}
                total={10}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Code Quality</h3>
              <ProgressMetric
                label="Commit Frequency"
                value={metrics.raw.recentActivity.commits}
                total={150}
              />
              <ProgressMetric
                label="Repository Diversity"
                value={metrics.raw.recentActivity.repositories.size}
                total={10}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Impact</h3>
              <ProgressMetric
                label="Stars Received"
                value={metrics.raw.impact.totalStars}
                total={50}
              />
              <ProgressMetric
                label="Forks Received"
                value={metrics.raw.impact.totalForks}
                total={20}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const isMountedRef = useRef(true);
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
  const [solutionUrls, setSolutionUrls] = useState({});
  const [githubError, setGithubError] = useState(null);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isEditingGithubId, setIsEditingGithubId] = useState(false);
  const [newGithubId, setNewGithubId] = useState("");
  const [isUpdatingGithubId, setIsUpdatingGithubId] = useState(false);
  const [isInvalidGithubId, setIsInvalidGithubId] = useState(false);

  const findStudentRepo = (assignment) => {
    if (!assignment?.studentRepos || !user?._id) return null;
    
    return assignment.studentRepos.find(repo => 
      (repo.studentId._id === user._id) || 
      (typeof repo.studentId === 'string' && repo.studentId === user._id)
    );
  };

  const memoizedLanguageUsage = useMemo(() => {
    return processLanguageUsage(studentData.repos);
  }, [studentData.repos]);


  const memoizedActiveRepos = useMemo(() => {
    return getMostActiveRepos(studentData.repos);
  }, [studentData.repos]);

  const fetchGithubSummary = async (userId) => {
    try {
      const response = await api.get(`/github/${userId}/summary`);
      if (!response.data.success) {
        throw new Error('Failed to fetch GitHub summary');
      }
      return {
        success: true,
        summary: response.data.summary,
        fromCache: response.data.fromCache
      };
    } catch (error) {
      console.error('Error fetching GitHub summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch GitHub summary',
        summary: {
          totalRepos: 0,
          totalCommits: 0,
          activeRepos: 0,
          totalStars: 0,
          totalForks: 0
        }
      };
    }
  };

  const fetchAllData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setGithubError(null);
      
      // Fetch student data
      const studentResponse = await api.get(`/user/${user._id}`);
      if (!isMountedRef.current) return;
      const studentData = studentResponse.data.user;
      
      // Set notifications from user data if available
      if (studentData && studentData.notifications) {
        setNotifications(studentData.notifications || []);
        setNotificationsLoading(false);
      }

      // First fetch GitHub summary (fast)
      let githubSummary = { 
        totalRepos: 0, 
        totalCommits: 0, 
        activeRepos: 0,
        totalStars: 0,
        totalForks: 0
      };
      
      if (studentData.githubID) {
        try {
          const summaryResult = await fetchGithubSummary(user._id);
          if (!isMountedRef.current) return;
          
          if (summaryResult.success) {
            githubSummary = summaryResult.summary;
            setIsGithubConnected(true);
          } else {
            setGithubError(summaryResult.error);
            setIsGithubConnected(false);
            toast.error("Failed to fetch GitHub data. Please check your GitHub connection.");
          }
        } catch (error) {
          console.error("GitHub API Error:", error);
          setGithubError(error.message || "Failed to connect to GitHub");
          setIsGithubConnected(false);
          toast.error("Failed to connect to GitHub. Please check your GitHub connection.");
        }
      }
      
      // Fetch GitHub repos (only first page for detailed view)
      let repos = [];
      let leetCodeData = null;
      
      if (studentData.githubID) {
        const studentRepo = await api.get(`/github/${user._id}/repos`);
        if (!isMountedRef.current) return;
        repos = studentRepo.data.repos || [];
      }

      // Process GitHub stats using both summary and detailed data
      const languageData = processLanguageUsage(repos);
      
      const stats = {
        languageUsage: languageData,
        mostActiveRepos: getMostActiveRepos(repos),
        totalCommits: githubSummary.totalCommits || repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0),
        totalRepos: githubSummary.totalRepos || repos.length,
        activeRepos: githubSummary.activeRepos || repos.filter(repo => repo.commits?.length > 0).length,
        totalStars: githubSummary.totalStars || repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
        totalForks: githubSummary.totalForks || repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
        detailedMetrics: calculateGitHubMetrics(repos, githubSummary)
      };

      // Get LeetCode data if available
      if (studentData.leetCodeID) {
        try {
          const leetCodeResponse = await api.get(`/lcodeprofile/${user._id}`);
          if (!isMountedRef.current) return;
          leetCodeData = leetCodeResponse.data;
        } catch (error) {
          console.error("Error fetching LeetCode data:", error);
        }
      }

      // Update all state at once to minimize re-renders
      if (isMountedRef.current) {
        setStudentData({
          student: studentData,
          classData: studentData.classId?.[0] || null,
          repos: repos,
          leetCode: leetCodeData
        });

        setGithubStats(stats);
      }

      // Fetch assignments
      try {
        const assignmentsResponse = await api.get(`/assignment/student/${user._id}`);
        if (!isMountedRef.current) return;
        setAssignments(assignmentsResponse.data.assignments || []);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        if (isMountedRef.current) setAssignmentsLoading(false);
      }

    } catch (error) {
      if (isMountedRef.current) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data");
        toast.error("Failed to load dashboard data");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?._id]);

  useEffect(() => {
    // Check if GitHub ID is invalid based on statistics
    if (studentData.student?.githubID && 
        githubStats.totalRepos === 0 && 
        githubStats.totalCommits === 0) {
      setIsInvalidGithubId(true);
    } else {
      setIsInvalidGithubId(false);
    }
  }, [studentData.student?.githubID, githubStats.totalRepos, githubStats.totalCommits]);

  const handleUpdateSolutionUrl = (assignmentId, url) => {
    setSolutionUrls(prev => ({
      ...prev,
      [assignmentId]: url
    }));
  };

  const handleSubmitAssignment = async (assignmentId, solutionUrl) => {
    try {
      // Get the solution URL from state
      const urlToSubmit = solutionUrl || solutionUrls[assignmentId];
      
      // Validate URL
      if (!urlToSubmit || !urlToSubmit.match(/^https?:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_]+\/?$/)) {
        toast.error("Please enter a valid GitHub repository URL");
        return;
      }
      
      const response = await api.post('/assignment/submit', {
        assignmentId,
        studentId: user._id,
        solutionUrl: urlToSubmit
      });
      
      if (response.data.success) {
        toast.success('Assignment marked as submitted');
        fetchAllData(); // Refresh all data to get updated assignment status
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  useEffect(() => {
    const initialUrls = {};
    assignments.forEach(assignment => {
      const studentRepo = findStudentRepo(assignment);
      if (studentRepo) {
        initialUrls[assignment._id] = studentRepo.repoUrl || '';
      }
    });
    setSolutionUrls(initialUrls);
  }, [assignments]);

  const handleUpdateGithubId = async () => {
    if (!newGithubId.trim()) {
      toast.error("Please enter a valid GitHub username");
      return;
    }

    try {
      setIsUpdatingGithubId(true);
      const response = await api.put(`/user/${user._id}/github`, {
        githubID: newGithubId.trim()
      });

      if (response.data.success) {
        toast.success("GitHub ID updated successfully");
        setIsEditingGithubId(false);
        setGithubError(null);
        // Refresh all data
        await fetchAllData();
      } else {
        toast.error(response.data.message || "Failed to update GitHub ID");
      }
    } catch (error) {
      console.error("Error updating GitHub ID:", error);
      if (error.response?.status === 404) {
        toast.error("The update endpoint is not available. Please try again later.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update GitHub ID. Please try again.");
      }
    } finally {
      setIsUpdatingGithubId(false);
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
        {/* GitHub Connection Status */}
        {githubError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <h3 className="font-medium text-red-700">GitHub Connection Issue</h3>
                  <p className="text-sm text-red-600">{githubError}</p>
                </div>
              </div>
              
              {isEditingGithubId ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Enter your GitHub username"
                      value={newGithubId}
                      onChange={(e) => setNewGithubId(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingGithubId(false)}
                      disabled={isUpdatingGithubId}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleUpdateGithubId}
                      disabled={isUpdatingGithubId}
                    >
                      {isUpdatingGithubId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-red-500">
                    Make sure to enter your exact GitHub username
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingGithubId(true);
                      setNewGithubId(studentData.student?.githubID || "");
                    }}
                  >
                    Update GitHub ID
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings')}
                  >
                    Go to Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                <div className="space-y-4">
                  {(githubError || isInvalidGithubId) ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-medium text-red-700">GitHub ID Issue</h3>
                      </div>
                      <p className="text-sm text-red-600 mb-3">
                        Hey, your GitHub ID is invalid or not found. Please update it to view your GitHub statistics.
                      </p>
                      {isEditingGithubId ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Enter your GitHub username"
                            value={newGithubId}
                            onChange={(e) => setNewGithubId(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingGithubId(false)}
                            disabled={isUpdatingGithubId}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleUpdateGithubId}
                            disabled={isUpdatingGithubId}
                          >
                            {isUpdatingGithubId ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setIsEditingGithubId(true);
                            setNewGithubId(studentData.student?.githubID || "");
                          }}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Update GitHub ID
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                          className="lucide lucide-github"
                        >
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                        <span className="font-medium">GitHub ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{studentData.student?.githubID || "Not connected"}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingGithubId(true);
                            setNewGithubId(studentData.student?.githubID || "");
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
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
                    {studentData.student?.classId?.[0]?.className?.split('-')?.[0] || "No class found"}
                  </p>
                  <p>
                    <span className="font-semibold">Branch:</span>{" "}
                    {studentData.student?.classId?.[0]?.branch || "No class found"}
                  </p>
                  <p>
                    <span className="font-semibold">Division:</span>{" "}
                    {studentData.student?.classId?.[0]?.division || "No class found"}
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
                    {githubStats.totalRepos || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Total Commits:</span>{" "}
                    {githubStats.totalCommits || 0}
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
              <GitHubMetrics stats={githubStats} />
            </CardContent>
          </Card>

          {/* Teacher Notifications */}
          {/* <TeacherNotifications /> */}

          {/* Improvement Suggestions */}
          {/* <StudentSuggestions
            githubData={{
              totalCommits: githubStats.totalCommits,
              languages: githubStats.languageUsage,
              metrics: githubStats.detailedMetrics,
              recentActivity: {
                commits: githubStats.detailedMetrics?.raw?.recentActivity?.commits || 0,
                activeDays: githubStats.detailedMetrics?.raw?.recentActivity?.activeDays?.size || 0,
                repositories: githubStats.detailedMetrics?.raw?.recentActivity?.repositories?.size || 0
              },
              scores: githubStats.detailedMetrics?.scores || {}
            }}
            leetCodeData={studentData.leetCode}
          /> */}
          
          {/* Add the new components */}
          {console.log("GitHub stats:", githubStats)}
          
          {/* Improvement Suggestions */}
          {githubStats.detailedMetrics && (
            <ImprovementSuggestions metrics={githubStats.detailedMetrics} />
          )}
          
          {/* Domain Recommendations and Career Roadmap */}
          {githubStats.languageUsage && Object.keys(githubStats.languageUsage).length > 0 ? (
            <>
              <DomainRecommendations languages={githubStats.languageUsage} />
              <CareerRoadmap languages={githubStats.languageUsage} />
              <LearningResources languages={githubStats.languageUsage} />
            </>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Career Path Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center text-gray-500">
                  No language data available. Start coding in more repositories to get personalized career recommendations.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Skill Assessment */}
          {studentData.repos && studentData.repos.length > 0 && (
            <SkillAssessment 
              studentRepos={studentData.repos} 
              studentLeetCode={studentData.leetCode} 
            />
          )}

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

                    return (
                      <Card key={assignment._id} className="overflow-hidden">
                        <CardHeader className={`${status.color} border-b`}>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
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
                          
                          {/* Assignment Repository URL */}
                          <div className="mt-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Repository:</h4>
                            <div className="flex items-center bg-gray-50 p-2 rounded-md border">
                              <input 
                                type="text" 
                                value={assignment.repoUrl || ""} 
                                readOnly 
                                className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  navigator.clipboard.writeText(assignment.repoUrl || "");
                                  toast.success("Repository URL copied to clipboard");
                                }}
                                className="ml-2"
                              >
                                <ClipboardCopy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Your Solution Repository URL */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Solution Repository URL:</h4>
                            {studentRepo?.submitted ? (
                              <div className="flex items-center bg-green-50 p-2 rounded-md border border-green-200">
                                <input 
                                  type="text" 
                                  value={studentRepo.repoUrl || ""} 
                                  readOnly 
                                  className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none overflow-hidden text-ellipsis"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(studentRepo.repoUrl || "");
                                    toast.success("Your solution URL copied to clipboard");
                                  }}
                                  className="ml-2"
                                >
                                  <ClipboardCopy className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Input
                                  type="text"
                                  placeholder="https://github.com/yourusername/your-solution-repo"
                                  value={solutionUrls[assignment._id] || ""}
                                  onChange={(e) => handleUpdateSolutionUrl(assignment._id, e.target.value)}
                                  className="w-full text-sm"
                                />
                                <Button 
                                  size="sm"
                                  onClick={() => handleSubmitAssignment(assignment._id)}
                                  className="bg-green-600 hover:bg-green-700 w-full"
                                >
                                  Submit Solution & Mark as Complete
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {/* Assignment Repository Button */}
                            <Button variant="outline" className="flex items-center" asChild>
                              <a href={assignment.repoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Assignment Repository
                              </a>
                            </Button>
                            
                            {/* Solution Repository Button */}
                            {studentRepo?.submitted && studentRepo.repoUrl && (
                              <Button variant="outline" className="flex items-center" asChild>
                                <a href={studentRepo.repoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Your Solution
                                </a>
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

const LanguageUsageChart = ({ data }) => {
  // Add a check to ensure data is defined before using Object.entries()
  const chartData = data ? Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) : [];

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
