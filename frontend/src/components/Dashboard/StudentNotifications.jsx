import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, User, GraduationCap } from 'lucide-react';

const StudentNotifications = ({ notifications = [] }) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification, index) => (
        <Card key={index} className="overflow-hidden border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {notification.type || "Teacher Feedback"}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{notification.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <GraduationCap className="h-3 w-3" />
                    <span>{notification.className}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentNotifications;