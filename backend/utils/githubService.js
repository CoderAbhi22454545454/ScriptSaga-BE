
class GitHubService {
  constructor(accessToken) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async createRepoFromTemplate(templateRepo, newRepoName, organization) {
    const [owner, repo] = templateRepo.split('/');
    
    try {
      const response = await this.octokit.repos.createUsingTemplate({
        template_owner: owner,
        template_repo: repo,
        owner: organization,
        name: newRepoName,
        private: true,
        include_all_branches: true
      });

      return response.data.html_url;
    } catch (error) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  async addCollaborator(repoName, username, permission = 'push') {
    try {
      await this.octokit.repos.addCollaborator({
        owner: organization,
        repo: repoName,
        username,
        permission
      });
    } catch (error) {
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }
}

export default GitHubService;