import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Subscribers() {
  return (
    <div className="space-y-4">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage your subscribers and notifications</p>
        </CardContent>
      </Card>
    </div>
  );
}
