import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import api from '@/constants/constant';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setUser } from '@/redux/authSlice';
import store from '@/redux/store';
import { Loader2 } from 'lucide-react';
// import ThreeDModel from '../threeModel.jsx/ThreeDModel';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading } = useSelector(store => store.auth)

    const onSubmit = async (data) => {
        try {
            dispatch(setLoading(true))
            const res = await api.post('/user/login', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(res.data.message);

                if (res.data.user.role === "student") {
                    navigate('/');
                } else if (res.data.user.role === "admin") {
                    navigate('/admin');
                }
                return;
            }

        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            toast.error('Login failed. Please check your credentials and try again.');
        }
        finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[550px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Login</h1>
                        <p className="text-muted-foreground mb-5">
                            Enter your email and password to log in.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="example@example.com"
                                    {...register('email', { required: 'Email is required' })}
                                />
                                {errors.email && <p>{errors.email.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    {...register('password', { required: 'Password is required' })}
                                />
                                {errors.password && <p>{errors.password.message}</p>}
                            </div>
                            {
                                loading ? <Button className="w-full mt-5"><Loader2 className='mr-2 animate-spin' />Loging...</Button> : <Button type="submit" className="w-full mt-5">
                                    Login
                                </Button>
                            }
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don't have an account?{" "}
                        <Link to="/register" className="underline">
                            Register
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-muted lg:block relative">
                {/* <ThreeDModel /> */}
            </div>
        </div>
    );
};

export default Login;
