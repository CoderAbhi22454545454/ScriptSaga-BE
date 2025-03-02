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
                       Date.now() - githubData.lastUpdated > 24 * 60 * 60 * 1000;

    if (needsUpdate) {
      try {
        // Get all repos with maximum items per page
        const repos = await getGithubUserRepos(user.githubID, MAX_PER_PAGE);
        
        // Process repos in larger batches
        const reposWithCommits = [];
        for (let i = 0; i < repos.length; i += MAX_CONCURRENT_REQUESTS) {
          const batch = repos.slice(i, i + MAX_CONCURRENT_REQUESTS);
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
      } catch (error) {
        console.error('GitHub API Error:', error);
        return res.status(503).json({
          message: `GitHub API Error: ${error.message}`,
          success: false,
          error: error.message
        });
      }
    }

    // Implement pagination with maximum items per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRepos = githubData.repos.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      repos: paginatedRepos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(githubData.repos.length / limit),
        totalRepos: githubData.repos.length,
        itemsPerPage: limit
      }
    });
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
    let allCommits = [];
    let page = 1;
    let hasMoreCommits = true;

    while (hasMoreCommits) {
      const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`, {
        params: {
          per_page: MAX_PER_PAGE,
          page: page
        }
      });

      const commits = response.data.map(commit => ({
        message: commit.commit.message,
        date: commit.commit.author.date,
        url: commit.html_url,
        sha: commit.sha,
        author: commit.commit.author.name
      }));

      allCommits.push(...commits);

      // Check if there are more commits
      hasMoreCommits = commits.length === MAX_PER_PAGE;
      page++;

      // Add a small delay to avoid rate limiting
      if (hasMoreCommits) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { commits: allCommits };
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
