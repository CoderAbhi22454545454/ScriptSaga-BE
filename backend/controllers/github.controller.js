import { getGithubUserRepos, getGithubRepoCommits } from "../services/github.service.js";
import { User } from "../models/user.model.js";
import mongoose from 'mongoose';


export const getStudentRepos = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format', success: false });
        }
        
        const user = await User.findById(userId);

        if (!user || user.role !== "student") {
            return res.status(400).json({
                message: "Student Not Found",
                success: false
            });
        }

        const repos = await getGithubUserRepos(user.githubID)
        res.status(200).json(repos)

    } catch (error) {
        console.log("Error while fetching student repos : ", error);
        res.status(400).json({ message: "Server Error", success: false })
    }
}

export const getStudentRepoCommit = async (req, res) => {
    try {
        const { userId, repoName } = req.params;

        const user = await User.findById(userId)

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID",
                success: false
            });
        }


        const commits = await getGithubRepoCommits(user.githubID, repoName);
        res.status(200).json(commits); 
    } catch (error) {
        console.error('Error fetching repo commits:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
}