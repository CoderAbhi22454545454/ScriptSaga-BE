import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Add these functions before the DetailedStudentProgress component

const calculateCodeQualityScore = (metrics) => {
  // Calculate code quality score based on:
  // 1. Commit frequency (40%)
  // 2. Active days ratio (30%)
  // 3. Repository diversity (30%)
  
  const commitFrequencyScore = Math.min((metrics.recentActivity.commits / 150) * 40, 40);
  const activeDaysScore = (metrics.recentActivity.activeDays.size / 90) * 30;
  const reposDiversityScore = (metrics.recentActivity.repositories.size / 5) * 30;

  return Math.min(
    Math.round(commitFrequencyScore + activeDaysScore + reposDiversityScore),
    100
  );
};

const calculateImpactScore = (metrics) => {
  // Calculate impact score based on:
  // 1. Stars received (50%)
  // 2. Forks received (30%)
  // 3. Contribution streak (20%)
  
  const starsScore = Math.min((metrics.impact.totalStars / 10) * 50, 50);
  const forksScore = Math.min((metrics.impact.totalForks / 5) * 30, 30);
  const streakScore = Math.min((metrics.impact.contributionStreak / 7) * 20, 20);

  return Math.min(
    Math.round(starsScore + forksScore + streakScore),
    100
  );
};

const calculateProblemScore = (problemSolving) => {
  // Calculate problem solving score based on:
  // Easy problems: 20%
  // Medium problems: 50%
  // Hard problems: 30%
  
  const easyScore = Math.min((problemSolving.easy / 30) * 20, 20);
  const mediumScore = Math.min((problemSolving.medium / 20) * 50, 50);
  const hardScore = Math.min((problemSolving.hard / 10) * 30, 30);

  return Math.min(
    Math.round(easyScore + mediumScore + hardScore),
    100
  );
};

const ProblemTypeCard = ({ type, count, className }) => (
  <div className={`p-4 rounded-lg text-white ${className}`}>
    <p className="text-sm font-medium">{type}</p>
    <p className="text-2xl font-bold mt-1">{count}</p>
  </div>
);

const ProgressCard = ({ title, value, description }) => (
  <div className="p-4 bg-gray-100 rounded-lg">
    <h4 className="font-medium">{title}</h4>
    <p className="text-2xl font-bold mt-1">{Math.round(value)}/100</p>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
  </div>
);

