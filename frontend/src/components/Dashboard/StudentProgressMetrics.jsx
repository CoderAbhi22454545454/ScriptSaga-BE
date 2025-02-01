import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/constants/constant";
import { toast } from "sonner";

const StudentProgressMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    githubActiveStudents: 0,
    leetcodeActiveStudents: 0,
    averageProblems: 0,
    topLeetCodeStudents: [],
    topGitHubStudents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/user/student-metrics");
      setMetrics(response.data.metrics);
    } catch (error) {
      toast.error("Failed to fetch student metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Student Progress Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              GitHub Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.githubActiveStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.githubActiveStudents / metrics.totalStudents) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              LeetCode Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.leetcodeActiveStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.leetcodeActiveStudents / metrics.totalStudents) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top LeetCode Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topLeetCodeStudents?.map((student, index) => (
              <div
                key={`leetcode-${student._id}-${index}`}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <span className="text-sm">
                  {index + 1}. {student.firstName} {student.lastName}
                </span>
                <span className="text-sm font-medium">
                  {student.problemsSolved || 0} problems
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top GitHub Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(metrics.topGitHubStudents) && metrics.topGitHubStudents.length > 0 ? (
              metrics.topGitHubStudents.map((student, index) => (
                <div
                  key={`github-${student._id}-${index}`}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="text-sm">
                    {index + 1}. {student.firstName} {student.lastName}
                  </span>
                  <span className="text-sm font-medium">
                    {student.totalCommits || 0} commits
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProgressMetrics;
