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

const StudentDetailGit = () => {
  const { userId } = useParams();
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [studentResponse, studentLeetCodeResponse] = await Promise.all([
          api.get(`/user/${userId}`),
          api.get(`lcodeprofile/${userId}/`),
        ]);

        const student = studentResponse.data.user;
        setStudent(student);

        const studentLeetRepos = studentLeetCodeResponse.data;
        setStudentLeetCode(studentLeetRepos);

        if (student.classId) {
          const classResponse = await api.get("/class/classes");
          const classes = classResponse.data.classes;
          const studentClass = classes.find(
            (cls) => cls._id === student.classId
          );
          setClassData(studentClass);
        }

        // Fetch initial repositories
        fetchRepositories();
      } catch (error) {
        console.error("Error fetching student details:", error);
        toast.error("Failed to fetch student details. Please try again.");
      }
    };

    fetchStudentData();
  }, [userId]);

  useEffect(() => {
    fetchRepositories();
  }, [userId]);

  const fetchRepositories = async () => {
    try {
      console.log("Fetching repositories for userId:", userId);
      const response = await api.get(`/${userId}/repos`);
      console.log("API response:", response.data);
      const { repos } = response.data;
      setStudentRepos(repos);
      setHasMoreRepos(false);

      // Process data for tracking features
      setCommitFrequency(processCommitFrequency(repos, startDate, endDate));
      setLanguageUsage(processLanguageUsage(repos));
      setMostActiveRepos(getMostActiveRepos(repos));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories. Please try again.");
    }
  };
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

  if (!student) return <h4>Loading....</h4>;
  const totalCommits = studentRepos.reduce(
    (sum, repo) => sum + (repo.commits ? repo.commits.length : 0),
    0
  );

  return (
    <Navbar>
      <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
  <Card>
    <CardHeader>
      <CardTitle className="text-2xl flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Student Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <p className="text-lg">
          <span className="font-semibold">Name:</span> {student.firstName || 'No data'} {student.lastName}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {student.email || "No Data"}
        </p>
        <p>
          <span className="font-semibold">Year of Study:</span> {classData?.yearOfStudy || "No class found"}
        </p>
        <p>
          <span className="font-semibold">Branch:</span> {classData?.branch || "No class found"}
        </p>
        <p>
          <span className="font-semibold">Division:</span> {classData?.division || "No class found"}
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        GitHub Stats
      </CardTitle>
      <p className="text-sm text-muted-foreground">All Time Stats</p>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <p className="text-lg font-medium mb-2">Total Repositories</p>
          <p className="text-3xl font-bold">{studentRepos.length}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <p className="text-lg font-medium mb-2">Total Commits</p>
          <p className="text-3xl font-bold">{totalCommits || 0}</p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
          <p className="text-lg font-medium mb-2">Total Stars</p>
          <p className="text-3xl font-bold">
            {studentRepos.reduce(
              (sum, repo) => sum + repo.stargazers_count,
              0
            )}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <img
                  src="https://cdn.iconscout.com/icon/free/png-512/free-leetcode-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-vol-4-pack-logos-icons-2944960.png"
                  alt="LeetCode"
                  className="w-8 h-8"
                />
                LeetCode Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentLeetCode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Username
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {studentLeetCode.basicProfile.username ?? "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ranking
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {studentLeetCode.basicProfile.ranking ?? "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Contests Attended
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {studentLeetCode.contests.contestAttend ?? "0"}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Badges Count
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {studentLeetCode.badges.badgesCount ?? "0"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Badges</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {studentLeetCode.badges.badges.map((badge, key) => (
                        <div
                          key={key}
                          className="flex items-center space-x-2 bg-white dark:bg-gray-700 p-2 rounded-md"
                        >
                          <img
                            src={badge.icon}
                            alt={badge.displayName}
                            className="w-8 h-8"
                          />
                          <span className="text-sm">{badge.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Problem Solving
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Total Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentLeetCode.completeProfile.solvedProblem || "0"}
                        </p>
                      </div>
                      <div className="bg-green-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Easy Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentLeetCode.completeProfile.easySolved || "0"}
                        </p>
                      </div>
                      <div className="bg-yellow-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Medium Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentLeetCode.completeProfile.mediumSolved || "0"}
                        </p>
                      </div>
                      <div className="bg-red-500 text-white p-4 rounded-lg">
                        <p className="text-sm font-medium">Hard Solved</p>
                        <p className="text-2xl font-bold mt-1">
                          {studentLeetCode.completeProfile.hardSolved || "0"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No LeetCode Data Available
                </p>
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
            <CardContent className="max-h-[470px] overflow-auto">
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
      <PieChart className="w-5 h-5" />
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

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581', '#7986CB', '#9575CD', '#4DB6AC'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
