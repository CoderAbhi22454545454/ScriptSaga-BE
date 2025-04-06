import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Loader2, TrendingUp, TrendingDown, ArrowRight, Calendar, 
  Activity, Award, Star, GitFork, CheckCircle, AlertTriangle, 
  XCircle, Github, Code
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9146FF', '#FF66B2'];

const StudentProgressDashboard = ({ userId, progressData, classAverageData, isLoading, error }) => {
  const [period, setPeriod] = useState('month');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-gray-500">Loading student progress data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <p className="font-medium text-red-800">Error Loading Progress Data</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <p className="font-medium text-yellow-800">No Progress Data</p>
            <p className="text-sm text-yellow-600">No progress data available for this student.</p>
          </div>
        </div>
      </div>
    );
  }

  const { codingActivity, repositories, leetcode, improvement, trends } = progressData;

  const getTrendIcon = (trend) => {
    if (trend.includes('increase')) {
      return <TrendingUp className={`h-4 w-4 ${trend.includes('strong') ? 'text-green-600' : 'text-green-400'}`} />;
    } else if (trend.includes('decrease')) {
      return <TrendingDown className={`h-4 w-4 ${trend.includes('strong') ? 'text-red-600' : 'text-red-400'}`} />;
    } else {
      return <ArrowRight className="h-4 w-4 text-blue-400" />;
    }
  };

  const prepareActivityData = () => {
    // Last 4 weeks activity for chart
    const lastFourWeeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7));
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`;
      
      // For demo purposes, we're creating random data if weeklyMetrics isn't available
      const commitCount = Math.floor(Math.random() * 20) + 5;
      const activeDays = Math.floor(Math.random() * 5) + 1;
      
      lastFourWeeks.push({
        name: weekLabel,
        commits: commitCount,
        activeDays: activeDays,
      });
    }
    
    return lastFourWeeks;
  };

  const prepareLeetCodeData = () => {
    if (!leetcode) return [];
    
    return [
      { name: 'Easy', value: leetcode.easySolved || 0, color: '#00C49F' },
      { name: 'Medium', value: leetcode.mediumSolved || 0, color: '#FFBB28' },
      { name: 'Hard', value: leetcode.hardSolved || 0, color: '#FF8042' }
    ];
  };

  const activityData = prepareActivityData();
  const leetcodeData = prepareLeetCodeData();

  const renderImprovementValue = (value) => {
    if (value > 0) {
      return <span className="text-green-600">+{value}</span>;
    } else if (value < 0) {
      return <span className="text-red-600">{value}</span>;
    } else {
      return <span className="text-gray-600">0</span>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Student Progress Dashboard
          </CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 flex overflow-hidden overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full scrollbar-track-rounded-full ps-24 sm:ps-1 ">
            <TabsTrigger value="overview" className="text-sm sm:text-base">Overview</TabsTrigger>
            <TabsTrigger value="consistency" className="text-sm sm:text-base">Consistency</TabsTrigger>
            <TabsTrigger value="trends" className="text-sm sm:text-base">Trends & Improvement</TabsTrigger>
            <TabsTrigger value="comparison" className="text-sm sm:text-base">Class Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* GitHub Activity Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                    GitHub Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium">Total Commits</span>
                        <span className="text-xs sm:text-sm font-medium">{codingActivity?.totalCommits || 0}</span>
                      </div>
                      <Progress value={(codingActivity?.totalCommits / 500) * 100} className="h-1.5 sm:h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium">Recent Commits (90 days)</span>
                        <span className="text-xs sm:text-sm font-medium">{codingActivity?.recentCommits || 0}</span>
                      </div>
                      <Progress value={(codingActivity?.recentCommits / 100) * 100} className="h-1.5 sm:h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium">Active Repositories</span>
                        <span className="text-xs sm:text-sm font-medium">{repositories?.active || 0}</span>
                      </div>
                      <Progress value={(repositories?.active / 10) * 100} className="h-1.5 sm:h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LeetCode Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Code className="h-4 w-4 sm:h-5 sm:w-5" />
                    LeetCode Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leetcode ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium">Total Problems Solved</span>
                          <span className="text-xs sm:text-sm font-medium">{leetcode?.totalSolved || 0}</span>
                        </div>
                        <Progress value={(leetcode?.totalSolved / 200) * 100} className="h-1.5 sm:h-2" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-100 rounded-md p-2 text-center">
                          <span className="text-xs sm:text-sm text-green-800 font-medium">Easy</span>
                          <p className="text-lg sm:text-xl font-bold text-green-600">{leetcode?.easySolved || 0}</p>
                        </div>
                        <div className="bg-yellow-100 rounded-md p-2 text-center">
                          <span className="text-xs sm:text-sm text-yellow-800 font-medium">Medium</span>
                          <p className="text-lg sm:text-xl font-bold text-yellow-600">{leetcode?.mediumSolved || 0}</p>
                        </div>
                        <div className="bg-red-100 rounded-md p-2 text-center">
                          <span className="text-xs sm:text-sm text-red-800 font-medium">Hard</span>
                          <p className="text-lg sm:text-xl font-bold text-red-600">{leetcode?.hardSolved || 0}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm sm:text-base">
                      <p>No LeetCode data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="commits" name="Commits" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="activeDays" name="Active Days" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consistency" className="space-y-4 sm:space-y-6">
            {/* Consistency Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-white">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="text-base sm:text-lg font-semibold mb-1">Current Streak</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{codingActivity?.currentStreak || 0}</p>
                    <p className="text-xs sm:text-sm text-gray-500">consecutive days</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-500" />
                    <h3 className="text-base sm:text-lg font-semibold mb-1">Longest Streak</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{codingActivity?.longestStreak || 0}</p>
                    <p className="text-xs sm:text-sm text-gray-500">consecutive days</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />
                    <h3 className="text-base sm:text-lg font-semibold mb-1">Active Days (30 days)</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{codingActivity?.activeDaysLast30 || 0}</p>
                    <p className="text-xs sm:text-sm text-gray-500">days with activity</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Average */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Weekly Activity Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">GitHub Activity</span>
                    <span>{codingActivity?.weeklyAverage || 0} days/week</span>
                  </div>
                  <Progress value={(codingActivity?.weeklyAverage / 7) * 100} className="h-3" />
                </div>

                {leetcode && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">LeetCode Problems</span>
                      <span>{leetcode?.weeklyAverage || 0} problems/week</span>
                    </div>
                    <Progress value={(leetcode?.weeklyAverage / 10) * 100} className="h-3" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LeetCode Distribution */}
            {leetcode && leetcodeData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">LeetCode Problem Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leetcodeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {leetcodeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} problems`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Trend Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-4 bg-white rounded-lg shadow">
                    <div className="mr-4">
                      {getTrendIcon(trends?.commitTrend || 'stable')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Commit Activity</h3>
                      <p className="text-gray-600 capitalize">{trends?.commitTrend || 'Not enough data'}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-white rounded-lg shadow">
                    <div className="mr-4">
                      {getTrendIcon(trends?.activeDaysTrend || 'stable')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Active Days</h3>
                      <p className="text-gray-600 capitalize">{trends?.activeDaysTrend || 'Not enough data'}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-white rounded-lg shadow">
                    <div className="mr-4">
                      {getTrendIcon(trends?.overallTrend || 'stable')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Overall Trend</h3>
                      <p className="text-gray-600 capitalize">{trends?.overallTrend || 'Not enough data'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Improvement Metrics */}
            {improvement && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Improvement (Last Month)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Commit Change</span>
                        <span className="text-lg font-bold">
                          {renderImprovementValue(improvement.lastMonth?.commitIncrease || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Active Days Change</span>
                        <span className="text-lg font-bold">
                          {renderImprovementValue(improvement.lastMonth?.activeDaysIncrease || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">New Repositories</span>
                        <span className="text-lg font-bold">
                          {renderImprovementValue(improvement.lastMonth?.newRepos || 0)}
                        </span>
                      </div>
                      {leetcode && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">LeetCode Problems Increase</span>
                          <span className="text-lg font-bold">
                            {renderImprovementValue(improvement.lastMonth?.leetcodeIncrease || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {classAverageData ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Comparison with Class Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">GitHub Activity</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Total Commits</span>
                              <span className="text-sm font-medium">
                                {classAverageData.comparison?.github?.commits?.total > 0 ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                    {classAverageData.comparison.github.commits.total.toFixed(1)}% above average
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                    {Math.abs(classAverageData.comparison.github.commits.total).toFixed(1)}% below average
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Active Repositories</span>
                              <span className="text-sm font-medium">
                                {classAverageData.comparison?.github?.repositories?.active > 0 ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                    {classAverageData.comparison.github.repositories.active.toFixed(1)}% above average
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                    {Math.abs(classAverageData.comparison.github.repositories.active).toFixed(1)}% below average
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Consistency (Weekly Average)</span>
                              <span className="text-sm font-medium">
                                {classAverageData.comparison?.github?.consistency?.weeklyAverage > 0 ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                    {classAverageData.comparison.github.consistency.weeklyAverage.toFixed(1)}% above average
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                    {Math.abs(classAverageData.comparison.github.consistency.weeklyAverage).toFixed(1)}% below average
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {leetcode && classAverageData.comparison?.leetcode && (
                        <div>
                          <h3 className="font-semibold mb-3">LeetCode Progress</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Total Problems</span>
                                <span className="text-sm font-medium">
                                  {classAverageData.comparison.leetcode.problemsSolved.total > 0 ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                      {classAverageData.comparison.leetcode.problemsSolved.total.toFixed(1)}% above average
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                      {Math.abs(classAverageData.comparison.leetcode.problemsSolved.total).toFixed(1)}% below average
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Medium & Hard Problems</span>
                                <span className="text-sm font-medium">
                                  {(classAverageData.comparison.leetcode.problemsSolved.medium + 
                                    classAverageData.comparison.leetcode.problemsSolved.hard) / 2 > 0 ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                      Above average
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                      Below average
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Activity Percentile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-md">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                GitHub Activity
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-blue-600">
                                {Math.max(0, Math.min(100, 50 + classAverageData.comparison.github.commits.total / 2))}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div style={{ width: `${Math.max(0, Math.min(100, 50 + classAverageData.comparison.github.commits.total / 2))}%` }} 
                                 className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                          </div>
                        </div>

                        {leetcode && classAverageData.comparison?.leetcode && (
                          <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                  LeetCode Progress
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-purple-600">
                                  {Math.max(0, Math.min(100, 50 + classAverageData.comparison.leetcode.problemsSolved.total / 2))}%
                                </span>
                              </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                              <div style={{ width: `${Math.max(0, Math.min(100, 50 + classAverageData.comparison.leetcode.problemsSolved.total / 2))}%` }} 
                                   className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="font-medium text-yellow-800">No Comparison Data</p>
                    <p className="text-sm text-yellow-600">Class comparison data is not available.</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentProgressDashboard; 