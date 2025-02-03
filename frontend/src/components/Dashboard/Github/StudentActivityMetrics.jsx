import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const StudentActivityAssessment = ({ repos, leetCode }) => {
  // GitHub Activity Score (Max: 50 points)
  const calculateGitHubScore = () => {
    const metrics = {
      recentCommits: 0,    // Last 30 days (20 points)
      repoActivity: 0,     // Active repos (15 points)
      codeQuality: 0,      // Consistent commits (15 points)
    };

    // Recent Commits Score (20 points)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCommits = repos.reduce((count, repo) => {
      return count + repo.commits.filter(commit => 
        new Date(commit.date) > thirtyDaysAgo
      ).length;
    }, 0);
    
    metrics.recentCommits = Math.min(recentCommits / 30 * 20, 20);

    // Repo Activity Score (15 points)
    const activeRepos = repos.filter(repo => repo.commits.length > 0).length;
    metrics.repoActivity = (activeRepos / Math.max(repos.length, 1)) * 15;

    // Code Quality Score (15 points)
    const commitFrequency = repos.reduce((acc, repo) => {
      const dates = repo.commits.map(c => c.date.split('T')[0]);
      dates.forEach(date => acc[date] = (acc[date] || 0) + 1);
      return acc;
    }, {});
    
    const consistencyScore = Object.values(commitFrequency).length / 30 * 15;
    metrics.codeQuality = Math.min(consistencyScore, 15);

    return {
      total: Math.round(metrics.recentCommits + metrics.repoActivity + metrics.codeQuality),
      details: metrics
    };
  };

  // LeetCode Activity Score (Max: 50 points)
  const calculateLeetCodeScore = () => {
    if (!leetCode?.completeProfile) return { total: 0, details: { problems: 0, consistency: 0 } };

    const metrics = {
      problems: 0,     // Problems solved (30 points)
      consistency: 0,  // Solving consistency (20 points)
    };

    // Problems Solved Score (30 points)
    const totalProblems = leetCode.completeProfile.solvedProblem || 0;
    metrics.problems = Math.min(totalProblems / 100 * 30, 30);

    // Consistency Score (20 points)
    const submissionRate = leetCode.completeProfile.submissionRate || 0;
    metrics.consistency = (submissionRate / 100) * 20;

    return {
      total: Math.round(metrics.problems + metrics.consistency),
      details: metrics
    };
  };

  const githubScore = calculateGitHubScore();
  const leetCodeScore = calculateLeetCodeScore();
  const totalScore = githubScore.total + leetCodeScore.total;

  const getActivityStatus = (score) => {
    if (score >= 80) return { label: "Highly Active", color: "bg-green-500" };
    if (score >= 60) return { label: "Active", color: "bg-blue-500" };
    if (score >= 40) return { label: "Moderately Active", color: "bg-yellow-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const status = getActivityStatus(totalScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Activity Assessment
          <Badge className={`${status.color} text-white`}>
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Overall Score: {totalScore}/100</h3>
            <Progress value={totalScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">GitHub Activity ({githubScore.total}/50)</h4>
              <div className="text-sm space-y-1">
                <p>Recent Commits: {Math.round(githubScore.details.recentCommits)}/20</p>
                <p>Repository Activity: {Math.round(githubScore.details.repoActivity)}/15</p>
                <p>Code Consistency: {Math.round(githubScore.details.codeQuality)}/15</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">LeetCode Activity ({leetCodeScore.total}/50)</h4>
              <div className="text-sm space-y-1">
                <p>Problems Solved: {Math.round(leetCodeScore.details.problems)}/30</p>
                <p>Solving Consistency: {Math.round(leetCodeScore.details.consistency)}/20</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentActivityAssessment;
