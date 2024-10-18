import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import ClassList from './ClassList';

const ClassesPage = () => {
    const [classes, setClasses] = useState([]);
    const navigate = useNavigate();

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

    const handleClassClick = (classId) => {
        navigate(`/admin/classes/${classId}`);
    };

    return (
        <Navbar>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">All Classes</h1>
                <ClassList classes={classes} onClassClick={handleClassClick} />
            </div>
        </Navbar>
    );
};

export default ClassesPage;