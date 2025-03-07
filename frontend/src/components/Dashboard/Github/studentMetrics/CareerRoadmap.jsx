import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, ExternalLink, Code } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getDomainSuggestions, getRoadmapLink } from "@/utils/domainSuggestions";

const CareerRoadmap = ({ languages }) => {
  if (!languages || Object.keys(languages).length === 0) {
    return null;
  }

  const recommendedDomains = getDomainSuggestions(languages);
  if (recommendedDomains.length === 0) {
    return null;
  }

  // Get the primary recommended domain
  const primaryDomain = recommendedDomains[0];
  const roadmapLink = getRoadmapLink(primaryDomain);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Your Career Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex flex-col items-center text-center mb-6">
            <Code className="w-12 h-12 text-blue-500 mb-2" />
            <h3 className="text-xl font-bold">{primaryDomain}</h3>
            <p className="text-gray-600 mt-2">
              Based on your GitHub activity, we recommend exploring a career path in {primaryDomain}.
            </p>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button className="bg-blue-600 hover:bg-blue-700" asChild>
              <a 
                href={roadmapLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>View Complete Roadmap</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-3">Why {primaryDomain}?</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Matches your most used programming languages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Growing field with strong job prospects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Aligns with your current coding patterns and interests</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerRoadmap;