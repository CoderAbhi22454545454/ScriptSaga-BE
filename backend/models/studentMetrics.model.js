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
      activeDays: [String]
    },
    impact: {
      score: Number,
      stars: Number,
      forks: Number
    }
  },
  leetcode: {
    problemsSolved: {
      total: Number,
      easy: Number,
      medium: Number,
      hard: Number
    },
    ranking: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

studentMetricsSchema.index({ userId: 1 });
export const StudentMetrics = mongoose.model('StudentMetrics', studentMetricsSchema);