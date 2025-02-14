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
    points: "0"
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
      points: "0"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoName">Repository Name</Label>
            <Input
              id="repoName"
              value={formData.repoName}
              onChange={(e) => setFormData({ 
                ...formData, 
                repoName: e.target.value.toLowerCase().replace(/\s+/g, '-')
              })}
              required
              placeholder="e.g., assignment-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateRepo">Template Repository</Label>
            <Input
              id="templateRepo"
              value={formData.templateRepo}
              onChange={(e) => setFormData({ ...formData, templateRepo: e.target.value })}
              required
              placeholder="organization/repo-name"
            />
            <p className="text-sm text-gray-500">
              Format: organization/repo-name (e.g., your-org/assignment-template)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              min="0"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              required
            />
          </div>

          <Button type="submit">Create Assignment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;