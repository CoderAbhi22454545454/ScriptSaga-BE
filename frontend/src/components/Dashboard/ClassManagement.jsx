import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/constants/constant";
import { Loader2 } from "lucide-react";
import { Navbar } from "../shared/Navbar";
const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    yearOfStudy: "",
    branch: "",
    division: "",
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/class/classes");
      setClasses(response.data.classes);
    } catch (error) {
      toast.error("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setIsEditing(true);
    setEditingId(cls._id);
    setFormData({
      yearOfStudy: cls.yearOfStudy,
      branch: cls.branch,
      division: cls.division,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const className = `${formData.yearOfStudy}-${formData.branch}-${formData.division}`;

      if (isEditing) {
        await api.put(`/class/${editingId}`, { ...formData, className });
        toast.success("Class updated successfully");
        setIsEditing(false);
        setEditingId(null);
      } else {
        await api.post("/class/create", { ...formData, className });
        toast.success("Class created successfully");
      }

      fetchClasses();
      setFormData({ yearOfStudy: "", branch: "", division: "" });
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update class" : "Failed to create class"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/class/${id}`);
      toast.success("Class deleted successfully");
      fetchClasses();
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <Navbar>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Class" : "Add New Class"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                value={formData.yearOfStudy}
                onChange={(e) =>
                  setFormData({ ...formData, yearOfStudy: e.target.value })
                }
              >
                <option value="">Select Year of Study</option>
                <option value="FE">FE</option>
                <option value="SE">SE</option>
                <option value="TE">TE</option>
                <option value="BE">BE</option>
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
              >
                <option value="">Select Branch</option>
                <option value="CS">CS</option>
                <option value="AIDS">AIDS</option>
                <option value="IT">IT</option>
              </select>
              <Input
                placeholder="Division"
                required
                value={formData.division}
                onChange={(e) =>
                  setFormData({ ...formData, division: e.target.value })
                }
              />
              <Button type="submit">
                {isEditing ? "Update Class" : "Add Class"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setFormData({ yearOfStudy: "", branch: "", division: "" });
                  }}
                  className="ml-2"
                >
                  Cancel
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Class List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls._id}
                    className="flex justify-between items-center p-4 border rounded"
                  >
                    <div>
                      <p className="font-semibold">{cls.yearOfStudy} Year</p>
                      <p>
                        {cls.branch} - {cls.division}
                      </p>
                      
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => handleEdit(cls)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(cls._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Navbar>
  );
};

export default ClassManagement;
