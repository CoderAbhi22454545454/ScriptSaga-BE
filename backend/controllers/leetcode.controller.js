import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { leetCodeUserInfo } from '../services/leetcode.service.js';

export const getLCodeUserInfo = async (req, res) => {
    const { userId } = req.params;

    // Check if the provided userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format', success: false });
    }

    // Find the user in the database
    const user = await User.findById(userId);

    // If the user is not found, return an error
    if (!user) {
        return res.status(400).json({
            message: 'User Not Found',
            success: false
        });
    }

    try {
        // Fetch LeetCode data using the leetCodeUserInfo service
        const leetCodeRes = await leetCodeUserInfo(user.leetCodeID);

        // Return the combined data as JSON
        return res.status(200).json(leetCodeRes);
    } catch (error) {
        // Handle any errors during the API request
        return res.status(500).json({
            message: 'Error fetching LeetCode user information',
            success: false,
            error: error.message
        });
    }
};
