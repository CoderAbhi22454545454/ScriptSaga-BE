import express from 'express';
import  { getStudentRepos  } from '../controllers/github.controller.js'

const router = express.Router()

router.get('/:userId/repos' , getStudentRepos )
// router.get('/:userId/profile', getUserGithubProfile);
// router.gest('/:userId/repos/with-commits' , getStudentReposWithCommits)
// router.get('/:userId/repos/:repoName/commits' , getStudentReposWithCommits)

export default router