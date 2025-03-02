import { StudentMetrics } from '../models/studentMetrics.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { calculateGitHubMetrics, calculateLeetCodeMetrics } from '../services/metrics.service.js';

export const updateMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { repos, leetcode } = req.body;

    const githubMetrics = calculateGitHubMetrics(repos);
    const leetcodeMetrics = calculateLeetCodeMetrics(leetcode);

    const metrics = await StudentMetrics.findOneAndUpdate(
      { userId },
      {
        userId,
        github: {
          repositories: {
            total: repos?.length || 0,
            active: repos?.filter(r => r.commits?.length > 0).length || 0,
            recentlyActive: githubMetrics.raw.recentActivity.repositories.size
          },
          commits: {
            total: repos?.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0) || 0,
            recent90Days: githubMetrics.raw.recentActivity.commits
          },
          activity: {
            score: githubMetrics.scores.activity,
            activeDays: Array.from(githubMetrics.raw.recentActivity.activeDays),
            activeRepos: Array.from(githubMetrics.raw.recentActivity.repositories),
            lastCommitDate: new Date()
          },
          codeQuality: {
            score: githubMetrics.scores.quality,
            commitPatterns: githubMetrics.raw.codeQuality
          },
          impact: {
            score: githubMetrics.scores.impact,
            stars: githubMetrics.raw.impact.totalStars,
            forks: githubMetrics.raw.impact.totalForks
          },
          languages: processLanguages(repos),
          careerInsights: githubMetrics.careerInsights,
          suggestions: githubMetrics.suggestions
        },
        leetcode: leetcodeMetrics?.raw || null,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating metrics',
      error: error.message
    });
  }
};

const processLanguages = (repos) => {
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(languages).map(([name, repoCount]) => ({
    name,
    repoCount,
    percentage: (repoCount / repos.length) * 100
  }));
};

export const getStudentMetrics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        success: false
      });
    }

    const metrics = await StudentMetrics.findOne({ userId });
    if (!metrics) {
      return res.status(404).json({
        message: 'No metrics found for this user',
        success: false
      });
    }

    res.status(200).json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Metrics Fetch Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics',
      error: error.message
    });
  }
};