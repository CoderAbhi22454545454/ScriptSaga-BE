import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  // GitHub Metrics Calculation
  const calculateGitHubMetrics = () => {
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
        impact: Math.round(impactScore)
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Detailed Progress Report
          <OverallProgressBadge 
            githubScore={githubMetrics.scores.activity} 
            leetCodeScore={leetCodeMetrics?.scores.overall || 0}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="github" className="w-full">
          <TabsList>
            <TabsTrigger value="github">GitHub Progress</TabsTrigger>
            <TabsTrigger value="leetcode">LeetCode Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="github">
            <GitHubProgressDetails metrics={githubMetrics} repos={repos} />
          </TabsContent>
          
          <TabsContent value="leetcode">
            <LeetCodeProgressDetails metrics={leetCodeMetrics} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const GitHubProgressDetails = ({ metrics, repos }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-4">
      <ProgressCard 
        title="Activity Score" 
        value={metrics.scores.activity} 
        description="Based on recent commits and consistency"
      />
      <ProgressCard 
        title="Code Quality" 
        value={metrics.scores.quality}
        description="Based on commit size and patterns"
      />
      <ProgressCard 
        title="Impact" 
        value={metrics.scores.impact}
        description="Based on contributions and engagement"
      />
    </div>
    
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Recent Activity Details</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total Commits</p>
          <p className="text-2xl font-bold">{metrics.raw.recentActivity.commits}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Active Days</p>
          <p className="text-2xl font-bold">{metrics.raw.recentActivity.activeDays.size}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Active Repositories</p>
          <p className="text-2xl font-bold">{metrics.raw.recentActivity.repositories.size}</p>
        </div>
      </div>
    </div>

    <ImprovementSuggestions metrics={metrics} />
    <DomainRecommendations repos={repos} />
  </div>
);

const LeetCodeProgressDetails = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-500 mb-4"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">No LeetCode Account Found</h3>
        <p className="text-gray-600 mt-2">
          This student hasn't connected their LeetCode account yet.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Connecting a LeetCode account will help track problem-solving progress and consistency.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <ProgressCard 
          title="Problem Solving" 
          value={metrics.scores.problems}
          description="Based on problems solved and difficulty"
        />
        <ProgressCard 
          title="Consistency" 
          value={metrics.scores.consistency}
          description="Based on submission rate and ranking"
        />
      </div>
      
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Problem Solving Details</h3>
        <div className="grid grid-cols-4 gap-4">
          <ProblemTypeCard 
            type="Total" 
            count={metrics.raw.problemSolving.total}
            className="bg-blue-500"
          />
          <ProblemTypeCard 
            type="Easy" 
            count={metrics.raw.problemSolving.easy}
            className="bg-green-500"
          />
          <ProblemTypeCard 
            type="Medium" 
            count={metrics.raw.problemSolving.medium}
            className="bg-yellow-500"
          />
          <ProblemTypeCard 
            type="Hard" 
            count={metrics.raw.problemSolving.hard}
            className="bg-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DetailedStudentProgress;