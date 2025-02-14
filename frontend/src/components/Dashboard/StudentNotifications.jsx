import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const StudentNotifications = ({ notifications }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <div 
              key={index}
              className="p-3 border-b last:border-b-0"
            >
              <p className="text-sm">{notification.message}</p>
              <small className="text-gray-500">
                {new Date(notification.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No notifications yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotifications;