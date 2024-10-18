import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '@/components/shared/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart as BarChartIcon, PieChart as PieChartIcon, ListOrdered } from "lucide-react";
import { LineChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, Cell } from "recharts";

const StudentDashboard = () => {
    const user = useSelector((state) => state.auth.user);
    const [studentRepos, setStudentRepos] = useState([]);
    const [studentLeetCode, setStudentLeetCode] = useState({});
    const [commitFrequency, setCommitFrequency] = useState([]);
    const [languageUsage, setLanguageUsage] = useState({});
    const [mostActiveRepos, setMostActiveRepos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const [reposResponse, leetCodeResponse] = await Promise.all([
                    api.get(`/${user._id}/repos`),
                    api.get(`lcodeprofile/${user._id}/`)
                ]);

                const { repos } = reposResponse.data;
                setStudentRepos(repos);
                setStudentLeetCode(leetCodeResponse.data);

                setCommitFrequency(processCommitFrequency(repos));
                setLanguageUsage(processLanguageUsage(repos));
                setMostActiveRepos(getMostActiveRepos(repos));
            } catch (error) {
                console.error("Error fetching student data:", error);
                toast.error("Failed to fetch your data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStudentData();
        }
    }, [user]);

    const processCommitFrequency = (repos) => {
        const commitCounts = {};
        repos.forEach((repo) => {
            repo.commits.forEach((commit) => {
                const date = new Date(commit.date.split("T")[0]);
                const dateString = date.toISOString().split("T")[0];
                commitCounts[dateString] = (commitCounts[dateString] || 0) + 1;
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
            .sort((a, b) => b.commits.length - a.commits.length)
            .slice(0, 5)
            .map((repo) => ({ name: repo.name, commitCount: repo.commits.length }));
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-screen'>
                <Loader2 className="mr-2 h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <Navbar>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Welcome, {user.firstName} {user.lastName}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>GitHub Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Total Repositories: {studentRepos.length}</p>
                            <p>Total Commits: {studentRepos.reduce((sum, repo) => sum + repo.commits.length, 0)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>LeetCode Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentLeetCode.completeProfile ? (
                                <>
                                    <p>Total Solved: {studentLeetCode.completeProfile.solvedProblem}</p>
                                    <p>Easy: {studentLeetCode.completeProfile.easySolved}</p>
                                    <p>Medium: {studentLeetCode.completeProfile.mediumSolved}</p>
                                    <p>Hard: {studentLeetCode.completeProfile.hardSolved}</p>
                                </>
                            ) : (
                                <p>No LeetCode data available</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChartIcon className="w-5 h-5" />
                                Commit Frequency
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <CommitFrequencyChart data={commitFrequency} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
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
                </div>

                <Card className="mt-8">
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

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListOrdered className="w-5 h-5" />
                            Your Repositories
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
                                    <AccordionItem value={`${index + 1}`} className="border-b-0">
                                        <AccordionTrigger className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex flex-col items-start text-left w-full">
                                                <h3 className="font-semibold text-lg">{repo.full_name}</h3>
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
                                                            <p className="font-medium text-lg mb-2">{commit.message}</p>
                                                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                                                <span>{new Date(commit.date).toLocaleDateString()}</span>
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
                            <p className="text-center text-gray-500">No repositories found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Navbar>
    );
};

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
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
        "#F06292", "#AED581", "#7986CB", "#9575CD", "#4DB6AC"
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
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
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
                            style={{ width: `${(repo.commitCount / repos[0].commitCount) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default StudentDashboard;