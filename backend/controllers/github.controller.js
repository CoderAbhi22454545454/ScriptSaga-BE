import { getGithubUserRepos, getGithubRepoCommits } from "../services/github.service.js";
import { User } from "../models/user.model.js";
import mongoose from 'mongoose';
import axios from 'axios';
import { GithubData } from '../models/githubData.model.js';
import dotenv from 'dotenv';

dotenv.config();

const GitHub_BaseURL = "https://api.github.com";

const token = process.env.GITHUB_TOKEN;

console.log('Controller Token:', process.env.GITHUB_TOKEN ? 'Token exists' : 'No token found');

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
})

const MAX_PER_PAGE = 100; // GitHub's maximum items per page
const MAX_CONCURRENT_REQUESTS = 10; // Increased batch size for better performance

export const getStudentReposWithCommits = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || MAX_PER_PAGE;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID format', 
        success: false 
      });
    }

    const user = await User.findById(userId);
    if (!user?.githubID) {
      return res.status(404).json({ 
        message: "User not found or GitHub ID not set", 
        success: false 
      });
    }

    let githubData = await GithubData.findOne({ userId });
    const needsUpdate = !githubData || 
                       !githubData.repos ||
                       githubData.repos.length === 0 ||
                       Date.now() - githubData.lastUpdated > 24 * 60 * 60 * 1000;

    // If we have cached data and it's recent, use it
    if (githubData && !needsUpdate) {
      // Paginate the cached repos
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedRepos = githubData.repos.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        repos: paginatedRepos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(githubData.repos.length / limit),
          totalRepos: githubData.repos.length,
          itemsPerPage: limit
        },
        fromCache: true
      });
    }

    // If we need to update, fetch from GitHub API
    try {
      // Get all repos with maximum items per page
      const allRepos = await getGithubUserRepos(user.githubID, MAX_PER_PAGE);
      
      // Process repos in larger batches
      const reposWithCommits = [];
      for (let i = 0; i < allRepos.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = allRepos.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchPromises = batch.map(repo => 
          getAllCommitsForRepo(user.githubID, repo.name)
            .catch(err => ({ commits: [] }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        reposWithCommits.push(...batch.map((repo, idx) => ({
          ...repo,
          commits: batchResults[idx].commits
        })));
      }

      // Update or create GitHub data
      githubData = await GithubData.findOneAndUpdate(
        { userId },
        { 
          userId,
          githubId: user.githubID,
          repos: reposWithCommits,
          lastUpdated: Date.now()
        },
        { upsert: true, new: true }
      );

      // Paginate the repos we just fetched instead of making another API call
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedRepos = reposWithCommits.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        repos: paginatedRepos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(reposWithCommits.length / limit),
          totalRepos: reposWithCommits.length,
          itemsPerPage: limit
        },
        fromCache: false
      });
    } catch (error) {
      console.error('GitHub API Error:', error);
      
      // If we have existing data, return it despite the error
      if (githubData && githubData.repos) {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedRepos = githubData.repos.slice(startIndex, endIndex);
        
        return res.status(200).json({
          success: true,
          repos: paginatedRepos,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(githubData.repos.length / limit),
            totalRepos: githubData.repos.length,
            itemsPerPage: limit
          },
          message: "Using cached data due to API error",
          fromCache: true
        });
      }
      
      return res.status(503).json({
        message: `GitHub API Error: ${error.message}`,
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

// Helper function to get all commits for a repository
const getAllCommitsForRepo = async (githubID, repoName) => {
  try {
    const result = await getGithubRepoCommits(githubID, repoName);
    
    // If there was an error but we handled it gracefully
    if (!result.success) {
      console.log(`Error fetching commits for ${repoName}: ${result.error}`);
      return { commits: [], error: result.error };
    }
    
    // If it's an empty repository
    if (result.isEmptyRepo) {
      console.log(`Repository ${repoName} is empty.`);
      return { commits: [], isEmptyRepo: true };
    }
    
    return { commits: result.commits };
  } catch (error) {
    console.error(`Error fetching commits for ${repoName}:`, error);
    return { commits: [] };
  }
};

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttlSeconds) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

export const getStudentGitHubSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format', success: false });
    }

    const user = await User.findById(userId);
    if (!user?.githubID) {
      return res.status(404).json({ message: "User not found or GitHub ID not set", success: false });
    }

    console.log(`Fetching GitHub summary for user: ${user.githubID}`);

    // Check if we have cached summary data
    let githubData = await GithubData.findOne({ userId });
    const needsUpdate = !githubData || 
                       !githubData.summary ||
                       Date.now() - githubData.lastUpdated > 24 * 60 * 60 * 1000;

    // If we have cached data and it's recent, return it immediately
    if (githubData && !needsUpdate && githubData.summary.totalRepos > 0) {
      console.log(`Returning cached GitHub summary for ${user.githubID}`);
      return res.status(200).json({
        success: true,
        summary: githubData.summary || {},
        fromCache: true
      });
    }

    // If we need to update, fetch from GitHub API
    try {
      console.log(`Fetching fresh GitHub data for ${user.githubID}`);
      
      // Get user profile first to get accurate repo count
      const userProfileResponse = await githubApi.get(`/users/${user.githubID}`);
      const totalRepos = userProfileResponse.data.public_repos;
      
      if (totalRepos === 0) {
        // If user has no repos, create minimal record with zeros
        const emptySummary = {
          totalRepos: 0,
          totalCommits: 0,
          activeRepos: 0,
          totalStars: 0,
          totalForks: 0
        };
        
        // Update or create record
        githubData = await GithubData.findOneAndUpdate(
          { userId },
          { 
            $set: {
              userId,
              githubId: user.githubID,
              summary: emptySummary,
              lastUpdated: Date.now()
            }
          },
          { upsert: true, new: true }
        );
        
        return res.status(200).json({
          success: true,
          summary: emptySummary,
          fromCache: false
        });
      }
      
      // Get first page of repos for other metrics
      const response = await githubApi.get(`/users/${user.githubID}/repos`, {
        params: {
          per_page: 100,
          page: 1
        }
      });
      
      // Calculate summary metrics from first page
      const repos = response.data;
      
      // Better commit estimation based on repo activity
      let totalCommits = 0;
      repos.forEach(repo => {
        // More accurate estimation based on repo size and activity
        const lastPushDate = new Date(repo.pushed_at);
        const repoAgeInDays = Math.ceil((Date.now() - new Date(repo.created_at)) / (1000 * 60 * 60 * 24));
        
        // Estimate commits based on repo size, age, and recent activity
        let estimatedCommits = 0;
        if (repo.size > 0) {
          // Base estimate on repo size
          estimatedCommits = Math.min(repo.size / 8, 100);
          
          // Adjust based on repo age (newer repos might have fewer commits)
          if (repoAgeInDays < 30) {
            estimatedCommits = Math.min(estimatedCommits, repoAgeInDays * 2);
          }
          
          // Boost estimate for recently active repos
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          if (lastPushDate > threeMonthsAgo) {
            estimatedCommits *= 1.5;
          }
        }
        
        totalCommits += Math.round(estimatedCommits);
      });
      
      const activeRepos = repos.filter(repo => {
        const lastPush = new Date(repo.pushed_at);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return lastPush > threeMonthsAgo;
      }).length;
      
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
      
      const summary = {
        totalRepos,
        totalCommits,
        activeRepos,
        totalStars,
        totalForks
      };
      
      console.log(`GitHub summary for ${user.githubID}:`, summary);
      
      // If we don't have githubData yet, create a new record
      if (!githubData) {
        githubData = await GithubData.create({
          userId,
          githubId: user.githubID,
          summary,
          lastUpdated: Date.now()
        });
      } else {
        // Update the summary data
        githubData = await GithubData.findOneAndUpdate(
          { userId },
          { 
            $set: {
              summary,
              lastUpdated: Date.now()
            }
          },
          { new: true }
        );
      }

      return res.status(200).json({
        success: true,
        summary,
        fromCache: false
      });
    } catch (error) {
      console.error('GitHub API Error:', error);
      
      // If we have existing data, return it despite the error
      if (githubData && githubData.summary) {
        return res.status(200).json({
          success: true,
          summary: githubData.summary,
          message: "Using cached data due to API error",
          fromCache: true
        });
      }
      
      return res.status(503).json({
        message: `GitHub API Error: ${error.message}`,
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};
