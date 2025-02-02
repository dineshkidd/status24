import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Members() {
  return (
    <div className="space-y-4">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </CardContent>
      </Card>
    </div>
  );
}
