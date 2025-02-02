import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Custom hook that fetches organization details from the backend.
 * It returns:
 *   - organization: the organization object (e.g. {name: 'status24', ...})
 *   - loading: boolean loading state
 *   - error: any error that occurred during fetch
 */
export function useOrganization() {
  const { getToken } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrg() {
      try {
        // Retrieve the access token (if needed by your backend).
        const token = await getToken({ template: 'default' });
        const response = await fetch(import.meta.env.VITE_API_URL+'/user/org', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        // Expecting data to be like: { organization: { name: "status24", ... } }
        setOrganization(data.organization);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [getToken]);

  return { organization, loading, error };
} 