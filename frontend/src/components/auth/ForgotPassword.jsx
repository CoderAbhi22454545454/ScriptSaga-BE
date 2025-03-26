import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import api from '@/constants/constant';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ForgotPassword = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const res = await api.post('/user/forgot-password', data);

            if (res.data.success) {
                toast.success('Password reset instructions have been sent to your email');
            }
        } catch (error) {
            console.error('Forgot password error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to send reset instructions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-gray-900">
                        Forgot Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                {...register('email', { 
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                                className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transform hover:scale-[1.02]" 
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Instructions'}
                        </Button>

                        <div className="text-center mt-4">
                            <Link 
                                to="/login" 
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword; 