import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from '@/constants/constant';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '@/redux/authSlice';
import store from '@/redux/store';
import { Loader2 } from 'lucide-react';
import Eye from '../ui/Eye'

const Register = () => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const dispatch = useDispatch();
    const { loading } = useSelector(store => store.auth)

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await api.get('/class/classes');
                setClasses(response.data.classes);
            } catch (error) {
                console.error('Error fetching classes:', error);
                toast.error('Failed to fetch classes. Please try again.');
            }

        };

        fetchClasses();
    }, []);

    const onSubmit = async (data) => {
        try {
            dispatch(setLoading(true))
            const formData = {
                ...data,
                role,
                classId: selectedClass
            };

            console.log('Submitting form data:', formData);

            const res = await api.post('/user/register', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.success) {

                navigate('/');
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error('An error occurred:', error.response?.data || error.message);
            toast.error('Registration failed. Please try again.');
        }
        finally {
            dispatch(setLoading(false))
        }
    };

    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[550px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Register!</h1>
                        <p className="text-balance text-muted-foreground mb-5">
                            Enter your details below to register your account!
                        </p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className='grid gap-4 grid-cols-2'>
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="Abhishek"
                                        {...register('firstName', { required: 'First name is required' })}
                                    />
                                    {errors.firstName && <p>{errors.firstName.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="Mohalkar"
                                        {...register('lastName', { required: 'Last name is required' })}
                                    />
                                    {errors.lastName && <p>{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className='grid gap-4 grid-cols-2'>
                                <div className="grid gap-2">
                                    <Label htmlFor="githubID">Github Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="CoderAbhi22454545454"
                                        {...register('githubID', { required: 'Github ID is required' })}
                                    />
                                    {errors.githubID && <p>{errors.githubID.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="githubID">LeetCode Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="CoderAbhi22454545454"
                                        {...register('leetCodeID', { required: 'Github ID is required' })}
                                    />
                                    {errors.leetCodeID && <p>{errors.leetCodeID.message}</p>}
                                </div>

                            </div>

                            <div className='grid gap-4 grid-cols-2'>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="example@example.com"
                                        {...register('email', { required: 'Email is required' })}
                                    />
                                    {errors.email && <p>{errors.email.message}</p>}
                                </div>
                            </div>
                        </div>
                            <div className='grid gap-4 grid-cols-2'>

                            <div className="relative grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                    type={passwordVisible ? "text" : "password"}
                                    {...register('password', { required: 'Password is required' })}
                                    className="relative w-full px-4 py-2 border border-gray-300 rounded-md pr-10"
                                    />
                                    <Eye isVisible={passwordVisible} onClick={togglePasswordVisibility} />
                                    </div>
                                    {errors.password && <p>{errors.password.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="classId">Class</Label>
                                    <Select
                                        onValueChange={(value) => setSelectedClass(value)}
                                    >
                                        <SelectTrigger className="w-100">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls._id} value={cls._id}>
                                                    {cls.className} ({cls.yearOfStudy} - {cls.branch} - {cls.division})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.classId && <p>{errors.classId.message}</p>}
                                </div>
                                <div className='grid gap-4 grid-cols-2'>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rollNo">Roll No</Label>
                                        <Input
                                            type="text"
                                            placeholder="33"
                                            {...register('rollNo', { required: 'Roll No is required' })}
                                        />
                                        {errors.rollNo && <p>{errors.rollNo.message}</p>}
                                    </div>
                                </div>
                            </div>

                            {
                                loading ? (
                                    <Button className="w-full mt-5"><Loader2 className='mr-2 animate-spin' /></Button>
                                ) : (
                                    <Button type="submit" className="w-full mt-5">
                                        Register
                                    </Button>
                                )
                            }
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="underline">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block"></div>
        </div>      
    );
};

export default Register;
