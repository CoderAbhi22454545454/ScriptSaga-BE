import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getDomainSuggestions } from "@/utils/domainSuggestions";

const getLearningResources = (domain) => {
  const resourcesMap = {
    'Web Development': [
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web' },
      { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/responsive-web-design/' },
      { name: 'The Odin Project', url: 'https://www.theodinproject.com/' }
    ],
    'Full Stack Development': [
      { name: 'Full Stack Open', url: 'https://fullstackopen.com/en/' },
      { name: 'The Odin Project', url: 'https://www.theodinproject.com/' },
      { name: 'App Academy Open', url: 'https://www.appacademy.io/course/app-academy-open' }
    ],
    'Frontend Development': [
      { name: 'Frontend Masters', url: 'https://frontendmasters.com/' },
      { name: 'CSS-Tricks', url: 'https://css-tricks.com/' },
      { name: 'JavaScript.info', url: 'https://javascript.info/' }
    ],
    'Backend Development': [
      { name: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/' },
      { name: 'Django Documentation', url: 'https://docs.djangoproject.com/' },
      { name: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html' }
    ],
    'Data Science': [
      { name: 'Kaggle Learn', url: 'https://www.kaggle.com/learn/overview' },
      { name: 'DataCamp', url: 'https://www.datacamp.com/' },
      { name: 'Towards Data Science', url: 'https://towardsdatascience.com/' }
    ],
    'Machine Learning': [
      { name: 'Coursera ML Course', url: 'https://www.coursera.org/learn/machine-learning' },
      { name: 'Fast.ai', url: 'https://www.fast.ai/' },
      { name: 'TensorFlow Tutorials', url: 'https://www.tensorflow.org/tutorials' }
    ],
    'AI Development': [
      { name: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/' },
      { name: 'Hugging Face', url: 'https://huggingface.co/learn' },
      { name: 'OpenAI Documentation', url: 'https://platform.openai.com/docs/introduction' }
    ],
    'Mobile Development': [
      { name: 'React Native Documentation', url: 'https://reactnative.dev/docs/getting-started' },
      { name: 'Flutter Documentation', url: 'https://flutter.dev/docs' },
      { name: 'Mobile Dev Tutorials', url: 'https://www.raywenderlich.com/' }
    ],
    'Game Development': [
      { name: 'Unity Learn', url: 'https://learn.unity.com/' },
      { name: 'Unreal Engine Documentation', url: 'https://docs.unrealengine.com/' },
      { name: 'Game Dev.net', url: 'https://www.gamedev.net/' }
    ],
    'Cloud Development': [
      { name: 'AWS Training', url: 'https://aws.amazon.com/training/' },
      { name: 'Google Cloud Training', url: 'https://cloud.google.com/training' },
      { name: 'Azure Learn', url: 'https://docs.microsoft.com/en-us/learn/azure/' }
    ]
  };

  return resourcesMap[domain] || [];
};

const LearningResources = ({ languages }) => {
  if (!languages || Object.keys(languages).length === 0) {
    return null;
  }

  const recommendedDomains = getDomainSuggestions(languages);
  if (recommendedDomains.length === 0) {
    return null;
  }

  // Get resources for the first recommended domain
  const resources = getLearningResources(recommendedDomains[0]);

  if (resources.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Learning Resources for {recommendedDomains[0]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
              <span className="font-medium">{resource.name}</span>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <span>Visit</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningResources;