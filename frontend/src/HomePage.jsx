import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserStore } from './store/userStore';
import AdminPage from './admin/AdminPage';
import Tenant from './Tenant';
import Loading from './Loading';

function HomePage() {
  const { user, isLoaded } = useUser();
  const setUser = useUserStore((state) => state.setUser);
  const setOrganization = useUserStore((state) => state.setOrganization);
  const organization = useUserStore((state) => state.organization);

  useEffect(() => {
    if (isLoaded && user) {
      // Set the Clerk user ID in our global state
      setUser(user);
      // Assuming organization info is stored in publicMetadata.organization
      setOrganization(user.organizationMemberships[0].organization || 'N/A');
    }
  }, [user, isLoaded, setUser, setOrganization]);

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className="h-full">
      {organization?.name === 'status24' ? <AdminPage /> : <Tenant />}
      {/* Add additional page content or redirection logic here */}
    </div>
  );
}

export default HomePage;