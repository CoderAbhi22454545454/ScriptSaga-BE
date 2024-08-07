import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";

const StudentList = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await api.get(`/class/classes/${classId}/students`);
                setStudents(response.data.students); 
            } catch (error) {
                console.error('Error fetching students:', error);
                toast.error('Failed to fetch students. Please try again.');
            }
        };

        fetchStudents();
    }, [classId]);

    return (
        <div>
            <h2>Students</h2>
            <ul>
                {students.map((student) => (
                    <li key={student._id}>
                        {student.firstName} {student.lastName} - {student.email}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentList;
