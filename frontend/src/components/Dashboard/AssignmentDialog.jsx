import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AssignmentDialog = ({ isOpen, setIsOpen, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    repoName: "",
    templateRepo: "", // Format: organization/repo-name
    points: "10"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate GitHub repository format
    const repoRegex = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_]+$/;
    if (!repoRegex.test(formData.templateRepo)) {
      toast.error('Template repository should be in format: organization/repo-name');
      return;
    }

    await onSubmit(formData);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      repoName: "",
      templateRepo: "",
      points: "10"
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              name="points"
              type="number"
              min="0"
              value={formData.points}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="templateRepo">
              Template Repository (format: organization/repo-name)
            </Label>
            <div className="flex items-center">
              <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-md text-gray-500">
                https://github.com/
              </span>
              <Input
                id="templateRepo"
                name="templateRepo"
                value={formData.templateRepo}
                onChange={handleChange}
                className="rounded-l-none"
                placeholder="organization/repo-name"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This should be a template repository that will be used to create student repositories
            </p>
          </div>
          <div>
            <Label htmlFor="repoName">Repository Name Base</Label>
            <Input
              id="repoName"
              name="repoName"
              value={formData.repoName}
              onChange={handleChange}
              placeholder="assignment-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Student repositories will be created as: {formData.repoName}-{"{student-roll-no}"}
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Assignment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;