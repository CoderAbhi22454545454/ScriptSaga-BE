import React, { useState, useRef, useEffect } from 'react';
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
import { Loader2, Code } from 'lucide-react';
import Eye from '../ui/Eye';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.auth);
    
    // Mouse follower refs
    const cursorRef = useRef(null);
    const cursorDotRef = useRef(null);
    const [isOverForm, setIsOverForm] = useState(false);
    
    useEffect(() => {
        // Mouse follower effect
        const cursor = cursorRef.current;
        const cursorDot = cursorDotRef.current;
        
        if (cursor && cursorDot) {
            document.addEventListener('mousemove', (e) => {
                const posX = e.clientX;
                const posY = e.clientY;
                
                cursor.style.left = `${posX}px`;
                cursor.style.top = `${posY}px`;
                
                // Add a slight delay to the dot for a trailing effect
                setTimeout(() => {
                    cursorDot.style.left = `${posX}px`;
                    cursorDot.style.top = `${posY}px`;
                }, 100);
            });
        }
        
        return () => {
            document.removeEventListener('mousemove', () => {});
        };
    }, []);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    
    const handleFormMouseEnter = () => {
        setIsOverForm(true);
    };
    
    const handleFormMouseLeave = () => {
        setIsOverForm(false);
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Custom cursor */}
            <div 
                ref={cursorRef} 
                className={`fixed w-16 h-16 rounded-full bg-indigo-400 filter blur-xl pointer-events-none z-10 transition-opacity duration-300 ${isOverForm ? 'opacity-0' : 'opacity-20'}`}
                style={{ transform: 'translate(-50%, -50%)' }}
            ></div>
            <div 
                ref={cursorDotRef} 
                className={`fixed w-4 h-4 rounded-full bg-indigo-600 pointer-events-none z-10 transition-opacity duration-300 ${isOverForm ? 'opacity-0' : 'opacity-100'}`}
                style={{ transform: 'translate(-50%, -50%)' }}
            ></div>
            
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            </div>
            
            <div className="w-full max-w-md z-10" onMouseEnter={handleFormMouseEnter} onMouseLeave={handleFormMouseLeave}>
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                        <Code className="h-10 w-10 text-indigo-600" />
                        <h1 className="text-4xl font-bold text-gray-800 ml-2">ScriptSaga</h1>
                    </div>
                    <p className="text-gray-600">Your Coding Journey Continues Here</p>
                </div>
                
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-gray-100">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold text-gray-800">Sign in to your account</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <Label htmlFor="email" className="text-gray-700">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    {...register('email', { required: 'Email is required' })}
                                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-gray-700">
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        type={passwordVisible ? "text" : "password"}
                                        placeholder="Enter your password"
                                        {...register("password", { required: "Password is required" })}
                                        className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600 pr-10"
                                    />
                                    <Eye 
                                        isVisible={passwordVisible} 
                                        onClick={togglePasswordVisibility} 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    />
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                                <div className="text-right mt-2">
                                    <Link 
                                        to="/forgot-password" 
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transform hover:scale-[1.02]" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-indigo-600 hover:text-indigo-500 underline underline-offset-2"
                            >
                                Create account
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;