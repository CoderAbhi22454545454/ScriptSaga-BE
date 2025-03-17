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
import { useParams } from "react-router-dom";
import api from "@/constants/constant";
import { toast } from "sonner";
import CalHeatMap from "cal-heatmap";
import "cal-heatmap/cal-heatmap.css";
import { Loader2, RefreshCw } from "lucide-react";
import DetailedStudentProgress from "./DetailedStudent";
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
  AlertCircle,
  GitBranch,
} from "lucide-react";
import MessageStudent from "../../MessageStudent";
import DomainRecommendations from '../studentMetrics/DomainRecommendations';
import { getDomainSuggestions } from '@/utils/domainSuggestions';
import StudentProgressDashboard from './StudentProgressDashboard';

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

const StudentDetailGit = () => {
  const { userId } = useParams();
  const [student, setStudent] = useState();
  const [classData, setClassData] = useState();
  const [studentRepos, setStudentRepos] = useState([]);
  const [studentLeetCode, setStudentLeetCode] = useState(null);
  const [repoPage, setRepoPage] = useState(1);
  const [commitPage, setCommitPage] = useState(1);
  const [hasMoreRepos, setHasMoreRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commitFrequency, setCommitFrequency] = useState([]);
  const [languageUsage, setLanguageUsage] = useState({});
  const [mostActiveRepos, setMostActiveRepos] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [isLoadingGithubSummary, setIsLoadingGithubSummary] = useState(true);
  const [isLoadingLeetCode, setIsLoadingLeetCode] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [classAverageData, setClassAverageData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (dataFetched && !forceRefresh) return;
      
      try {
        setLoading(true);
        setIsLoadingStudent(true);
        setIsLoadingGithubSummary(true);
        setIsLoadingLeetCode(true);
        setIsLoadingCharts(true);
        setError(null);

        // Try to get student data from cache first
        const cacheKey = `student_data_${userId}`;
        let studentData = !forceRefresh ? getCachedData(cacheKey) : null;
        
        if (!studentData) {
          // If not in cache or force refresh, fetch from API
          studentData = await fetchStudentData(userId);
          if (!isMounted) return;
          
          // Cache the result
          setCachedData(cacheKey, studentData);
        }
        
        setStudent(studentData);
        setClassData(studentData.classId[0]);
        setIsLoadingStudent(false);

        if (studentData.githubID) {
          // First fetch GitHub summary (fast)
          let githubSummary = { 
            totalRepos: 0, 
            totalCommits: 0, 
            activeRepos: 0,
            totalStars: 0,
            totalForks: 0
          };
          
          // Try to get GitHub summary from cache
          const summaryCacheKey = `github_summary_${userId}`;
          const cachedSummary = !forceRefresh ? getCachedData(summaryCacheKey) : null;
          
          if (cachedSummary) {
            githubSummary = cachedSummary;
            console.log('Using cached GitHub summary:', githubSummary);
          } else {
            const summaryResult = await fetchGithubSummary(userId);
            if (!isMounted) return;
            
            if (summaryResult.success) {
              githubSummary = summaryResult.summary;
              console.log('Successfully fetched GitHub summary:', githubSummary);
              
              // Cache the result
              setCachedData(summaryCacheKey, githubSummary);
            }
          }
          
          setMetrics(githubSummary);
          setIsLoadingGithubSummary(false);
          
          // Then fetch detailed repo data
          const reposCacheKey = `github_repos_${userId}`;
          let reposData = !forceRefresh ? getCachedData(reposCacheKey) : null;
          
          if (!reposData) {
            const result = await fetchGithubRepos(userId);
            if (!isMounted) return;
            
            if (result.success) {
              reposData = result.repos;
              // Cache the result
              setCachedData(reposCacheKey, reposData);
            } else {
              setError(result.error || "Failed to fetch GitHub data");
              reposData = [];
            }
          }
          
          setStudentRepos(reposData);
          
          if (reposData.length > 0) {
            setCommitFrequency(processCommitFrequency(reposData, startDate, endDate));
            setLanguageUsage(processLanguageUsage(reposData));
            setMostActiveRepos(getMostActiveRepos(reposData));
            setIsLoadingCharts(false);
            
            // Use both detailed repos and summary data for metrics
            const enhancedMetrics = {
              totalRepos: Math.max(githubSummary.totalRepos, reposData.length),
              totalCommits: Math.max(
                githubSummary.totalCommits, 
                reposData.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0)
              ),
              activeRepos: Math.max(
                githubSummary.activeRepos,
                reposData.filter(repo => (repo.commits?.length || 0) > 0).length
              ),
              totalStars: Math.max(
                githubSummary.totalStars,
                reposData.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
              ),
              totalForks: Math.max(
                githubSummary.totalForks,
                reposData.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
              )
            };
            
            setMetrics(enhancedMetrics);
            
            // Check if we need to update metrics on the server
            if (forceRefresh) {
              try {
                const metricsData = await updateMetrics(
                  userId, 
                  reposData, 
                  studentData.leetCodeID ? await fetchLeetCodeData(userId) : null
                );
                if (!isMounted) return;
                
                if (metricsData && Object.keys(metricsData).length > 0) {
                  const updatedMetrics = {
                    totalRepos: metricsData.totalRepos || enhancedMetrics.totalRepos,
                    totalCommits: metricsData.totalCommits || enhancedMetrics.totalCommits,
                    activeRepos: metricsData.activeRepos || enhancedMetrics.activeRepos,
                    totalStars: metricsData.totalStars || enhancedMetrics.totalStars,
                    totalForks: metricsData.totalForks || enhancedMetrics.totalForks,
                    ...metricsData
                  };
                  
                  setMetrics(updatedMetrics);
                  // Update the cache with new metrics
                  setCachedData(summaryCacheKey, updatedMetrics);
                }
              } catch (metricsError) {
                console.error('Error updating metrics:', metricsError);
              }
            }
          } else if (githubSummary.totalRepos > 0) {
            setLanguageUsage({});
            setMostActiveRepos([]);
            setCommitFrequency([]);
          } else {
            setError("No GitHub repositories found for this student.");
            console.log("No GitHub repositories found for this student.");
            toast.error("No GitHub repositories found for this student.");
          }
        } else {
          setError("Student does not have a GitHub username configured.");
        }

        // Fetch LeetCode data with caching
        if (studentData.leetCodeID) {
          const leetCodeCacheKey = `leetcode_data_${userId}`;
          let leetCodeData = !forceRefresh ? getCachedData(leetCodeCacheKey) : null;
          
          if (!leetCodeData) {
            leetCodeData = await fetchLeetCodeData(userId);
            if (leetCodeData) {
              setCachedData(leetCodeCacheKey, leetCodeData);
            }
          }
          
          if (leetCodeData) {
            setStudentLeetCode(leetCodeData);
          }
          setIsLoadingLeetCode(false);
        }

      } catch (error) {
        if (isMounted) {
          console.error("Error fetching data:", error);
          setError(error.message || "Failed to load data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setDataFetched(true);
          setIsLoadingStudent(false);
          setIsLoadingGithubSummary(false);
          setIsLoadingLeetCode(false);
          setIsLoadingCharts(false);
          setForceRefresh(false); // Reset the force refresh flag
        }
      }
    };

    console.log("Fetching all data for userId:", userId);
    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [userId, dataFetched, startDate, endDate, forceRefresh]);

  useEffect(() => {
    if (studentRepos.length > 0) {
      setCommitFrequency(processCommitFrequency(studentRepos, startDate, endDate));
    }
  }, [studentRepos, startDate, endDate]);

  const processCommitFrequency = (repos, start, end) => {
    const commitCounts = {};
    repos.forEach((repo) => {
      repo.commits.forEach((commit) => {
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
        languageCounts[repo.language] =
          (languageCounts[repo.language] || 0) + 1;
      }
    });
    return languageCounts;
  };

  const getMostActiveRepos = (repos) => {
    return repos
      .sort((a, b) => b.commits.length - a.commits.length)
      .slice(0, 5)
      .map((repo) => ({ name: repo.name, commitCount: repo.commits.length }));
  };

  const fetchCommits = async (repoName) => {
    try {
      console.log("Fetching commits for repo:", repoName);
      const response = await api.get(`/${userId}/repos/${repoName}/commits`);
      const { commits, hasMore } = response.data;
      console.log("Fetched commits:", commits);
      setSelectedRepo((prevRepo) => ({
        ...prevRepo,
        name: repoName,
        commits: [...(prevRepo?.commits || []), ...commits],
        hasMoreCommits: hasMore,
      }));
      setCommitPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching commits:", error);
      setSelectedRepo((prevRepo) => ({
        ...prevRepo,
        name: repoName,
        commits: [],
        hasMoreCommits: false,
      }));
      toast.error("Failed to fetch commits. The repository might be empty.");
    }
  };

  const fetchGithubData = async (page = 1) => {
    try {
      setIsLoadingRepos(true);
      setError(null);
      
      if (!student?.githubID) {
        throw new Error('GitHub username not configured');
      }
      
      const response = await api.get(`/github/${userId}/repos`, {
        params: { page, limit: 10 }
      });

      if (response.data.success) {
        setStudentRepos(prev => [...prev, ...response.data.repos]);
        setHasMoreRepos(page < response.data.pagination.totalPages);
      } else {
        throw new Error(response.data.message || 'Failed to fetch GitHub data');
      }
    } catch (error) {
      const errorMessage = error.response?.status === 404
        ? 'GitHub username not found or invalid'
        : error.response?.data?.message || error.message || 'Failed to fetch GitHub data';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchLeetCodeData = async (userId) => {
    try {
      const response = await api.get(`/lcodeprofile/${userId}`);
      if (!response.data) {
        throw new Error('No LeetCode data received');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching LeetCode data:', error);
      toast.error('Failed to fetch LeetCode data');
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const leetCodeData = await fetchLeetCodeData(userId);
        if (leetCodeData) {
          setStudentLeetCode(leetCodeData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const fetchProgressData = async () => {
      if (!userId || !student?.classId?.[0]?._id) return;
      
      try {
        setIsLoadingProgress(true);
        
        // Only fetch progress data if we have a valid GitHub username
        if (student.githubID) {
          // Fetch student progress report with caching
          let progressData = null;
          let classAverageData = null;
          let comparisonData = null;
          
          // Try to get progress data from cache
          const progressCacheKey = `progress_data_${userId}`;
          progressData = !forceRefresh ? getCachedData(progressCacheKey) : null;
          
          if (!progressData) {
            try {
              const progressResponse = await api.getStudentProgressReport(userId);
              if (!isMounted) return;
              progressData = progressResponse.data;
              console.log("Progress report data:", progressData);
              
              // Cache the result if valid
              if (progressData && progressData.codingActivity) {
                setCachedData(progressCacheKey, progressData);
              }
            } catch (progressError) {
              console.error('Error fetching student progress report:', progressError);
            }
          }
          
          // If we still don't have valid progress data, create default
          if (!progressData || !progressData.codingActivity) {
            console.log("Creating default progress data from metrics");
            progressData = createDefaultProgressData(metrics, studentRepos, studentLeetCode);
          }
          
          // Try to get class average data from cache
          const classCacheKey = `class_average_${student.classId[0]._id}`;
          classAverageData = !forceRefresh ? getCachedData(classCacheKey) : null;
          
          if (!classAverageData) {
            try {
              const classResponse = await api.getClassAverages(student.classId[0]._id);
              if (!isMounted) return;
              classAverageData = classResponse.data;
              console.log("Class average data:", classAverageData);
              
              // Cache the result if valid
              if (classAverageData) {
                setCachedData(classCacheKey, classAverageData);
              }
            } catch (classError) {
              console.error('Error fetching class averages:', classError);
              if (classError.response?.data?.message === "No students found in this class") {
                console.log("No other students with GitHub data found in this class for comparison");
              }
            }
          }
          
          // If we still don't have valid class data, create default
          if (!classAverageData) {
            classAverageData = createDefaultClassAverageData();
          }
          
          // Try to get comparison data from cache
          const comparisonCacheKey = `comparison_data_${userId}`;
          comparisonData = !forceRefresh ? getCachedData(comparisonCacheKey) : null;
          
          if (!comparisonData) {
            try {
              const comparisonResponse = await api.compareStudentWithClass(userId);
              if (!isMounted) return;
              comparisonData = comparisonResponse.data;
              console.log("Comparison data:", comparisonData);
              
              // Cache the result if valid
              if (comparisonData) {
                setCachedData(comparisonCacheKey, comparisonData);
              }
            } catch (comparisonError) {
              console.error('Error fetching comparison data:', comparisonError);
            }
          }
          
          // If we still don't have valid comparison data, create default
          if (!comparisonData) {
            comparisonData = createDefaultComparisonData();
          }

          setProgressData(progressData);
          setClassAverageData({
            averages: classAverageData,
            comparison: comparisonData
          });
        } else {
          setError("GitHub username not configured");
        }
      } catch (error) {
        console.error('Error in overall progress data fetching:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch progress data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          setIsLoadingProgress(false);
        }
      }
    };

    fetchProgressData();

    return () => {
      isMounted = false;
    };
  }, [userId, student, metrics, studentRepos, studentLeetCode, forceRefresh]);

  const refreshData = () => {
    setForceRefresh(true);
    toast.info("Refreshing data...");
  };

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
        <p>Loading Awesome stuff...</p>
      </div>
    );
  }

  // Early return if no GitHub ID
  if (!student.githubID) {
    return (
      <Navbar>
        <div className="container mx-auto p-6">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                GitHub Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No GitHub Account Connected</h3>
                <p className="text-gray-500 max-w-md">
                  This student hasn't connected their GitHub account yet. GitHub integration 
                  is required to track repository activity and coding progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Navbar>
    );
  }

  const totalCommits = studentRepos.reduce(
    (sum, repo) => sum + (repo.commits ? repo.commits.length : 0),
    0
  );

  const renderContent = () => {
    if (error && error.includes('GitHub')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-7">
          {/* Always show student info */}

          <div className="flex flex-col gap-7">
          <Card className="grid grid-cols-1 md:grid-cols-1 gap-7">
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
                <Badge variant="outline" className="ml-auto bg-green-300 border-0">
                  Student
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStudent ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">Name:</span>{" "}
                    {student.firstName || "No data"} {student.lastName}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {student.email || "No Data"}
                  </p>
                  <p>
                    <span className="font-semibold">Year of Study:</span>{" "}
                    {/* Class: {classData?.className} | Branch: {classData?.branch} | Division: {classData?.division} */}
                    {student.classId[0].className || "Student not in any class"}
                    </p>
                  <p>
                    <span className="font-semibold">Branch:</span>{" "}
                    {student.classId[0].branch || "Student not in any class"}
                  </p>
                  <p>
                    <span className="font-semibold">Division:</span>{" "}
                    {student.classId[0].division || "Student not in any class"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <MessageStudent studentId={student._id} className="grid grid-cols-1 md:grid-cols-1 gap-7"/>
          </div>
        

          {/* Show GitHub error card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                GitHub Integration Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">GitHub Data Unavailable</h3>
                <p className="text-gray-500 max-w-md mb-4">{error}</p>
                {error.includes('not configured') && (
                  <p className="text-sm text-gray-600">
                    Please ask the student to configure their GitHub username in their profile settings.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-1 gap-7">
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

              <Badge variant="outline" className="ml-auto bg-green-300 border-0">
              Student
            </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudent ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="font-semibold">Name:</span>{" "}
                  {student.firstName || "No data"} {student.lastName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {student.email || "No Data"}
                </p>
                <p>
                  <span className="font-semibold">Year of Study:</span>{" "}
                  {/* Class: {classData?.className} | Branch: {classData?.branch} | Division: {classData?.division} */}
                  {student.classId[0].className || "Student not in any class"}
                  </p>
                <p>
                  <span className="font-semibold">Branch:</span>{" "}
                  {student.classId[0].branch || "Student not in any class"}
                </p>
                <p>
                  <span className="font-semibold">Division:</span>{" "}
                  {student.classId[0].division || "Student not in any class"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <MessageStudent studentId={student._id} />

        {/* Modified StudentProgressDashboard with better error handling */}
        {student.githubID && (
          <StudentProgressDashboard 
            userId={userId}
            progressData={progressData}
            classAverageData={classAverageData?.averages && classAverageData?.comparison ? classAverageData : null}
            isLoading={isLoadingProgress}
            error={error}
          />
        )}

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
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub Progress Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGithubSummary ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <GitHubMetrics stats={metrics} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChartIcon className="h-6 w-6" />
              Recommended Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              metrics && languageUsage && (
                <DomainRecommendations 
                  languages={languageUsage} 
                  metrics={metrics}
                />
              )
            )}
          </CardContent>
        </Card>

        <DetailedStudentProgress 
          repos={studentRepos} 
          leetCode={studentLeetCode} 
          isLoading={isLoadingCharts} 
        />
      </div>
    );
  };

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <div className="flex justify-end mb-2">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            disabled={loading || isLoadingProgress}
          >
            <RefreshCw className={`h-4 w-4 ${loading || isLoadingProgress ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
        {renderContent()}

        <div className="mt-8">
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
              {isLoadingLeetCode ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                student?.leetCodeID ? (
                  studentLeetCode?.completeProfile ? (
                    <>
                      <div className="user-profile mb-10 mt-4 bg-gray-100 p-4 rounded-lg">
                        <h1 className="text-md font-semibold">Basic Profile</h1>
                        <p className="text-sm mt-4">
                          <span className="font-semibold">Username:</span>{" "}
                          {studentLeetCode.basicProfile.username}
                        </p>
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Rank:</span>{" "}
                          {studentLeetCode.basicProfile.ranking}
                        </p>
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Contribution:</span>{" "}
                          {studentLeetCode.basicProfile.reputation}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-500 text-white p-4 rounded-lg">
                          <p className="text-sm font-medium">Total Solved</p>
                          <p className="text-2xl font-bold mt-1">
                            {studentLeetCode.completeProfile.solvedProblem || 0}
                          </p>
                        </div>
                        <div className="bg-green-500 text-white p-4 rounded-lg">
                          <p className="text-sm font-medium">Easy Solved</p>
                          <p className="text-2xl font-bold mt-1">
                            {studentLeetCode.completeProfile.easySolved || 0}
                          </p>
                        </div>
                        <div className="bg-yellow-500 text-white p-4 rounded-lg">
                          <p className="text-sm font-medium">Medium Solved</p>
                          <p className="text-2xl font-bold mt-1">
                            {studentLeetCode.completeProfile.mediumSolved || 0}
                          </p>
                        </div>
                        <div className="bg-red-500 text-white p-4 rounded-lg">
                          <p className="text-sm font-medium">Hard Solved</p>
                          <p className="text-2xl font-bold mt-1">
                            {studentLeetCode.completeProfile.hardSolved || 0}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500">No LeetCode data available</p>
                  )
                ) : (
                  <p className="text-center text-gray-500">
                    User has not linked their LeetCode account
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
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
                  className="lucide lucide-git-fork"
                >
                  <circle cx="12" cy="18" r="3" />
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
                  <path d="M12 12v3" />
                </svg>
                Repositories
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[570px] overflow-auto">
              {isLoadingRepos ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading repositories...</span>
                </div>
              ) : (
                !loading && error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="font-medium text-red-800">GitHub Data Error</p>
                        <p className="text-sm text-red-600">{error}</p>
                        {error.includes("not found") && (
                          <p className="text-sm text-gray-600 mt-2">
                            Please ensure your GitHub username is correct in your profile settings.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {!loading && studentRepos.some(repo => repo.isEmptyRepo) && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <GitBranch className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="font-medium">Empty Repository</p>
                      <p className="text-sm text-gray-600">One or more GitHub repositories exist but don't have any commits yet.</p>
                    </div>
                  </div>
                </div>
              )}

              {studentRepos.length > 0 ? (
                studentRepos.map((repo, index) => (
                  <Accordion
                    type="single"
                    collapsible
                    className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md"
                    key={index}
                  >
                    <AccordionItem
                      value={`${index + 1}`}
                      className="border-b-0"
                    >
                      <AccordionTrigger className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col items-start text-left w-full">
                          <h3 className="font-semibold text-lg">
                            {repo.full_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                      <AccordionContent className="px-4 py-2">
                        {repo.commits.length > 0 ? (
                          <div className="space-y-4">
                            {repo.commits.map((commit, commitIndex) => (
                              <div
                                key={commitIndex}
                                className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm"
                                style={{
                                  '&:after': {
                                    content: '""',
                                    display: 'block',
                                    height: '1px',
                                    backgroundColor: 'gray',
                                    margin: '10px 0',
                                  },
                                }}
                              >
                                  <p className="font-medium text-lg mb-2">
                                    {commit.message}
                                  </p>
                                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                    <span>
                                      {new Date(commit.date).toLocaleDateString()}
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
                          <p className="text-gray-500 dark:text-gray-400">
                            No commits for this repository.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No Repositories found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Charts */}
        {/* Tracking Features */}
        {studentRepos.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
          <Card className="col-span-2">

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Commit Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex justify-center items-center h-[450px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="h-[450px]">
                  <CommitFrequencyChart data={commitFrequency} />
                </div>
              )}
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
              {isLoadingCharts ? (
                <div className="flex justify-center items-center h-[350px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="h-[350px]">
                  <LanguageUsageChart data={languageUsage} />
                </div>
              )}
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
              {isLoadingCharts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <MostActiveReposList repos={mostActiveRepos} />
              )}
            </CardContent>
          </Card>
        </div>
        )}

      </div>
    </Navbar>
  );
};

export default StudentDetailGit;

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
    .slice(0, 10); // Limit to top 10 languages

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

const GitHubMetrics = ({ stats }) => {
  console.log('Stats received in GitHubMetrics:', stats);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Public Repositories" 
        value={stats?.totalRepos || 0}
        icon={<GitBranch className="h-4 w-4 text-blue-500" />}
      />
      <StatCard 
        title="Total Stars" 
        value={stats?.totalStars || 0}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
      />
      <StatCard 
        title="Repository Forks" 
        value={stats?.totalForks || 0}
        icon={<GitBranch className="h-4 w-4 text-green-500" />}
      />
      <StatCard 
        title="Last Updated" 
        value={stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'N/A'}
        icon={<RefreshCw className="h-4 w-4 text-purple-500" />}
      />
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-sm text-gray-500">{title}</h3>
    </div>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const fetchStudentData = async (userId) => {
  const response = await api.get(`/user/${userId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch student details');
  }
  return response.data.user;
};

const fetchGithubRepos = async (userId) => {
  try {
    const response = await api.get(`/github/${userId}/repos`);
    if (!response.data.success) {
      throw new Error('Failed to fetch GitHub repositories');
    }
    return {
      success: true,
      repos: response.data.repos
    };
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    const is404 = error.response?.status === 404;
    return {
      success: false,
      error: is404 
        ? "GitHub username not found. Please verify the username in your profile."
        : (error.response?.data?.message || 'Failed to fetch GitHub repositories'),
      repos: []
    };
  }
};

const updateMetrics = async (userId, repos, leetcode) => {
  const response = await api.post(`/metrics/${userId}/update`, {
    repos,
    leetcode
  });
  if (!response.data.success) {
    throw new Error('Failed to update metrics');
  }
  return response.data.metrics;
};

const fetchGithubSummary = async (userId) => {
  try {
    // Try the first endpoint format
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
    try {
      // If the first endpoint fails, try the second format
      const fallbackResponse = await api.get(`/${userId}/summary`);
      if (!fallbackResponse.data.success) {
        throw new Error('Failed to fetch GitHub summary');
      }
      return {
        success: true,
        summary: fallbackResponse.data.summary,
        fromCache: fallbackResponse.data.fromCache
      };
    } catch (fallbackError) {
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
  }
};

const createDefaultProgressData = (metrics, repos, leetcode) => {
  // Create a basic progress data structure based on available GitHub metrics
  const totalCommits = metrics?.totalCommits || 0;
  const recentCommits = repos?.reduce((sum, repo) => {
    const recentCommits = repo.commits?.filter(commit => {
      const commitDate = new Date(commit.date);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return commitDate >= ninetyDaysAgo;
    }).length || 0;
    return sum + recentCommits;
  }, 0) || 0;
  
  // Calculate active days in the last 30 days
  const activeDaysSet = new Set();
  repos?.forEach(repo => {
    repo.commits?.forEach(commit => {
      const commitDate = new Date(commit.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (commitDate >= thirtyDaysAgo) {
        activeDaysSet.add(commitDate.toISOString().split('T')[0]);
      }
    });
  });
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakCount = 0;
  
  // Get all commit dates and sort them
  const allCommitDates = [];
  repos?.forEach(repo => {
    repo.commits?.forEach(commit => {
      allCommitDates.push(new Date(commit.date).toISOString().split('T')[0]);
    });
  });
  
  // Sort dates and count streaks
  if (allCommitDates.length > 0) {
    const uniqueDates = [...new Set(allCommitDates)].sort();
    let prevDate = null;
    
    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      
      if (prevDate) {
        const dayDiff = Math.floor((date - prevDate) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreakCount++;
        } else {
          currentStreakCount = 1;
        }
      } else {
        currentStreakCount = 1;
      }
      
      longestStreak = Math.max(longestStreak, currentStreakCount);
      prevDate = date;
    }
    
    // Check if the last commit was today or yesterday for current streak
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (lastDate.toISOString().split('T')[0] === today.toISOString().split('T')[0] ||
        lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      currentStreak = currentStreakCount;
    } else {
      currentStreak = 0;
    }
  }
  
  // Calculate weekly average
  const weeklyAverage = activeDaysSet.size > 0 ? Math.min(7, Math.round(activeDaysSet.size / 4)) : 0;
  
  return {
    codingActivity: {
      totalCommits: totalCommits,
      recentCommits: recentCommits,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      activeDaysLast30: activeDaysSet.size,
      weeklyAverage: weeklyAverage
    },
    repositories: {
      total: metrics?.totalRepos || 0,
      active: metrics?.activeRepos || 0,
      stars: metrics?.totalStars || 0,
      forks: metrics?.totalForks || 0
    },
    leetcode: leetcode?.completeProfile ? {
      totalSolved: leetcode.completeProfile.solvedProblem || 0,
      easySolved: leetcode.completeProfile.easySolved || 0,
      mediumSolved: leetcode.completeProfile.mediumSolved || 0,
      hardSolved: leetcode.completeProfile.hardSolved || 0,
      weeklyAverage: Math.round(Math.random() * 3) // Mock data
    } : null,
    improvement: {
      lastMonth: {
        commitIncrease: Math.round(Math.random() * 10 - 3), // Mock data
        activeDaysIncrease: Math.round(Math.random() * 4 - 1), // Mock data
        newRepos: Math.round(Math.random() * 2), // Mock data
        leetcodeIncrease: Math.round(Math.random() * 5) // Mock data
      }
    },
    trends: {
      commitTrend: "stable",
      activeDaysTrend: "slight increase",
      overallTrend: "stable"
    }
  };
};

const createDefaultClassAverageData = () => {
  return {
    github: {
      commits: {
        total: 45,
        weekly: 5
      },
      repositories: {
        total: 8,
        active: 3
      },
      consistency: {
        weeklyAverage: 3.5,
        longestStreak: 5
      }
    },
    leetcode: {
      problemsSolved: {
        total: 25,
        easy: 15,
        medium: 8,
        hard: 2
      }
    }
  };
};

const createDefaultComparisonData = () => {
  return {
    github: {
      commits: {
        total: 5, // 5% above average
        weekly: 10 // 10% above average
      },
      repositories: {
        active: -5 // 5% below average
      },
      consistency: {
        weeklyAverage: 15, // 15% above average
        streak: 0 // same as average
      }
    },
    leetcode: {
      problemsSolved: {
        total: 10, // 10% above average
        easy: 5,
        medium: 15,
        hard: 20
      }
    }
  };
};


