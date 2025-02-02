import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

// Import shadcn UI components (adjust paths if necessary)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Import shadcn Select components
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import Loading from '../Loading';

// Replace Select imports with Combobox imports
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

function AdminPage() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  

  // States for "Create User (status24)" form
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [createUserResponse, setCreateUserResponse] = useState('');

  // States for "Create New Organization" form
  const [orgName, setOrgName] = useState('');
  const [createOrgResponse, setCreateOrgResponse] = useState('');

  // States for "Add User to Org" form
  const [orgId, setOrgId] = useState('');
  const [tenantUserEmail, setTenantUserEmail] = useState('');
  const [tenantUserName, setTenantUserName] = useState('');
  const [addUserResponse, setAddUserResponse] = useState('');

  // State for storing organizations fetched from your backend Clerk API endpoint
  const [organizations, setOrganizations] = useState([]);

  // State for controlling the popover
  const [open, setOpen] = useState(false);

  // Add this state for the combobox
  const [value, setValue] = useState("");

  // Extracted fetch function so it can be re-called
  const fetchOrganizations = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(import.meta.env.VITE_API_URL+'/admin/organizations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Expecting data.organizations to be an array of { id, name }
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [getToken]);

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(import.meta.env.VITE_API_URL+'/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          org: 'status24'
        }),
      });
      const data = await res.json();
      setCreateUserResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setCreateUserResponse('Error: ' + error.message);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(import.meta.env.VITE_API_URL+'/admin/create-org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orgName }),
      });
      const data = await res.json();
      setCreateOrgResponse(JSON.stringify(data, null, 2));
      // Refresh organizations list after successful org creation
      fetchOrganizations();
    } catch (error) {
      setCreateOrgResponse('Error: ' + error.message);
    }
  };

  const handleAddUserToOrg = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(import.meta.env.VITE_API_URL+'/admin/add-user-to-org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: tenantUserEmail,
          name: tenantUserName,
          orgId
        }),
      });
      const data = await res.json();
      setAddUserResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setAddUserResponse('Error: ' + error.message);
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  // Double-check user org before showing admin functionalities
  const org =
    user.organizationMemberships && user.organizationMemberships.length > 0
      ? user.organizationMemberships[0].organization
      : null;
  if (!org || org.name !== 'status24') {
    return <div className="p-6">You are not authorized to view this page.</div>;
  }

  return (
    <div className="min-h-screen w-full">
      <h1 className="mb-6 text-3xl font-semibold">Admin Page</h1>
      <p className="mb-8">Welcome, Admin! You have access because your organization is status24.</p>

      {/* Create User for status24 org */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Create User for status24 Org</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-5">
            <div>
              <Label htmlFor="userName" className="mb-2 block font-mono">Name</Label>
              <Input
                id="userName"
                type="text"
                placeholder="User Name"
                value={userName}
                required
                onChange={(e) => setUserName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="userEmail" className="mb-2 block font-mono">Email</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="User Email"
                value={userEmail}
                required
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="font-mono">Create</Button>
          </form>
          {createUserResponse && (
            <pre className="mt-4 rounded p-2 text-sm">{createUserResponse}</pre>
          )}
        </CardContent>
      </Card>

      {/* Create New Organization */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrg} className="space-y-5">
            <div>
              <Label htmlFor="orgName" className="mb-2 block font-mono">Organization Name</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Organization Name"
                value={orgName}
                required
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="font-mono">Create</Button>
          </form>
          {createOrgResponse && (
            <pre className="mt-4 rounded p-2 text-sm">{createOrgResponse}</pre>
          )}
        </CardContent>
      </Card>

      {/* Add User to a Specific Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add User to an Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUserToOrg} className="space-y-5">
            <div>
              <Label htmlFor="orgId" className="mb-2 block font-mono">Organization</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-mono"
                  >
                    {value
                      ? organizations.find((org) => org.id === value)?.name
                      : "Select organization..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1
                    return 0
                  }}>
                    <CommandInput placeholder="Search organization..." />
                    <CommandList>
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {organizations.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={(currentValue) => {
                              const selectedOrg = organizations.find(o => o.name.toLowerCase() === currentValue.toLowerCase());
                              if (selectedOrg) {
                                setValue(selectedOrg.id);
                                setOrgId(selectedOrg.id);
                              }
                              setOpen(false);
                            }}
                          >
                            {org.name}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                value === org.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="tenantUserName" className="mb-2 block font-mono">User Name</Label>
              <Input
                id="tenantUserName"
                type="text"
                placeholder="User Name"
                value={tenantUserName}
                required
                onChange={(e) => setTenantUserName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="tenantUserEmail" className="mb-2 block font-mono">User Email</Label>
              <Input
                id="tenantUserEmail"
                type="email"
                placeholder="User Email"
                value={tenantUserEmail}
                required
                onChange={(e) => setTenantUserEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="font-mono">Add User</Button>
          </form>
          {addUserResponse && (
            <pre className="mt-4 rounded p-2 text-sm">{addUserResponse}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPage; 