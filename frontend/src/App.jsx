import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Outlet, useParams, Navigate } from 'react-router-dom';
import SignInPage from './SignInPage';
import HomePage from './HomePage';
import { ProtectedRoute } from './ProtectedRoute';
import { UnprotectedRoute } from './UnprotectedRoute';
import Navbar from '@/components/Navbar';
import { dark } from '@clerk/themes';
import NotFound from './NotFound';
import './App.css';
import { Toaster } from "@/components/ui/sonner"
import Public from './Public';
import { Analytics } from "@vercel/analytics/react"

// Your Clerk Publishable Key (from Clerk Dashboard)
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Updated Layout component
function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar className="fixed top-0 left-0 right-0 z-50" />
      {/* Removed max-width constraint and adjusted padding */}
      <main className="pt-16 h-[calc(100vh-4rem)] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={{ baseTheme: dark }}>
      <Router>
        <Routes>
          {/* Routes that need common layout */}
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Sign-in page route without layout */}
          <Route
            path="/sign-in"
            element={
              <UnprotectedRoute>
                <SignInPage />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/:orgId"
            element={<Public />}
          />
          <Route
            path="/not-found"
            element={<NotFound />}
          />
        </Routes>
      </Router>
      <Toaster />
      <Analytics />
    </ClerkProvider>
  );
}

export default App;
