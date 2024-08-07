import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ClassList from './ClassList';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { logout } from '@/redux/authSlice';

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
        navigate(`/class/${classId}`);
    };




    const handelLogout = () => {
        dispatch(logout());

    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome, {user.firstName} {user.lastName}</h1>
            <button onClick={handelLogout}>Logout</button>

            {user.role === 'admin' ? (
                <ClassList classes={classes} onClassClick={handleClassClick} />
            ) : (
                <div>You do not have access to view this page.</div>
            )}
        </div>
    );
};

export default AdminDashboard;
