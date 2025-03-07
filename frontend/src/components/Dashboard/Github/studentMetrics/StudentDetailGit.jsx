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
import { Loader2 } from "lucide-react";
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
import DomainRecommendations from './DomainRecommendations';

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

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (dataFetched) return;
      
      try {
        setLoading(true);
        setError(null);

        const studentData = await fetchStudentData(userId);
        if (!isMounted) return;
        
        setStudent(studentData);
        setClassData(studentData.classId[0]);

        if (studentData.githubID) {
          // First fetch GitHub summary (fast)
          let githubSummary = { 
            totalRepos: 0, 
            totalCommits: 0, 
            activeRepos: 0,
            totalStars: 0,
            totalForks: 0
          };
          
          const summaryResult = await fetchGithubSummary(userId);
          if (!isMounted) return;
          
          if (summaryResult.success) {
            githubSummary = summaryResult.summary;
            console.log('Successfully fetched GitHub summary:', githubSummary);
            
            // Set metrics from summary immediately so we have some data to show
            setMetrics(githubSummary);
          }
          
          // Then fetch detailed repo data
          const result = await fetchGithubRepos(userId);
          if (!isMounted) return;
          
          if (result.success) {
            setStudentRepos(result.repos);
            
            if (result.repos.length > 0) {
              setCommitFrequency(processCommitFrequency(result.repos, startDate, endDate));
              setLanguageUsage(processLanguageUsage(result.repos));
              setMostActiveRepos(getMostActiveRepos(result.repos));
              
              // Use both detailed repos and summary data for metrics
              // If we have detailed repos, we can enhance the summary data
              const enhancedMetrics = {
                totalRepos: Math.max(githubSummary.totalRepos, result.repos.length),
                totalCommits: Math.max(
                  githubSummary.totalCommits, 
                  result.repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0)
                ),
                activeRepos: Math.max(
                  githubSummary.activeRepos,
                  result.repos.filter(repo => (repo.commits?.length || 0) > 0).length
                ),
                totalStars: Math.max(
                  githubSummary.totalStars,
                  result.repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
                ),
                totalForks: Math.max(
                  githubSummary.totalForks,
                  result.repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
                )
              };
              
              setMetrics(enhancedMetrics);
              
              // Update metrics on the server
              try {
                const metricsData = await updateMetrics(
                  userId, 
                  result.repos, 
                  studentData.leetCodeID ? await fetchLeetCodeData(userId) : null
                );
                if (!isMounted) return;
                // Only update if we got valid data back
                if (metricsData && Object.keys(metricsData).length > 0) {
                  setMetrics(metricsData);
                }
              } catch (metricsError) {
                console.error('Error updating metrics:', metricsError);
                // We already have metrics from summary, so we can continue
              }
            } else if (githubSummary.totalRepos > 0) {
              // If we have summary data but no detailed repos, use the summary
              setLanguageUsage({});
              setMostActiveRepos([]);
              setCommitFrequency([]);
              
              // Use the summary data we already set earlier
            } else {
              setError("No GitHub repositories found for this student.");
            }
          } else {
            // If detailed repo fetch fails but we have summary, use summary
            if (githubSummary.totalRepos > 0) {
              // We already set metrics from summary earlier, so no need to do it again
            } else {
              setError(result.error || "Failed to fetch GitHub data");
            }
          }
        } else {
          setError("Student does not have a GitHub username configured.");
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
        }
      }
    };

    console.log("Fetching all data for userId:", userId);
    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [userId, dataFetched, startDate, endDate]);

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
      
      const response = await api.get(`/github/${userId}/repos`, {
        params: { page, limit: 10 }
      });

      if (response.data.success) {
        setStudentRepos(prev => [...prev, ...response.data.repos]);
        setHasMoreRepos(page < response.data.pagination.totalPages);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          'Failed to fetch GitHub data';
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

  if (!student)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
        <p>Loading Awesome stuff...</p>
      </div>
    );
  const totalCommits = studentRepos.reduce(
    (sum, repo) => sum + (repo.commits ? repo.commits.length : 0),
    0
  );

  if (error) {
    return (
      <div className="error-container">
        <h3>Failed to load GitHub data</h3>
        <p>{error}</p>
        <button onClick={() => fetchGithubData(1)}>Retry</button>
      </div>
    );
  }

  return (
    <Navbar>
      <div className="container mx-auto p-6">
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
      
            </CardContent>
          </Card>

          <MessageStudent studentId={student._id} />

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
              <GitHubMetrics 
                repos={studentRepos} 
                summary={metrics} 
              />
            </CardContent>
          </Card>

          <DetailedStudentProgress 
            repos={studentRepos} 
            leetCode={studentLeetCode} 
          />
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
                  className="lucide lucide-code"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                LeetCode Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student?.leetCodeID ? (
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
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <DomainRecommendations languages={languageUsage} />
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
              {loading && (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading GitHub data...</span>
                </div>
              )}

              {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p>{error}</p>
                  </div>
                </div>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Commit Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* <div className="flex gap-4 mb-4">
      <input
        type="date"
        value={startDate ? startDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setStartDate(new Date(e.target.value))}
        className="border p-2 rounded"
      />
      <input
        type="date"
        value={endDate ? endDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setEndDate(new Date(e.target.value))}
        className="border p-2 rounded"
      />
      <button
        onClick={() => {
          setCommitFrequency(processCommitFrequency(studentRepos, startDate, endDate));
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Apply Filter
      </button>
    </div> */}
              <div className="h-[450px]">
                <CommitFrequencyChart data={commitFrequency} />
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
                <LanguageUsageChart data={languageUsage} />
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
              <MostActiveReposList repos={mostActiveRepos} />
            </CardContent>
          </Card>
        </div>
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

const GitHubMetrics = ({ repos, summary = null }) => {
  // Calculate metrics from repos if available, otherwise use summary
  const totalRepos = repos.length > 0 ? repos.length : (summary?.totalRepos || 0);
  const totalCommits = repos.length > 0 
    ? repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0) 
    : (summary?.totalCommits || 0);
  
  const totalStars = repos.length > 0
    ? repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
    : (summary?.totalStars || 0);
    
  const totalForks = repos.length > 0
    ? repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
    : (summary?.totalForks || 0);
  
  // Calculate activity metrics
  const activeRepos = repos.length > 0
    ? repos.filter(repo => (repo.commits?.length || 0) > 0).length
    : (summary?.activeRepos || 0);
    
  const recentActivity = repos.length > 0
    ? repos.filter(repo => {
        const lastPush = new Date(repo.pushed_at);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return lastPush > oneMonthAgo;
      }).length
    : (summary?.activeRepos || 0); // Use activeRepos as a fallback for recentActivity

  // For debugging
  console.log('GitHubMetrics rendering with:', { 
    reposLength: repos.length, 
    summary, 
    calculatedMetrics: {
      totalRepos,
      totalCommits,
      activeRepos,
      totalStars,
      totalForks,
      recentActivity
    }
  });

  // Calculate language distribution (only if we have detailed repos)
  const languages = repos.length > 0 ? repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {}) : {};

  // Calculate commit frequency (only if we have detailed repos)
  const commitsByMonth = repos.length > 0 ? repos.reduce((acc, repo) => {
    (repo.commits || []).forEach(commit => {
      const month = new Date(commit.date).toLocaleString('default', { month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
    });
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Repositories" value={totalRepos} />
        <StatCard title="Active Repositories" value={activeRepos} />
        <StatCard title="Total Commits" value={totalCommits} />
        <StatCard title="Recent Activity" value={`${recentActivity} repos`} />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Repository Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ProgressMetric 
                label="Active Repositories"
                value={activeRepos}
                total={Math.max(totalRepos, 1)} // Avoid division by zero
              />
              <ProgressMetric 
                label="Recent Activity"
                value={recentActivity}
                total={Math.max(totalRepos, 1)} // Avoid division by zero
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Stars Received</span>
                <span className="font-bold">{totalStars}</span>
              </div>
              <div className="flex justify-between">
                <span>Forks</span>
                <span className="font-bold">{totalForks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch GitHub repositories',
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

const LeetCodeSection = ({ leetcodeData }) => {
  if (!leetcodeData || !leetcodeData.completeProfile) {
    return null;
  }



  const { completeProfile, basicProfile, contests } = leetcodeData;
  const totalSolved = completeProfile.solvedProblem || 0;

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">LeetCode Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Problem Solving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Solved</span>
                <span className="font-bold">{totalSolved}</span>
              </div>
              <ProgressMetric 
                label="Easy" 
                value={completeProfile.easySolved || 0} 
                total={totalSolved}
                color="bg-green-500"
              />
              <ProgressMetric 
                label="Medium" 
                value={completeProfile.mediumSolved || 0} 
                total={totalSolved}
                color="bg-yellow-500"
              />
              <ProgressMetric 
                label="Hard" 
                value={completeProfile.hardSolved || 0} 
                total={totalSolved}
                color="bg-red-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Username</span>
                <span className="font-bold">{basicProfile.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Global Ranking</span>
                <span className="font-bold">{basicProfile.ranking?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Reputation</span>
                <span className="font-bold">{basicProfile.reputation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {leetcodeData.calender?.submissionCalendar && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(JSON.parse(leetcodeData.calender.submissionCalendar))
                      .map(([date, count]) => ({
                        date: new Date(parseInt(date) * 1000).toLocaleDateString(),
                        submissions: count
                      }))}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="submissions" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Add this function to fetch GitHub summary data
const fetchGithubSummary = async (userId) => {
  try {
    console.log(`Fetching GitHub summary for user: ${userId}`);
    const response = await api.get(`/github/${userId}/summary`);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch GitHub summary');
    }
    
    console.log('GitHub summary response:', response.data);
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