const OverallProgressBadge = ({ githubScore, leetCodeScore }) => {
  const totalScore = (githubScore + leetCodeScore) / 2;
  const getStatus = (score) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-500" };
    if (score >= 60) return { label: "Good", color: "bg-blue-500" };
    if (score >= 40) return { label: "Fair", color: "bg-yellow-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const status = getStatus(totalScore);
  return (
    <Badge className={`${status.color} text-white`}>
      {status.label}
    </Badge>
  );
};

const getDomainSuggestions = (languages) => {
  const domainMap = {
    JavaScript: ['Web Development', 'Full Stack Development', 'Frontend Development'],
    TypeScript: ['Web Development', 'Enterprise Applications', 'Full Stack Development'],
    Python: ['Data Science', 'Machine Learning', 'Backend Development', 'AI Development'],
    Java: ['Enterprise Development', 'Android Development', 'Backend Development'],
    Kotlin: ['Android Development', 'Mobile Development'],
    Swift: ['iOS Development', 'Mobile Development'],
    PHP: ['Web Development', 'Backend Development'],
    'C#': ['Game Development', '.NET Development', 'Enterprise Applications'],
    'C++': ['Game Development', 'Systems Programming', 'Performance-Critical Applications'],
    Go: ['Cloud Development', 'Backend Development', 'Systems Programming'],
    Rust: ['Systems Programming', 'WebAssembly Development', 'Performance-Critical Applications'],
    Ruby: ['Web Development', 'Backend Development'],
    Dart: ['Mobile Development', 'Cross-platform Development'],
    Flutter: ['Mobile Development', 'Cross-platform Development'],
    React: ['Frontend Development', 'Web Development'],
  };

  // Get the most used languages (top 3)
  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const suggestions = new Set();
  sortedLanguages.forEach(([lang]) => {
    const domains = domainMap[lang] || [];
    domains.forEach(domain => suggestions.add(domain));
  });

  return Array.from(suggestions).slice(0, 3);
};

const getImprovementSuggestions = (metrics) => {
  const suggestions = [];

  // Activity-based suggestions
  if (metrics.scores.activity < 60) {
    suggestions.push({
      area: 'Activity',
      suggestions: [
        'Try to commit code more regularly',
        'Contribute to more repositories',
        'Aim for at least 3-4 commits per week'
      ]
    });
  }

  // Code quality suggestions
  if (metrics.scores.quality < 60) {
    suggestions.push({
      area: 'Code Quality',
      suggestions: [
        'Make smaller, more focused commits',
        'Add meaningful commit messages',
        'Review your code before committing'
      ]
    });
  }

  // Impact suggestions
  if (metrics.scores.impact < 60) {
    suggestions.push({
      area: 'Impact',
      suggestions: [
        'Contribute to open source projects',
        'Share your projects on social media',
        'Add detailed README files to your repositories'
      ]
    });
  }

  return suggestions;
};

// Add this component for suggestions
const ImprovementSuggestions = ({ metrics }) => {
  const suggestions = getImprovementSuggestions(metrics);
  
  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3">Suggestions for Improvement</h3>
      <div className="space-y-4">
        {suggestions.map(({ area, suggestions }) => (
          <div key={area} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-600">{area} Needs Improvement</h4>
            <ul className="mt-2 space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-500"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add this component for domain recommendations
const DomainRecommendations = ({ repos }) => {
  // Calculate language distribution
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const recommendedDomains = getDomainSuggestions(languages);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3">Career Path Insights</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-600">Top Languages</h4>
          <div className="mt-2 space-y-2">
            {sortedLanguages.map(([language, count], index) => (
              <div key={language} className="flex items-center justify-between">
                <span className="text-sm">{language}</span>
                <span className="text-sm font-medium">{count} repos</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-600">Recommended Domains</h4>
          <div className="mt-2 space-y-2">
            {recommendedDomains.map((domain, index) => (
              <div key={domain} className="text-sm">
                {index + 1}. {domain}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailedStudentProgress = ({ repos, leetCode }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!repos) {
      setLoading(false);
      return;
    }
    
    // Calculate metrics when repos change
    const calculatedMetrics = calculateGitHubMetrics();
    setMetrics(calculatedMetrics);
    setLoading(false);
  }, [repos]);
  
  // GitHub Metrics Calculation
  const calculateGitHubMetrics = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);
    
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

    // Calculate Activity Score (40% commits, 30% active days, 30% active repos)
    const activityScore = Math.min(
      ((metrics.recentActivity.commits / 90) * 40 +
      (metrics.recentActivity.activeDays.size / 90) * 30 +
      (metrics.recentActivity.repositories.size / Math.max(repos.length, 1)) * 30),
      100
    );

    // Calculate Code Quality Score
    const qualityScore = calculateCodeQualityScore(metrics);

    // Calculate Impact Score
    const impactScore = calculateImpactScore(metrics);

    return {
      raw: metrics,
      scores: {
        activity: Math.round(activityScore),
        quality: Math.round(qualityScore),
        impact: Math.round(impactScore),
        overall: Math.round((activityScore + qualityScore + impactScore) / 3)
      }
    };
  };

  // LeetCode Metrics Calculation
  const calculateLeetCodeMetrics = () => {
    if (!leetCode?.completeProfile) return null;

    const metrics = {
      problemSolving: {
        total: leetCode.completeProfile.solvedProblem || 0,
        easy: leetCode.completeProfile.easySolved || 0,
        medium: leetCode.completeProfile.mediumSolved || 0,
        hard: leetCode.completeProfile.hardSolved || 0,
      },
      consistency: {
        submissionRate: leetCode.completeProfile.submissionRate || 0,
        ranking: leetCode.basicProfile.ranking || 0,
      }
    };

    // Calculate weighted scores
    const problemScore = calculateProblemScore(metrics.problemSolving);
    const consistencyScore = (metrics.consistency.submissionRate);

    return {
      raw: metrics,
      scores: {
        problems: problemScore,
        consistency: consistencyScore,
        overall: (problemScore * 0.7 + consistencyScore * 0.3)
      }
    };
  };

  const githubMetrics = calculateGitHubMetrics();
  const leetCodeMetrics = calculateLeetCodeMetrics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Calculating metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No repository data available</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Unable to calculate metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Progress Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Overall GitHub Score</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${metrics.scores.overall}%` }}
              />
            </div>
            <p className="text-right mt-1">{metrics.scores.overall}/100</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard 
              title="Activity" 
              score={metrics.scores.activity} 
              details={[
                { label: "Commits (90 days)", value: metrics.raw.recentActivity.commits },
                { label: "Active Days", value: metrics.raw.recentActivity.activeDays.size },
                { label: "Active Repos", value: metrics.raw.recentActivity.repositories.size }
              ]}
            />
            
            <ScoreCard 
              title="Code Quality" 
              score={metrics.scores.quality} 
              details={[
                { label: "Consistency", value: `${Math.round(metrics.raw.recentActivity.activeDays.size / 90 * 100)}%` },
                { label: "Repo Diversity", value: metrics.raw.recentActivity.repositories.size }
              ]}
            />
            
            <ScoreCard 
              title="Impact" 
              score={metrics.scores.impact} 
              details={[
                { label: "Stars", value: metrics.raw.impact.totalStars },
                { label: "Forks", value: metrics.raw.impact.totalForks }
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ScoreCard = ({ title, score, details }) => (
  <div className="bg-white rounded-lg p-4 shadow">
    <h3 className="font-medium mb-2">{title}</h3>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${score}%` }}
      />
    </div>
    <p className="text-right text-sm mb-4">{score}/100</p>
    
    <div className="space-y-2">
      {details.map((detail, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-gray-500">{detail.label}</span>
          <span className="font-medium">{detail.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default DetailedStudentProgress;

// Add these exports at the end of the file
export { getImprovementSuggestions, getDomainSuggestions };