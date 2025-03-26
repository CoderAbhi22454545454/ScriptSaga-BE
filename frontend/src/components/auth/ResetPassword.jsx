import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from '@/constants/constant';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const res = await api.post('/user/reset-password', {
                token,
                newPassword: data.password
            });

            if (res.data.success) {
                toast.success('Password has been reset successfully');
                navigate('/login');
            }
        } catch (error) {
            console.error('Reset password error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-gray-900">
                        Reset Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <Label htmlFor="password" className="text-gray-700">
                                New Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter new password"
                                {...register('password', { 
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    }
                                })}
                                className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword" className="text-gray-700">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                {...register('confirmPassword', { 
                                    required: 'Please confirm your password',
                                    validate: value => value === watch('password') || 'Passwords do not match'
                                })}
                                className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transform hover:scale-[1.02]" 
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword; 