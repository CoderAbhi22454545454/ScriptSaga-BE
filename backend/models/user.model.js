import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  rollNo: {
    type: String
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  githubID: String,
  leetCodeID: String,
  githubData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GithubData'
  },
  leetcodeData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeetcodeData'
  },
  githubRepos: [{
    id: Number,
    name: String,
    full_name: String,
    description: String,
    html_url: String,
    created_at: Date,
    updated_at: Date,
    pushed_at: Date,
    language: String,
    stargazers_count: Number,
    forks_count: Number
}]
}, { timestamps: true });

userSchema.index({ rollNo: 1, classId: 1 }, { unique: true });
export const User = mongoose.model('User', userSchema);
