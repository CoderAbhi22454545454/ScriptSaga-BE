import React from "react";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/constants/constant";

const ClassList = ({ classes, onClassClick }) => {
  const handleDownload = async (classId, className) => {
    try {
      const response = await api.get(`class/${classId}/excel`, {
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

  return (
    <div className="py-6">
      <h2 className="text-xl font-semibold mb-4">Classes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="bg-blue-800 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Year : {cls.yearOfStudy}</h3>
                <p className="mt-0">
                  <span className="text-sm">Students:</span> {cls.totalStudents}
                </p>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Branch:</span> {cls.branch}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Division:</span> {cls.division}
              </p>
              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => onClassClick(cls._id)}
                  variant="default"
                >
                  View Details
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(cls._id, `${cls.yearOfStudy}_${cls.division}`);
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassList;
