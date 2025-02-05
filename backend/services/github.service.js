import { memoryCache } from '../utils/memoryCache.js';
import rateLimit from 'express-rate-limit';
import axios from 'axios'
import { DateTime } from 'luxon'
import dotenv from 'dotenv';

dotenv.config();

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 24 * 60 * 60;

// Rate limiter for GitHub API
export const githubRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // GitHub API limit
  message: 'Too many requests from this IP, please try again later.'
});


const GitHub_BaseURL = "https://api.github.com";

const token = process.env.GITHUB_TOKEN;

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
})

// Fetch all user repos
export const getGithubUserRepos = async (githubID) => {
  try {
    const cacheKey = `github:repos:${githubID}`;
    const cachedData = memoryCache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    const repos = await githubApi.get(`/users/${githubID}/repos`);
    memoryCache.set(cacheKey, repos.data, CACHE_TTL);
    
    return repos.data;
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw new Error('Failed to fetch GitHub repositories');
  }
};

// Fetch commits for a specific repo
export const getGithubRepoCommits = async (githubID, repoName) => {
    console.log("Fetching commits for:", githubID, repoName);
  
    try {
      const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`, {
        params: {
          per_page: 100,
          page: 1,
        }
      });
  
      const commits = response.data.map(commit => ({
        message: commit.commit.message,
        date: commit.commit.author.date,
        url: commit.html_url,
      }));
  
      return {
        commits: commits,
      };
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log(`Repository ${repoName} is empty.`);
        return { commits: [] };
      }
      console.error('Error fetching commits:', error);
      throw error;
    }
  };

export const getGithubUserProfile = async (githubID) => {
    try {
        const response = await githubApi.get(`/users/${githubID}`);
        
        // Extract the necessary data
        const { login, avatar_url, html_url, bio, public_repos, followers, following } = response.data;

        // Return the data in a structured format
        return {
            username: login,
            profileImageUrl: avatar_url,
            profileUrl: html_url,
            bio: bio,
            publicRepos: public_repos,
            followers: followers,
            following: following
        };
    } catch (error) {
        console.error('Error fetching GitHub user profile:', error);
        throw error;
    }
}
