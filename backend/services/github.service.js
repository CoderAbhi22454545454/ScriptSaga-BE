import axios from 'axios'

const GitHub_BaseURL = "https://api.github.com";

const token = "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"

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
         'Authorization': `token ${token}`
    }
})

export const getGithubUserRepos = async (githubID) => {
    const response = await githubApi.get(`/users/${githubID}/repos`);
    return response.data;
}

export const getGithubRepoCommits = async (githubID, repoName) => {
    const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`);
    return response;
}
