import { StudentMetrics } from '../models/studentMetrics.model.js';

const calculateActivityScore = (metrics) => {
  return Math.min(
    ((metrics.recentActivity.commits / 90) * 40 +
    (metrics.recentActivity.activeDays.size / 90) * 30 +
    (metrics.recentActivity.repositories.size / 5) * 30),
    100
  );
};

const calculateCodeQualityScore = (metrics) => {
  const commitFrequencyScore = Math.min((metrics.recentActivity.commits / 150) * 40, 40);
  const activeDaysScore = (metrics.recentActivity.activeDays.size / 90) * 30;
  const reposDiversityScore = (metrics.recentActivity.repositories.size / 5) * 30;
  return Math.min(commitFrequencyScore + activeDaysScore + reposDiversityScore, 100);
};

const calculateImpactScore = (metrics) => {
  const starsScore = Math.min((metrics.impact.totalStars * 2), 50);
  const forksScore = Math.min((metrics.impact.totalForks * 5), 50);
  return Math.min(starsScore + forksScore, 100);
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
  const now = new Date();
  const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
  
  const metrics = {
    recentActivity: {
      commits: 0,
      activeDays: new Set(),
      repositories: new Set(),
    },
    codeQuality: {
      averageCommitSize: 0,
      consistencyScore: 0,
      languageDiversity: 0,
    },
    impact: {
      totalStars: 0,
      totalForks: 0,
      contributionStreak: 0,
    }
  };

  if (!repos || repos.length === 0) {
    return {
      raw: metrics,
      scores: {
        activity: 0,
        quality: 0,
        impact: 0
      }
    };
  }

  // Process each repository
  repos.forEach(repo => {
    if (!repo.commits) return;

    // Recent Activity
    repo.commits.forEach(commit => {
      const commitDate = new Date(commit.date);
      if (commitDate >= ninetyDaysAgo) {
        metrics.recentActivity.commits++;
        metrics.recentActivity.activeDays.add(commit.date.split('T')[0]);
        metrics.recentActivity.repositories.add(repo.name);
      }
    });

    // Impact Metrics
    metrics.impact.totalStars += repo.stargazers_count || 0;
    metrics.impact.totalForks += repo.forks_count || 0;
  });

  const scores = {
    activity: Math.round(calculateActivityScore(metrics)),
    quality: Math.round(calculateCodeQualityScore(metrics)),
    impact: Math.round(calculateImpactScore(metrics))
  };

  const careerInsights = generateCareerInsights(repos);
  const suggestions = generateSuggestions(scores);

  return {
    raw: metrics,
    scores,
    careerInsights,
    suggestions
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
        activeDays: Array.from(githubMetrics.raw.recentActivity.activeDays),
        activeRepos: Array.from(githubMetrics.raw.recentActivity.repositories),
        lastCommitDate: new Date()
      },
      codeQuality: {
        score: githubMetrics.scores.quality,
        commitPatterns: {
          averageSize: githubMetrics.raw.codeQuality.averageCommitSize,
          consistency: githubMetrics.raw.codeQuality.consistencyScore
        }
      },
      impact: {
        score: githubMetrics.scores.impact,
        stars: githubMetrics.raw.impact.totalStars,
        forks: githubMetrics.raw.impact.totalForks
      },
      languages: processLanguages(repos),
      careerInsights: githubMetrics.careerInsights,
      suggestions: githubMetrics.suggestions
    },
    leetcode: leetcodeMetrics?.raw || null,
    lastUpdated: new Date()
  };

  return StudentMetrics.findOneAndUpdate(
    { userId },
    metrics,
    { upsert: true, new: true }
  );
};