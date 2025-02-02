import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Loading from './Loading';
export function UnprotectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    // Optionally show a loading state.
    return <Loading />;
  }

  if (isSignedIn) {
    // Redirect signed in users away from sign-in page.
    return <Navigate to="/" replace />;
  }

  return children;
} 