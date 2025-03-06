import { StudentMetrics } from '../models/studentMetrics.model.js';

const calculateActivityScore = (metrics) => {
  // Simple scoring logic - can be enhanced
  const daysActive = metrics.recentActivity.activeDays.size;
  const recentCommits = metrics.recentActivity.commits;
  return Math.min(100, ((daysActive * 3) + (recentCommits * 2)) / 5);
};

const calculateCodeQualityScore = (metrics) => {
  const commitFrequencyScore = Math.min((metrics.recentActivity.commits / 150) * 40, 40);
  const activeDaysScore = (metrics.recentActivity.activeDays.size / 90) * 30;
  const reposDiversityScore = (metrics.recentActivity.repositories.size / 5) * 30;
  return Math.min(commitFrequencyScore + activeDaysScore + reposDiversityScore, 100);
};

const calculateImpactScore = (metrics) => {
  // Simple scoring logic - can be enhanced
  const stars = metrics.impact.totalStars;
  const forks = metrics.impact.totalForks;
  return Math.min(100, ((stars * 3) + (forks * 2)) / 5);
};

const processLanguages = (repos) => {
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(languages).map(([name, repoCount]) => ({
    name,
    repoCount,
    percentage: (repoCount / repos.length) * 100
  }));
};

const generateCareerInsights = (repos) => {
  const languageToDomainsMap = {
    'JavaScript': ['Web Development', 'Full Stack Development', 'Frontend Development'],
    'Python': ['Data Science', 'Machine Learning', 'Backend Development'],
    'Java': ['Enterprise Development', 'Android Development', 'Backend Development'],
    'C++': ['Game Development', 'Systems Programming', 'Performance-Critical Applications'],
    'HTML': ['Frontend Development', 'Web Design', 'UI Development'],
    'TypeScript': ['Modern Web Development', 'Enterprise Applications', 'Type-Safe Programming']
  };

  const languages = processLanguages(repos);
  const topLanguages = languages
    .sort((a, b) => b.repoCount - a.repoCount)
    .slice(0, 3)
    .map(lang => lang.name);

  const recommendedDomains = new Set();
  topLanguages.forEach(lang => {
    const domains = languageToDomainsMap[lang] || [];
    domains.forEach(domain => recommendedDomains.add(domain));
  });

  return {
    topDomains: Array.from(recommendedDomains).slice(0, 3),
    recommendedPaths: Array.from(recommendedDomains).slice(0, 3)
  };
};

const generateSuggestions = (scores) => {
  const suggestions = [];

  if (scores.activity < 50) {
    suggestions.push({
      category: 'Activity',
      points: [
        'Try to commit code more regularly',
        'Contribute to more repositories',
        'Aim for at least 3-4 commits per week'
      ]
    });
  }

  if (scores.quality < 50) {
    suggestions.push({
      category: 'Code Quality',
      points: [
        'Make smaller, more focused commits',
        'Add meaningful commit messages',
        'Review your code before committing'
      ]
    });
  }

  if (scores.impact < 50) {
    suggestions.push({
      category: 'Impact',
      points: [
        'Contribute to open source projects',
        'Share your projects on social media',
        'Write documentation for your projects'
      ]
    });
  }

  return suggestions;
};

export const calculateGitHubMetrics = (repos) => {
  if (!repos || !Array.isArray(repos)) {
    return {
      raw: {
        recentActivity: {
          commits: 0,
          activeDays: new Set(),
          repositories: new Set()
        },
        impact: {
          totalStars: 0,
          totalForks: 0
        }
      },
      scores: {
        activity: 0,
        impact: 0
      }
    };
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
  
  const metrics = {
    recentActivity: {
      commits: 0,
      activeDays: new Set(),
      repositories: new Set()
    },
    impact: {
      totalStars: 0,
      totalForks: 0
    }
  };

  repos.forEach(repo => {
    if (repo.commits && Array.isArray(repo.commits)) {
      repo.commits.forEach(commit => {
        const commitDate = new Date(commit.date);
        if (commitDate >= ninetyDaysAgo) {
          metrics.recentActivity.commits++;
          metrics.recentActivity.activeDays.add(commit.date.split('T')[0]);
          metrics.recentActivity.repositories.add(repo.name);
        }
      });
    }

    metrics.impact.totalStars += repo.stargazers_count || 0;
    metrics.impact.totalForks += repo.forks_count || 0;
  });

  return {
    raw: metrics,
    scores: {
      activity: calculateActivityScore(metrics) || 0,
      impact: calculateImpactScore(metrics) || 0
    }
  };
};

export const calculateLeetCodeMetrics = (leetcode) => {
  if (!leetcode?.completeProfile) return null;

  const metrics = {
    problemSolving: {
      total: leetcode.completeProfile.solvedProblem || 0,
      easy: leetcode.completeProfile.easySolved || 0,
      medium: leetcode.completeProfile.mediumSolved || 0,
      hard: leetcode.completeProfile.hardSolved || 0,
    },
    consistency: {
      submissionRate: leetcode.completeProfile.submissionRate || 0,
      ranking: leetcode.basicProfile?.ranking || 0,
    }
  };

  return {
    raw: metrics,
    scores: {
      problems: Math.round((metrics.problemSolving.total / 100) * 100),
      consistency: Math.round(metrics.consistency.submissionRate),
      overall: Math.round(
        ((metrics.problemSolving.total / 100) * 70) + 
        (metrics.consistency.submissionRate * 0.3)
      )
    }
  };
};

export const updateStudentMetrics = async (userId, repos, leetcode) => {
  const githubMetrics = calculateGitHubMetrics(repos);
  const leetcodeMetrics = calculateLeetCodeMetrics(leetcode);
  
  // Simplified metrics structure
  const metrics = {
    userId,
    github: {
      repositories: {
        total: repos?.length || 0,
        active: repos?.filter(r => r.commits?.length > 0).length || 0,
        recentlyActive: githubMetrics.raw.recentActivity.repositories.size
      },
      commits: {
        total: repos?.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0) || 0,
        recent90Days: githubMetrics.raw.recentActivity.commits
      },
      activity: {
        score: githubMetrics.scores.activity,
        activeDays: Array.from(githubMetrics.raw.recentActivity.activeDays)
      },
      impact: {
        score: githubMetrics.scores.impact,
        stars: githubMetrics.raw.impact.totalStars,
        forks: githubMetrics.raw.impact.totalForks
      }
    },
    leetcode: leetcodeMetrics ? {
      problemsSolved: {
        total: leetcodeMetrics.problemSolving.total,
        easy: leetcodeMetrics.problemSolving.easy,
        medium: leetcodeMetrics.problemSolving.medium,
        hard: leetcodeMetrics.problemSolving.hard
      },
      ranking: leetcodeMetrics.consistency.ranking
    } : null,
    lastUpdated: new Date()
  };

  return StudentMetrics.findOneAndUpdate(
    { userId },
    metrics,
    { upsert: true, new: true }
  );
};