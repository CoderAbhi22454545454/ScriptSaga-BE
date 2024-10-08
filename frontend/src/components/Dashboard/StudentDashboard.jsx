import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ClassList from './ClassList';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { logout } from '@/redux/authSlice';

const StudentDashboard = () => {
    const [classes, setClasses] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();

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
            {user.role === 'student' ? (
                <div>
                    Hello studnet
                </div>
            ) : (
                <div>You do not have access to view this page.</div>
            )}
        </div>
    );
};

export default StudentDashboard;
