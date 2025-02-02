import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
  return (
    <div className="min-h-screen flex justify-center bg-background items-center">
      <SignIn appearance={{ baseTheme: 'dark' }} />
    </div>
  );
};

export default SignInPage;
