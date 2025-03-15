import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import Status from './Public/Status';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from './firebase';// Adjust this import based on your firebase config location

function Public() {
  const { orgId } = useParams();
  const [isValidOrg, setIsValidOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgDetails, setOrgDetails] = useState(null);

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        // Get organization document reference
        const orgRef = doc(db, 'organizations', orgId);
        const orgSnap = await getDoc(orgRef);

        const isValid = orgSnap.exists();
        setIsValidOrg(isValid);

        if (isValid) {
          // Set org details directly from the document data
          setOrgDetails(orgSnap.data());
        }
      } catch (error) {
        console.error('Error checking organization:', error);
        setIsValidOrg(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOrganization();
  }, [orgId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidOrg) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto">
      <main className="h-screen mx-auto px-2 md:p-6">
        <div className="flex items-center p-4">
          {orgDetails?.image_url && (
            <img 
              src={orgDetails.image_url} 
              alt="Organization logo" 
              className="w-12 h-12 rounded-full"
            />
          )}
          <h1 className="text-2xl font-bold text-foreground pl-4">
            {orgDetails?.name || 'Loading organization...'}
          </h1>
          <a href="https://github.com/dineshkidd/status24" target="_blank" className='opacity-80 underline text-blue-700 ml-auto pr-2'>Github</a>
        </div>       
        <Status orgId={orgId} />
      </main>
    </div>
  );
}

export default Public;