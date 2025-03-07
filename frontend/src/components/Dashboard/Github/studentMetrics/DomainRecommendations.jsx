import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getDomainSuggestions, getRoadmapLink } from "@/utils/domainSuggestions";

const DomainRecommendations = ({ languages }) => {
  if (!languages || Object.keys(languages).length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Career Path Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            No language data available. Start coding in more repositories to get personalized career recommendations.
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendedDomains = getDomainSuggestions(languages);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Career Path Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-600 mb-3">Top Languages</h4>
            <div className="space-y-2">
              {Object.entries(languages)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([language, count], index) => (
                  <div key={language} className="flex items-center justify-between">
                    <span>{language}</span>
                    <span className="text-sm font-medium">{count} repos</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-600 mb-3">Recommended Domains</h4>
            <div className="space-y-2">
              {recommendedDomains.map((domain, index) => (
                <div key={domain} className="flex items-center justify-between">
                  <span>{domain}</span>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={getRoadmapLink(domain)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <span className="text-xs">View Roadmap</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainRecommendations;