import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/constants/constant';
import { toast } from 'sonner';

const MessageStudent = ({ studentId }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/teacher/feedback', {
        studentId,
        message
      });
      
      toast.success('Message sent successfully');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message');
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
          />
          <Button type="submit">Send Message</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MessageStudent;