import api from '../api';

export const updateMetrics = async (userId, repos, leetCodeData) => {
  try {
    // Calculate basic metrics from repos
    const metrics = {
      totalRepos: repos.length,
      totalCommits: repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0),
      activeRepos: repos.filter(repo => (repo.commits?.length || 0) > 0).length,
      totalStars: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
      totalForks: repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
    };
    
    // Send metrics to server for storage and advanced processing
    const response = await api.post(`/metrics/${userId}`, {
      repos,
      leetcode: leetCodeData
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update metrics');
    }
    
    return {
      ...metrics,
      ...response.data.metrics
    };
  } catch (error) {
    console.error('Error updating metrics:', error);
    // Return the basic metrics even if server update fails
    return {
      totalRepos: repos.length,
      totalCommits: repos.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0),
      activeRepos: repos.filter(repo => (repo.commits?.length || 0) > 0).length,
      totalStars: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
      totalForks: repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
    };
  }
};