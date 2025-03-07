import { StudentMetrics } from '../models/studentMetrics.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { calculateGitHubMetrics, calculateLeetCodeMetrics } from '../services/metrics.service.js';

export const updateMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { repos, leetcode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID format', 
        success: false 
      });
    }

    // Check if metrics already exist
    let existingMetrics = await StudentMetrics.findOne({ userId });
    
    const githubMetrics = calculateGitHubMetrics(repos);
    const leetcodeMetrics = calculateLeetCodeMetrics(leetcode);

    const metricsData = {
      userId,
      github: {
        repositories: {
          total: repos?.length || 0,
          active: repos?.filter(r => r.commits?.length > 0).length || 0,
          recentlyActive: githubMetrics.raw.recentActivity.repositories.size || 0
        },
        commits: {
          total: repos?.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0) || 0,
          recent90Days: githubMetrics.raw.recentActivity.commits || 0
        },
        activity: {
          score: githubMetrics.scores.activity || 0,
          activeDays: Array.from(githubMetrics.raw.recentActivity.activeDays || [])
        },
        impact: {
          score: githubMetrics.scores.impact || 0,
          stars: githubMetrics.raw.impact.totalStars || 0,
          forks: githubMetrics.raw.impact.totalForks || 0
        }
      },
      leetcode: leetcodeMetrics ? {
        problemsSolved: {
          total: leetcodeMetrics.problemSolving?.total || 0,
          easy: leetcodeMetrics.problemSolving?.easy || 0,
          medium: leetcodeMetrics.problemSolving?.medium || 0,
          hard: leetcodeMetrics.problemSolving?.hard || 0
        },
        ranking: leetcodeMetrics.consistency?.ranking || 0
      } : null,
      lastUpdated: new Date()
    };

    if (existingMetrics) {
      // Update existing metrics
      existingMetrics = await StudentMetrics.findOneAndUpdate(
        { userId },
        metricsData,
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Metrics updated successfully',
        metrics: existingMetrics
      });
    } else {
      // Create new metrics
      const newMetrics = await StudentMetrics.create(metricsData);
      
      return res.status(201).json({
        success: true,
        message: 'Metrics created successfully',
        metrics: newMetrics
      });
    }
  } catch (error) {
    console.error('Metrics Error:', error);
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