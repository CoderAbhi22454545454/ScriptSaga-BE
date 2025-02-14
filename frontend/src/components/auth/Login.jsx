import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import Eye from '../ui/Eye';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.auth);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const onSubmit = async (data) => {
        try {
            dispatch(setLoading(true));
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
                } else if (res.data.user.role === "teacher") {
                    navigate('/teacher');
                }
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            toast.error('Login failed. Please check your credentials and try again.');
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-200 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 " > 
            <div className="random">
                        <h1>ScripSaga</h1>
                        <h1>ScripSaga</h1>
                        <h1>ScripSaga</h1>

                    </div>
            <Card className="w-full max-w-md z-10">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-extrabold text-gray-900">Login to Your Account</CardTitle>
                </CardHeader>
                <CardContent>
                
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 z-10">
                        <div>
                            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                {...register('email', { required: 'Email is required' })}
                                className="mt-1"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </Label>
                            <div className="relative mt-1">
                                <Input
                                    id="password"
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder="Enter your password"
                                    {...register("password", { required: "Password is required" })}
                                    className="pr-10"
                                />
                                <Eye isVisible={passwordVisible} onClick={togglePasswordVisibility} />
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Log in"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Register here
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;