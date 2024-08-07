import express from 'express';
import  { getStudentRepos, getStudentRepoCommit } from '../controllers/github.controller.js'

const router = express.Router()

router.get('/:userId/repos' , getStudentRepos)
router.get('/:userId/repos/:repoName/commits' , getStudentRepoCommit)

export default router