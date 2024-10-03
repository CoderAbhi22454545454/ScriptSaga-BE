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
    let page = 1;
    let allRepos = [];
    let hasMore = true;

    while (hasMore) {
        const response = await githubApi.get(`/users/${githubID}/repos`, {
            params: {
                per_page: 100, // Fetch the maximum number of repositories per page
                page: page
            }
        });

        allRepos = allRepos.concat(response.data);
        if (response.data.length < 100) {
            hasMore = false;
        } else {
            page++;
        }
    }

    return allRepos;
}

// Fetch commits for a specific repo
export const getGithubRepoCommits = async (githubID, repoName, authorUsername) => {
    let page = 1;
    let allCommits = [];
    let hasMore = true;

    // Calculate the date < 2 month ago
    const sinceDate = DateTime.now().minus({month : 24 }).toISO()

    while (hasMore) {
        const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`, {
            params: {
                per_page: 100, // Fetch the maximum number of commits per page
                page: page,
                author : authorUsername,
                since : sinceDate
            }
        });

        allCommits = allCommits.concat(response.data);
        if (response.data.length < 100) {
            hasMore = false;
        } else {
            page++;
        }
    }

    return allCommits.map(commit => ({
        message: commit.commit.message,
        date: commit.commit.author.date,
        url: commit.html_url,
    }));
}

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
