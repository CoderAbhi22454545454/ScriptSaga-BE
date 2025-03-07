import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

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

const ImprovementSuggestions = ({ metrics }) => {
  const suggestions = getImprovementSuggestions(metrics);
  
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Suggestions for Improvement
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default ImprovementSuggestions;