import React from "react";
import { Navbar } from "@/components/shared/Navbar";
import GitHubTutorial from "@/components/Dashboard/Github/GitHubTutorial";
import { useSelector } from "react-redux";

const GitHubLearningPage = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">GitHub Learning Center</h1>
        <p className="text-gray-600 mb-8">
          Learn how to use GitHub effectively for your projects and assignments. 
          Follow the interactive tutorial below to master Git and GitHub.
        </p>
        
        {userId && <GitHubTutorial userId={userId} />}
      </div>
    </Navbar>
  );
};

export default GitHubLearningPage;