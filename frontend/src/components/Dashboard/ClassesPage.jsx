import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/constants/constant';
import { toast } from "sonner";
import { Navbar } from '../shared/Navbar';
import ClassList from './ClassList';
import { Loader2 } from 'lucide-react';


const handleDownload = async (classId, className) => {
    try {
      const response = await api.get(`/${classId}/excel`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Class_${className}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download excel file');
    }
  };


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
                <ClassList classes={classes} onClassClick={handleClassClick} onDownload={handleDownload} />
            </div>
        </Navbar>
    );
};

export default ClassesPage;