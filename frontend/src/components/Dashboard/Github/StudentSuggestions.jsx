import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Code, BookOpen } from 'lucide-react';


const StudentSuggestions = ({ githubData, leetCodeData }) => {
  const generateSuggestions = () => {
    const suggestions = [];

    // GitHub-based suggestions
    if (githubData) {
      if (githubData.totalCommits < 50) {
        suggestions.push({
          icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
          title: "Increase Commit Frequency",
          description: "Try to make regular commits to build a consistent coding habit."
        });
      }

      if (Object.keys(githubData.languages || {}).length < 3) {
        suggestions.push({
          icon: <Code className="w-5 h-5 text-green-500" />,
          title: "Diversify Programming Languages",
          description: "Explore projects in different programming languages to broaden your skills."
        });
      }
    }

    // LeetCode-based suggestions
    if (leetCodeData) {
      if (leetCodeData.totalSolved < 50) {
        suggestions.push({
          icon: <BookOpen className="w-5 h-5 text-purple-500" />,
          title: "Practice More Problems",
          description: "Aim to solve at least 2-3 LeetCode problems per week."
        });
      }
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Suggestions for Improvement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              {suggestion.icon}
              <div>
                <h3 className="font-semibold">{suggestion.title}</h3>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSuggestions; 