import axios from 'axios'
import { DateTime } from 'luxon'

const GitHub_BaseURL = "https://api.github.com";

const token = "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"

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
})

// Fetch all user repos
export const getGithubUserRepos = async (githubID) => {
    try {
        const response = await githubApi.get(`/users/${githubID}/repos`, {
            params: {
                per_page: 100,
                page: 1
            }
        });
        return response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count
        }));
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        throw error;
    }
}

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
