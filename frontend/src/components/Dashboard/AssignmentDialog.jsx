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
    repoUrl: "",
    points: "10"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate GitHub repository URL
    const urlRegex = /^https?:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_]+\/?$/;
    if (!urlRegex.test(formData.repoUrl)) {
      toast.error('Please enter a valid GitHub repository URL (https://github.com/username/repo)');
      return;
    }

    await onSubmit(formData);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      repoUrl: "",
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
            <Label htmlFor="repoUrl">
              GitHub Repository URL
            </Label>
            <Input
              id="repoUrl"
              name="repoUrl"
              value={formData.repoUrl}
              onChange={handleChange}
              placeholder="https://github.com/username/repository"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Create a GitHub repository manually and paste its URL here. Students will clone this repository.
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