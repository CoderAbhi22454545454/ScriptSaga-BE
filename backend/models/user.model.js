import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,

  },
  lastName: {
    type: String,

  },
  githubID: {
    type: String,
    required: true
  },
  leetCodeID: {
    type: String
  }
  ,
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,

  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
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

export const User = mongoose.model('User', userSchema);
