import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ClassList from './ClassList';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { Navbar } from '../shared/Navbar';
import StudentProgressMetrics from './StudentProgressMetrics';

const AdminDashboard = () => {
    const [classes, setClasses] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (user && user.role === 'admin') {
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
        }
    }, [user]);

    const handleClassClick = (classId) => {
        navigate(`/admin/class/${classId}`);
    };




    

    if (!user) {
        return <div className='flex justify-center items-center h-screen'>
            <Loader2 className="mr-2 h-10 w-10 animate-spin" />
        </div>;
    }

    return (
        <Navbar>
            <div className='ps-12'>
                <h1 className='text-2xl mb-4 font-semibold border-b-2 border-gray-300 pb-2 w-fit'>Welcome, Admin </h1>

                {user.role === 'admin' ? (
                    <>
                        <ClassList classes={classes} onClassClick={handleClassClick} />
                        <StudentProgressMetrics />
                    </>
                ) : (
                    <div>You do not have access to view this page.</div>
                )}
            </div>
        </Navbar>
    );
};

export default AdminDashboard;
