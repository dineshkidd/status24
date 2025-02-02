import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import Status from './Public/Status';



function Public() {
  const { orgId } = useParams();
  const [isValidOrg, setIsValidOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgDetails, setOrgDetails] = useState(null);

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/organizations-list');
        const data = await response.json();
        const isValid = data.organizations.includes(orgId);
        setIsValidOrg(isValid);

        if (isValid) {
          // Fetch org details if organization is valid
          const detailsResponse = await fetch(`${import.meta.env.VITE_API_URL}/org-details?org_id=${orgId}`);
          const orgData = await detailsResponse.json();
          setOrgDetails(orgData);
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
      <main className="h-screen mx-auto p-6">
        <div className="flex items-center space-x-4">
          {orgDetails?.image_url && (
            <img 
              src={orgDetails.image_url} 
              alt="Organization logo" 
              className="w-12 h-12 rounded-full"
            />
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {orgDetails?.name || 'Loading organization...'}
          </h1>
        </div>
        <Status orgId={orgId} />
      </main>
    </div>
  );
}

export default Public;