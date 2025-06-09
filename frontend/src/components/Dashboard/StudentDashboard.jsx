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
import { Bell, BookOpen, ExternalLink, CheckCircle, Clock, AlertTriangle, ClipboardCopy, RefreshCw, TrendingUp, Brain, Database, Globe, Server } from 'lucide-react';
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
  GitCommit,
  Star,
  Code,
  Target,
  Trophy,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ImprovementSuggestions from './Github/studentMetrics/ImprovementSuggestions';
import DomainRecommendations from './Github/studentMetrics/DomainRecommendations';
import LearningResources from './Github/studentMetrics/LearningResources';
import CareerRoadmap from './Github/studentMetrics/CareerRoadmap';
import { getDomainSuggestions } from '@/utils/domainSuggestions';
import { Input } from "@/components/ui/input";

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

const ProgressTimeline = ({ studentRepos, studentLeetCode }) => {
  const milestones = [];
  
  // Add GitHub milestones
  if (studentRepos.length > 0) {
    const firstCommit = new Date(Math.min(...studentRepos.flatMap(repo => 
      repo.commits.map(commit => new Date(commit.date))
    )));
    
    milestones.push({
      date: firstCommit,
      title: "First GitHub Commit",
      description: "Started contributing to repositories",
      icon: <GitCommit className="h-5 w-5" />,
      type: "github"
    });

    const firstStar = studentRepos.find(repo => repo.stargazers_count > 0);
    if (firstStar) {
      milestones.push({
        date: new Date(firstStar.created_at),
        title: "First Starred Repository",
        description: "Received first star on a repository",
        icon: <Star className="h-5 w-5" />,
        type: "github"
      });
    }
  }

  // Add LeetCode milestones
  if (studentLeetCode?.completeProfile) {
    const { easySolved, mediumSolved, hardSolved } = studentLeetCode.completeProfile;
    
    if (easySolved > 0) {
      milestones.push({
        date: new Date(),
        title: "First Easy Problem Solved",
        description: `Solved ${easySolved} easy problems`,
        icon: <Code className="h-5 w-5" />,
        type: "leetcode"
      });
    }

    if (mediumSolved > 0) {
      milestones.push({
        date: new Date(),
        title: "First Medium Problem Solved",
        description: `Solved ${mediumSolved} medium problems`,
        icon: <Target className="h-5 w-5" />,
        type: "leetcode"
      });
    }

    if (hardSolved > 0) {
      milestones.push({
        date: new Date(),
        title: "First Hard Problem Solved",
        description: `Solved ${hardSolved} hard problems`,
        icon: <Trophy className="h-5 w-5" />,
        type: "leetcode"
      });
    }
  }

  // Sort milestones by date
  milestones.sort((a, b) => b.date - a.date);

  return (
    <div className="relative h-[400px] overflow-y-auto pr-4">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
      {milestones.map((milestone, index) => (
        <div key={index} className="relative pl-12 pb-8 last:pb-0">
          <div className="absolute left-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-4 border-blue-500 flex items-center justify-center">
            {milestone.icon}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{milestone.title}</h3>
              <Badge variant={milestone.type === "github" ? "default" : "secondary"}>
                {milestone.type === "github" ? "GitHub" : "LeetCode"}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {milestone.date.toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
      {milestones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No milestones yet. Start contributing to see your progress!</p>
        </div>
      )}
    </div>
  );
};

const SkillAssessment = ({ studentRepos, studentLeetCode }) => {
  const calculateSkillLevel = (metrics) => {
    const {
      commits,
      activeDays,
      problemSolved,
      problemDifficulty,
      repoCount,
      starCount
    } = metrics;

    // Weighted scoring system
    const commitScore = Math.min(commits / 200, 1) * 0.2;
    const activityScore = Math.min(activeDays / 30, 1) * 0.2;
    const problemScore = Math.min(problemSolved / 100, 1) * 0.3;
    const difficultyScore = Math.min(problemDifficulty / 50, 1) * 0.2;
    const repoScore = Math.min(repoCount / 10, 1) * 0.05;
    const starScore = Math.min(starCount / 20, 1) * 0.05;

    return Math.round((commitScore + activityScore + problemScore + difficultyScore + repoScore + starScore) * 100);
  };

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
                {skillLevel}%
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

const LearningPathRecommendations = ({ studentRepos, studentLeetCode }) => {
  // ... LearningPathRecommendations component code ...
};

// Add this new component for the student profile section
const StudentProfileSection = ({ student, githubStats, onEditGithubId }) => {
  const getActivityStatus = () => {
    const commitsPerWeek = (githubStats.totalCommits || 0) / 4; // Last month's average
    if (commitsPerWeek >= 10) return { label: 'Very Active', color: 'bg-green-100 text-green-800' };
    if (commitsPerWeek >= 5) return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
    if (commitsPerWeek >= 2) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Less Active', color: 'bg-red-100 text-red-800' };
  };

  const activityStatus = getActivityStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Profile Info - Takes 5 columns */}
      <div className="md:col-span-5">
        <Card className="h-full">
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
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{student?.firstName} {student?.lastName}</h3>
                  <p className="text-gray-500">{student?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={activityStatus.color}>
                      {activityStatus.label}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-0">
                      Student
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Year of Study</p>
                  <p className="font-medium">{student?.classId?.[0]?.className}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium">{student?.classId?.[0]?.branch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Division</p>
                  <p className="font-medium">{student?.classId?.[0]?.division}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Roll No</p>
                  <p className="font-medium">{student?.rollNo || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats - Takes 7 columns */}
      <div className="md:col-span-7">
        <Card className="h-full">
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
                className="lucide lucide-activity"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Development Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitHub Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">GitHub Profile</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-600"
                      >
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                      <span className="font-medium">{student?.githubID}</span>
                      <button
                        onClick={onEditGithubId}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Repository Activity</span>
                      <span className="font-medium">{githubStats.activeRepos}/{githubStats.totalRepos} active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(githubStats.activeRepos / Math.max(githubStats.totalRepos, 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Contribution Level</span>
                      <span className="font-medium">{githubStats.totalCommits} commits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((githubStats.totalCommits / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Project Impact</span>
                      <span className="font-medium">{githubStats.totalStars} stars</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min((githubStats.totalStars / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Summary */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <GitCommit className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Latest Commit</p>
                      <p className="text-xs text-gray-500">
                        {githubStats.lastCommitDate ? new Date(githubStats.lastCommitDate).toLocaleDateString() : 'No recent commits'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Active Projects</p>
                      <p className="text-xs text-gray-500">{githubStats.activeRepos} repositories updated recently</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Star className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Project Recognition</p>
                      <p className="text-xs text-gray-500">{githubStats.totalStars} stars received</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
    totalRepos: 0,
    activeRepos: 0,
    totalStars: 0,
    totalForks: 0,
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
  const [dataFetched, setDataFetched] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [isLoadingGithubSummary, setIsLoadingGithubSummary] = useState(true);
  const [isLoadingLeetCode, setIsLoadingLeetCode] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [classAverageData, setClassAverageData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    if (!user?._id || (dataFetched && !forceRefresh)) return;

    try {
      setLoading(true);
      setIsLoadingStudent(true);
      setIsLoadingGithubSummary(true);
      setIsLoadingLeetCode(true);
      setIsLoadingCharts(true);
      setError(null);

      // Try to get student data from cache first
      const cacheKey = `student_data_${user._id}`;
      let studentData = !forceRefresh ? getCachedData(cacheKey) : null;
      
      if (!studentData) {
        // If not in cache or force refresh, fetch from API
        const response = await api.get(`/user/${user._id}`);
        studentData = response.data.user;
        
        // Cache the result
        setCachedData(cacheKey, studentData);
      }
      
      setStudentData({
        student: studentData,
        classData: studentData.classId?.[0] || null,
        repos: [],
        leetCode: null
      });
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
        const summaryCacheKey = `github_summary_${user._id}`;
        const cachedSummary = !forceRefresh ? getCachedData(summaryCacheKey) : null;
        
        if (cachedSummary) {
          githubSummary = cachedSummary;
          console.log('Using cached GitHub summary:', githubSummary);
        } else {
          const summaryResult = await api.get(`/github/${user._id}/summary`);
          if (summaryResult.data.success) {
            githubSummary = summaryResult.data.summary;
            console.log('Successfully fetched GitHub summary:', githubSummary);
            
            // Cache the result
            setCachedData(summaryCacheKey, githubSummary);
          }
        }
        
        setGithubStats(prev => ({
          ...prev,
          totalRepos: githubSummary.totalRepos || 0,
          totalCommits: githubSummary.totalCommits || 0,
          activeRepos: githubSummary.activeRepos || 0,
          totalStars: githubSummary.totalStars || 0,
          totalForks: githubSummary.totalForks || 0
        }));
        setIsGithubConnected(true);
        setIsLoadingGithubSummary(false);
        
        // Then fetch detailed repo data
        const reposCacheKey = `github_repos_${user._id}`;
        let reposData = !forceRefresh ? getCachedData(reposCacheKey) : null;
        
        if (!reposData) {
          const reposResponse = await api.get(`/github/${user._id}/repos`);
          if (reposResponse.data.success) {
            reposData = reposResponse.data.repos;
            // Cache the result
            setCachedData(reposCacheKey, reposData);
          }
        }
        
        setStudentRepos(reposData);
        
        if (reposData.length > 0) {
          const processedStats = {
            commitFrequency: processCommitFrequency(reposData),
            languageUsage: processLanguageUsage(reposData),
            mostActiveRepos: getMostActiveRepos(reposData),
            totalCommits: githubSummary.totalCommits || reposData.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0),
            totalRepos: githubSummary.totalRepos || reposData.length,
            activeRepos: githubSummary.activeRepos || reposData.filter(repo => repo.commits?.length > 0).length,
            totalStars: githubSummary.totalStars || reposData.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
            totalForks: githubSummary.totalForks || reposData.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
            detailedMetrics: calculateGitHubMetrics(reposData, githubSummary)
          };
          
          setGithubStats(processedStats);
          setCommitFrequency(processedStats.commitFrequency);
          setLanguageUsage(processedStats.languageUsage);
          setMostActiveRepos(processedStats.mostActiveRepos);
          setIsLoadingCharts(false);
        } else {
          setGithubStats(prev => ({
            ...prev,
            totalRepos: githubSummary.totalRepos || 0,
            totalCommits: githubSummary.totalCommits || 0,
            activeRepos: githubSummary.activeRepos || 0
          }));
        }
      } else {
        setGithubError("GitHub username not configured");
        setIsGithubConnected(false);
      }

      // Fetch LeetCode data with caching
      if (studentData.leetCodeID) {
        const leetCodeCacheKey = `leetcode_data_${user._id}`;
        let leetCodeData = !forceRefresh ? getCachedData(leetCodeCacheKey) : null;
        
        if (!leetCodeData) {
          const leetCodeResponse = await api.get(`/lcodeprofile/${user._id}`);
          leetCodeData = leetCodeResponse.data;
          if (leetCodeData) {
            setCachedData(leetCodeCacheKey, leetCodeData);
          }
        }
        
        setStudentLeetCode(leetCodeData);
        setIsLoadingLeetCode(false);
      }

      // Fetch assignments with caching
      const assignmentsCacheKey = `assignments_${user._id}`;
      let assignmentsData = !forceRefresh ? getCachedData(assignmentsCacheKey) : null;

      if (!assignmentsData) {
        const assignmentsResponse = await api.get(`/assignment/student/${user._id}`);
        assignmentsData = assignmentsResponse.data.assignments || [];
        setCachedData(assignmentsCacheKey, assignmentsData);
      }

      setAssignments(assignmentsData);
      setAssignmentsLoading(false);

      // Fetch notifications with caching
      const notificationsCacheKey = `notifications_${user._id}`;
      let notificationsData = !forceRefresh ? getCachedData(notificationsCacheKey) : null;

      if (!notificationsData) {
        try {
          const notificationsResponse = await api.get(`/user/notifications/${user._id}`);
          notificationsData = notificationsResponse.data.notifications || [];
          setCachedData(notificationsCacheKey, notificationsData);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          notificationsData = [];
        }
      }

      setNotifications(notificationsData);
      setNotificationsLoading(false);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setDataFetched(true);
      setForceRefresh(false);
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

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      setForceRefresh(true);
      toast.info("Refreshing data...");
      await fetchAllData();
    } finally {
      setIsRefreshing(false);
      setForceRefresh(false);
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
        <div className="flex justify-end mb-4">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            className="w-32 h-10 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
          </Button>
        </div>

        {/* Replace the old Student Information and GitHub Statistics sections */}
        <StudentProfileSection
          student={studentData.student}
          githubStats={githubStats}
          onEditGithubId={() => {
            setIsEditingGithubId(true);
            setNewGithubId(studentData.student?.githubID || "");
          }}
        />

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
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <StudentNotifications 
                  notifications={notifications.map(notification => {
                    // Get teacher name safely from the populated teacher object
                    const teacherName = notification.teacher 
                      ? `${notification.teacher.firstName || ''} ${notification.teacher.lastName || ''}`.trim() || 'Teacher'
                      : 'Teacher';

                    // Get class name safely
                    const className = notification.class?.name 
                      || studentData.student?.classId?.[0]?.className 
                      || notification.className 
                      || 'Class';

                    return {
                      ...notification,
                      teacherName,
                      className,
                      date: notification.createdAt || notification.date || new Date(),
                      type: notification.type || 'Teacher Feedback'
                    };
                  })} 
                />
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
              {isLoadingCharts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <MostActiveReposList repos={githubStats?.mostActiveRepos || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Progress Timeline */}
        <div className="mt-6 sm:mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                Progress Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ProgressTimeline 
                  studentRepos={studentRepos} 
                  studentLeetCode={studentLeetCode} 
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Skill Assessment */}
        <div className="mt-6 sm:mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                Skill Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <SkillAssessment 
                  studentRepos={studentRepos} 
                  studentLeetCode={studentLeetCode} 
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Learning Path Recommendations */}
        {githubStats.languageUsage && Object.keys(githubStats.languageUsage).length > 0 && (
          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                  Learning Path Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCharts ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <LearningPathRecommendations 
                    studentRepos={studentRepos} 
                    studentLeetCode={studentLeetCode} 
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
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

const MostActiveReposList = ({ repos = [] }) => {
  if (!repos || repos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No active repositories found
      </div>
    );
  }

  return (
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
};
