import { getGithubUserRepos, getGithubRepoCommits } from "../services/github.service.js";
import { User } from "../models/user.model.js";
import mongoose from 'mongoose';
import axios from 'axios';


const GitHub_BaseURL = "https://api.github.com";

const token = "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"

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
})


export const getStudentReposWithCommits = async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format', success: false });
      }
  
      const user = await User.findById(userId);
  
      if (!user || !user.githubID) {
        return res.status(404).json({ message: "User not found or GitHub ID not set", success: false });
      }
  
      const repos = await getGithubUserRepos(user.githubID);
  
      // Fetch commits for each repository
      const reposWithCommits = await Promise.all(repos.map(async (repo) => {
        try {
          console.log("Fetching commits for:", user.githubID, repo.name);
          const commits = await getGithubRepoCommits(user.githubID, repo.name);
          return { ...repo, commits: commits.commits };
        } catch (error) {
          console.error(`Error fetching commits for ${repo.name}:`, error);
          return { ...repo, commits: [] };
        }
      }));
  
      res.status(200).json({ repos: reposWithCommits, success: true });
    } catch (error) {
      console.log("Error while fetching student repos with commits: ", error);
      res.status(500).json({ message: "Server Error", success: false });
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
