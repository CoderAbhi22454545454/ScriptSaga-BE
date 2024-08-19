import express from 'express';
import  {  getStudentRepoCommit, getStudentRepos  } from '../controllers/github.controller.js'

const router = express.Router()

router.get('/:userId/repos' , getStudentRepos )
router.get('/:userId/repos/with-commits' , getStudentRepoCommit)
// router.get('/:userId/repos/:repoName/commits' , getStudentReposWithCommits)

export default router