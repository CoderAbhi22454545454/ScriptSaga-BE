import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { BarChart, Heading3, LineChart } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from 'sonner';
import CalHeatMap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';


const StudentDetailGit = () => {

    const { userId } = useParams();
    const [student, setStudent] = useState()
    const [classData, setClassData] = useState()
    // const [studentRepos, setStudentRepos] = useState([])
    const [studentLeetCode, setStudentLeetCode] = useState({})

    useEffect(() => {
        const fetchStudentData = async () => {
            try {

                const [studentResponse,
                    //  studentGithubReposResponse,
                      studentLeetCodeReponse] = await Promise.all([
                    api.get(`/user/${userId}`), // Fetch student details
                    // api.get(`${userId}/repos/with-commits`), // Fetch repositories and their commits
                    api.get(`lcodeprofile/${userId}/`) // Fetch LeetCode Profile
                ]);

                const student = studentResponse.data.user;
                setStudent(student);

                // const studentRepos = studentGithubReposResponse.data;
                // setStudentRepos(studentRepos);

                const studentLeetRepos = studentLeetCodeReponse.data;
                setStudentLeetCode(studentLeetRepos)

                // Fetch class data only if the student has a classId
                if (student.classId) {
                    const classResponse = await api.get('/class/classes');
                    const classes = classResponse.data.classes;
                    const studentClass = classes.find(cls => cls._id === student.classId);
                    setClassData(studentClass);
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
                toast.error('Failed to fetch student details. Please try again.');
            }
        };
        fetchStudentData();
    }, [userId]);


    if (!student) return <h4>Loading....</h4>
    // const totalCommits = studentRepos.reduce((sum, repo) => sum + repo.totalCommits, 0);



    return (
        <Navbar>
            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {student.firstName || `No data`} {student.lastName}
                            </CardTitle>
                            <Badge variant="outline" className="mt-2 w-fit bg-green-300 border-0">
                                Student
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Email:</strong> {student.email || "No Data"}</p>
                            <p><strong>Year of Study:</strong> {classData?.yearOfStudy || "No class found"}</p>
                            <p><strong>Branch:</strong> {classData?.branch || "No class found"}</p>
                            <p><strong>Division:</strong> {classData?.division || "No class found"}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">GitHub Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-lg font-medium">Total Repositories</p>
                                    {/* <p className="text-3xl">{studentRepos.length}</p> */}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-medium">Total Commits</p>
                                    {/* <p className="text-3xl">{totalCommits}</p> */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className='mt-6'>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Leetcode Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {
                                studentLeetCode ? (
                                    <div>
                                        <div className='flex '>
                                            <p>Leetcode Username : </p>
                                            <p> {studentLeetCode.basicProfile.username ?? 'No Rank'} </p>
                                        </div>
                                        <div className='flex '>
                                            <p>Ranking : </p>
                                            <p> {studentLeetCode.basicProfile.ranking ?? 'No Rank'} </p>
                                        </div>
                                        <div className='flex mt-2'>
                                            <p> Contests Attended : </p>
                                            <p> {studentLeetCode.contests.contestAttend ?? 'No contests yet'} </p>
                                        </div>
                                        <div className='flex mt-4'>
                                            <p>Badges Count : </p>
                                            <p> {studentLeetCode.badges.badgesCount ?? 'No Batches yet'} </p>
                                        </div>
                                        <div className='p-4 mt-3 rounded-lg shadow-md border-0'>
                                            {studentLeetCode.badges.badges.map((badge, key) => (
                                                <div className='flex' key={key}>
                                                    <img src={badge.icon} width="40px" />
                                                    <p>{badge.displayName}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className='p-4 mt-3 rounded-lg shadow-md border-0'>
                                            <div className='flex'>
                                                <div className='mr-8 pr-5 border-r-2'>
                                                    <h3 className='text-lg  font-medium'>Total Solved </h3>
                                                    <h2 className='text-xl'>{studentLeetCode.completeProfile.solvedProblem || "No questions Solved"} </h2>
                                                </div>
                                                <div className='mr-8 pr-5 border-r-2'>
                                                    <h3 className='text-lg'>Easy Solved </h3>
                                                    <h2 className='text-xl'>{studentLeetCode.completeProfile.easySolved || "No questions Solved"}</h2>
                                                </div>
                                                <div className='mr-8 pr-5 border-r-2'>
                                                    <h3 className='text-lg'>Medium Solved </h3>
                                                    <h2 className='text-xl'>{studentLeetCode.completeProfile.mediumSolved || "No questions Solved"}</h2>
                                                </div>
                                                <div className='mr-8 pr-5 border-r-2'>
                                                    <h3 className='text-lg'>Hard Solved </h3>
                                                    <h2 className='text-xl'>{studentLeetCode.completeProfile.hardSolved || "No questions Solved"}</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p>Meow</p>
                                )
                            }

                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Repositories</CardTitle>
                        </CardHeader>
                        {/* <CardContent className="max-h-[470px] overflow-auto">
                            {
                                studentRepos.length > 0 ?

                                    studentRepos.map((repo, index) => (
                                        <Accordion collapsible className="mb-4 p-4 rounded-lg shadow-md border-0" key={index}>
                                            <AccordionItem value={`${index + 1}`} className="border-0">
                                                <AccordionTrigger className="text-start">
                                                    <div className="flex justify-between flex-col text-start">
                                                        <p className="font-medium text-lg">Repo Name :{repo.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">Repo Description : {repo.description}</p>
                                                        <p className="text-medium">Commits: {repo.totalCommits}</p>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>

                                                    {
                                                        repo.commits.length > 0 ? (
                                                            repo.commits.map((commit, commitIndex) => (
                                                                <div key={commitIndex} className='mb-10 bg-purple-100 p-5 border'>
                                                                    <p>{commit.message}</p>
                                                                    <p>{commit.date}</p>
                                                                    <p>{commit.author}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p>No commits by this student.</p>
                                                        )
                                                    }

                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    ))
                                    :
                                    (
                                        <div>No Repositories found</div>
                                    )

                            }
                        </CardContent> */}
                    </Card>
                </div>



                {/* Progress Charts */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="w-5 h-5" />
                                Commits Over Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Insert your bar chart component here */}
                            <div className="h-48">
                                {/* Bar Chart Placeholder */}
                                <div className="bg-muted h-full flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Bar Chart</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LineChart className="w-5 h-5" />
                                Commit Frequency
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Insert your line chart component here */}
                            <div className="h-48">
                                {/* Line Chart Placeholder */}
                                <div className="bg-muted h-full flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Line Chart</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Navbar>
    );
};

export default StudentDetailGit;
