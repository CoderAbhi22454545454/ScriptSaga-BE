import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Code, 
  Terminal, 
  CheckCircle2, 
  ChevronRight,
  Github,
  Lightbulb,
  BookOpen,
  Rocket,
  Award,
  Zap
} from "lucide-react";

const GitHubTutorial = ({ userId }) => {
  // Create a unique storage key for each user
  const storageKey = `github-tutorial-progress-${userId || 'anonymous'}`;
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState("basics");
  
  // Initialize completedSteps from localStorage or empty array
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading completed steps from localStorage:", e);
      return [];
    }
  });

  // Save completedSteps to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedSteps));
    } catch (e) {
      console.error("Error saving completed steps to localStorage:", e);
    }
  }, [completedSteps, storageKey]);

  const markStepComplete = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps(prev => [...prev, stepIndex]);
    }
  };

  // Clear progress function (add a button for this if needed)
  const clearProgress = () => {
    setCompletedSteps([]);
    localStorage.removeItem(storageKey);
  };

  const basicSteps = [
    {
      title: "Create a GitHub Account",
      icon: <Github className="h-8 w-8 text-blue-500" />,
      description: "Sign up for a free GitHub account at github.com if you haven't already.",
      command: "# No command needed - visit github.com",
      tip: "Use your school email for student benefits!",
      link: "https://github.com/signup",
      animation: "slide-right"
    },
    {
      title: "Install Git",
      icon: <Terminal className="h-8 w-8 text-green-500" />,
      description: "Download and install Git on your computer to interact with GitHub repositories.",
      command: "# Check if Git is installed\ngit --version",
      tip: "Git is different from GitHub. Git is the version control system, GitHub is the hosting service.",
      link: "https://git-scm.com/downloads",
      animation: "slide-left"
    },
    {
      title: "Configure Git",
      icon: <Code className="h-8 w-8 text-purple-500" />,
      description: "Set up your identity in Git so your commits are properly attributed.",
      command: "git config --global user.name \"Your Name\"\ngit config --global user.email \"your.email@example.com\"",
      tip: "Use the same email you used for your GitHub account.",
      link: "https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup",
      animation: "slide-right"
    },
    {
      title: "Clone a Repository",
      icon: <GitBranch className="h-8 w-8 text-orange-500" />,
      description: "Copy a repository from GitHub to your local machine.",
      command: "git clone https://github.com/username/repository.git",
      tip: "You can find the clone URL by clicking the green 'Code' button on any repository.",
      link: "https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository",
      animation: "slide-left"
    }
  ];

  const workflowSteps = [
    {
      title: "Create a Branch",
      icon: <GitBranch className="h-8 w-8 text-blue-500" />,
      description: "Create a new branch to work on a feature or fix without affecting the main code.",
      command: "git checkout -b feature-branch-name",
      tip: "Name your branch something descriptive related to what you're working on.",
      link: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository",
      animation: "slide-right"
    },
    {
      title: "Make Changes",
      icon: <Code className="h-8 w-8 text-green-500" />,
      description: "Edit files, add new ones, or delete as needed for your task.",
      command: "# Edit files with your favorite editor\ncode .",
      tip: "Make small, focused changes that accomplish one thing well.",
      link: null,
      animation: "slide-left"
    },
    {
      title: "Stage Changes",
      icon: <GitCommit className="h-8 w-8 text-purple-500" />,
      description: "Add your modified files to the staging area before committing.",
      command: "git add filename.txt\n# Or add all changes\ngit add .",
      tip: "Use 'git status' to see which files have been modified.",
      link: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository",
      animation: "slide-right"
    },
    {
      title: "Commit Changes",
      icon: <GitCommit className="h-8 w-8 text-orange-500" />,
      description: "Save your staged changes with a descriptive message.",
      command: "git commit -m \"Add feature X to solve problem Y\"",
      tip: "Write clear commit messages that explain what and why, not how.",
      link: "https://github.com/git-guides/git-commit",
      animation: "slide-left"
    },
    {
      title: "Push to GitHub",
      icon: <GitPullRequest className="h-8 w-8 text-red-500" />,
      description: "Upload your commits to the remote repository on GitHub.",
      command: "git push origin feature-branch-name",
      tip: "If this is your first push to a new branch, use -u to set the upstream: git push -u origin feature-branch-name",
      link: "https://github.com/git-guides/git-push",
      animation: "slide-right"
    },
    {
      title: "Create Pull Request",
      icon: <GitPullRequest className="h-8 w-8 text-indigo-500" />,
      description: "Request that your changes be pulled into the main branch.",
      command: "# No command - done on GitHub website",
      tip: "Provide a clear description of your changes and reference any related issues.",
      link: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request",
      animation: "slide-left"
    }
  ];

  const advancedSteps = [
    {
      title: "Resolve Merge Conflicts",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      description: "Learn how to handle conflicts when multiple people change the same code.",
      command: "# After git pull shows conflicts\ngit status\n# Edit files to resolve conflicts\ngit add .\ngit commit -m \"Resolve merge conflicts\"",
      tip: "Always pull the latest changes before starting work to minimize conflicts.",
      link: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line",
      animation: "slide-right"
    },
    {
      title: "Code Reviews",
      icon: <BookOpen className="h-8 w-8 text-purple-500" />,
      description: "Learn how to review others' code and respond to feedback on your own.",
      command: "# No command - done on GitHub website",
      tip: "Be constructive and specific in your feedback. Focus on the code, not the person.",
      link: "https://github.com/features/code-review/",
      animation: "slide-left"
    },
    {
      title: "GitHub Actions",
      icon: <Rocket className="h-8 w-8 text-blue-500" />,
      description: "Automate your workflow with GitHub's built-in CI/CD platform.",
      command: "# Create a workflow file\nmkdir -p .github/workflows\ntouch .github/workflows/main.yml",
      tip: "Start with simple workflows like running tests or linting before moving to deployment.",
      link: "https://github.com/features/actions",
      animation: "slide-right"
    },
    {
      title: "Open Source Contributions",
      icon: <Award className="h-8 w-8 text-green-500" />,
      description: "Learn how to contribute to open source projects on GitHub.",
      command: "# Fork the repository on GitHub\ngit clone https://github.com/your-username/repository.git\ngit remote add upstream https://github.com/original-owner/repository.git",
      tip: "Start with small contributions like documentation or fixing typos before tackling larger features.",
      link: "https://opensource.guide/how-to-contribute/",
      animation: "slide-left"
    }
  ];

  const getSteps = () => {
    switch (activeTab) {
      case "basics":
        return basicSteps;
      case "workflow":
        return workflowSteps;
      case "advanced":
        return advancedSteps;
      default:
        return basicSteps;
    }
  };

  const steps = getSteps();
  
  // Calculate progress percentage based on the current tab's steps
  const tabStepIndices = steps.map((_, index) => index);
  const completedTabSteps = tabStepIndices.filter(index => completedSteps.includes(index));
  const tabProgressPercentage = steps.length > 0 
    ? (completedTabSteps.length / steps.length) * 100 
    : 0;
  
  // Calculate overall progress
  const allSteps = [...basicSteps, ...workflowSteps, ...advancedSteps];
  const progressPercentage = allSteps.length > 0 
    ? (completedSteps.length / allSteps.length) * 100 
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Github className="h-6 w-6" />
            Learn GitHub
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearProgress}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            Reset Progress
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 bg-gray-50 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics">GitHub Basics</TabsTrigger>
              <TabsTrigger value="workflow">Git Workflow</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Topics</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 mt-1" />
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  activeStep === index 
                    ? 'border-blue-500 shadow-md' 
                    : completedSteps.includes(index)
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-blue-200'
                } cursor-pointer`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {completedSteps.includes(index) ? (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      {step.link && (
                        <a 
                          href={step.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Learn more
                        </a>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mt-1">{step.description}</p>
                    
                    {activeStep === index && (
                      <div className="mt-4 space-y-3">
                        {step.command && (
                          <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm overflow-x-auto">
                            {step.command.split('\n').map((line, i) => (
                              <div key={i} className={line.startsWith('#') ? 'text-gray-500' : ''}>
                                {line}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {step.tip && (
                          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-md text-sm">
                            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-800">{step.tip}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStep(Math.max(0, activeStep - 1));
                            }}
                            disabled={activeStep === 0}
                          >
                            Previous
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markStepComplete(index);
                              if (activeStep < steps.length - 1) {
                                setActiveStep(activeStep + 1);
                              }
                            }}
                            className={completedSteps.includes(index) ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {completedSteps.includes(index) ? "Completed ✓" : "Mark as Complete"}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStep(Math.min(steps.length - 1, activeStep + 1));
                            }}
                            disabled={activeStep === steps.length - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 border-t">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Lightbulb className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Pro Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                {activeTab === "basics" 
                  ? "GitHub offers student benefits through the GitHub Student Developer Pack. It includes free access to developer tools, cloud resources, and more!"
                  : activeTab === "workflow"
                    ? "Commit early and often! Small, frequent commits make it easier to track changes and fix issues if something goes wrong."
                    : "Contribute to open source projects to build your portfolio and gain real-world experience working with other developers."}
              </p>
              <a 
                href={activeTab === "basics" 
                  ? "https://education.github.com/pack" 
                  : activeTab === "workflow"
                    ? "https://github.com/git-guides"
                    : "https://github.com/topics/good-first-issue"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-flex items-center"
              >
                Learn more <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubTutorial;