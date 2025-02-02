import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your organization settings</p>
        </CardContent>
      </Card>
    </div>
  );
}
