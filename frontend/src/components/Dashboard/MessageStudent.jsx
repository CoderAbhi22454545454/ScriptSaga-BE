import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/constants/constant';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

const MessageStudent = ({ studentId }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!studentId) {
      toast.error('Student ID is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData = {
        studentId,
        message: message.trim(),
        teacherId: user?._id // Get teacherId from Redux state
      };

      console.log('Sending feedback with data:', requestData);
      
      const response = await api.post('/teacher/feedback', requestData);
      
      console.log('Feedback response:', response.data);
      
      if (response.data.success) {
        toast.success('Message sent successfully');
        setMessage('');
      } else {
        toast.error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message to Student</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !message.trim()}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MessageStudent;