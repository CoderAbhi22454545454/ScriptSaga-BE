import mongoose from 'mongoose';

const studentMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  github: {
    repositories: {
      total: Number,
      active: Number,
      recentlyActive: Number
    },
    commits: {
      total: Number,
      recent90Days: Number
    },
    activity: {
      score: Number,
      activeDays: [String],
      activeRepos: [String],
      lastCommitDate: Date
    },
    codeQuality: {
      score: Number,
      commitPatterns: {
        averageSize: Number,
        consistency: Number
      }
    },
    impact: {
      score: Number,
      stars: Number,
      forks: Number
    },
    languages: [{
      name: String,
      repoCount: Number,
      percentage: Number
    }],
    careerInsights: {
      topDomains: [String],
      recommendedPaths: [String]
    },
    suggestions: [{
      category: String,
      points: [String]
    }]
  },
  leetcode: {
    problemsSolved: {
      total: Number,
      easy: Number,
      medium: Number,
      hard: Number
    },
    submissions: {
      total: Number,
      acceptanceRate: Number
    },
    ranking: Number,
    contestRating: Number,
    badges: [{
      name: String,
      category: String
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

studentMetricsSchema.index({ userId: 1 });
export const StudentMetrics = mongoose.model('StudentMetrics', studentMetricsSchema);