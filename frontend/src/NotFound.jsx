import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './components/ui/button';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-gray-300 mb-8">Page Not Found</p>
      <Button>
        <Link
          to="/"
          className="px-6 py-3 rounded-md shadow transition all duration-200"
        >Go Home</Link>
      </Button>
    </div>
  );
}

export default NotFound; 