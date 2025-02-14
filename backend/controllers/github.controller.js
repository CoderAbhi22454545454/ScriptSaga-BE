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

export const getStudentReposWithCommits = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

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

    // Get cached or fresh GitHub data
    let githubData = await GithubData.findOne({ userId });
    const needsUpdate = !githubData || 
                       Date.now() - githubData.lastUpdated > 24 * 60 * 60 * 1000;

    if (needsUpdate) {
      try {
        const repos = await getGithubUserRepos(user.githubID);
        
        // Process repos in batches to avoid overwhelming the API
        const reposWithCommits = [];
        for (let i = 0; i < repos.length; i += 5) {
          const batch = repos.slice(i, i + 5);
          const batchPromises = batch.map(repo => 
            getGithubRepoCommits(user.githubID, repo.name)
              .catch(err => ({ commits: [] })) // Handle individual repo failures
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
        // Return more specific error messages
        return res.status(503).json({
          message: `GitHub API Error: ${error.message}`,
          success: false,
          error: error.message
        });
      }
    }

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRepos = githubData.repos.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      repos: paginatedRepos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(githubData.repos.length / limit),
        totalRepos: githubData.repos.length
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
// export const getGithubRepoCommits = async (githubID, repoName) => {
//     console.log("Fetching commits for:", githubID, repoName);
  
//     try {
//       const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`, {
//         params: {
//           per_page: 100,
//           page: 1,
//         }
//       });
  
//       const commits = response.data.map(commit => ({
//         message: commit.commit.message,
//         date: commit.commit.author.date,
//         url: commit.html_url,
//       }));
  
//       return commits;
//     } catch (error) {
//       console.error('Error fetching commits:', error);
//       throw error;
//     }
//   };

// export const updateStudentRepos = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: 'Invalid user ID format', success: false });
//         }
        
//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({ message: "User not found", success: false });
//         }

//         const repos = await getGithubUserRepos(newUser.githubID);
//         newUser.githubRepos = repos;
//         await user.save();

//         res.status(200).json({ message: "GitHub repos updated successfully", success: true });
//     } catch (error) {
//         console.log("Error while updating student repos: ", error);
//         res.status(500).json({ message: "Server Error", success: false });
//     }
// }

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
