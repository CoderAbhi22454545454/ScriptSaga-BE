import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from '@/constants/constant';
import { Upload, Loader2 } from 'lucide-react';

const BulkUploadJSON = ({ classes, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid JSON file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedClass) {
      toast.error('Please select both a file and a class');
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        const response = await api.post('/user/bulk-upload-students-json', {
          students: jsonData,
          classId: selectedClass
        });

        if (response.data.success) {
          toast.success(`${response.data.students.length} students imported successfully`);
          setSelectedFile(null);
          if (onUploadSuccess) onUploadSuccess();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error uploading students');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(selectedFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload Students (JSON)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full"
          />

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !selectedClass || loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Students
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUploadJSON; 