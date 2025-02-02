import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Globe, Database, ArrowLeftRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { useUserStore } from '../store/userStore';
import { useAuth } from '@clerk/clerk-react';
import { toast } from "sonner"
import { firestore as db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ServicesList } from "./components/ServicesList"


const generateUptimeData = (baseUptime, outages) => {
  // ... existing generateUptimeData code ...
};

const services = [
  // ... existing services array ...
];

const serviceTypes = [
  { value: 'website', label: 'Website', icon: <Globe className="h-4 w-4" /> },
  { value: 'api', label: 'API', icon: <ArrowLeftRight className="h-4 w-4" /> },
  { value: 'db', label: 'Database', icon: <Database className="h-4 w-4" /> },
];

const statusColors = {
  'operational': 'bg-emerald-500',
  'degraded': 'bg-yellow-500',
  'partial_outage': 'bg-orange-500',
  'major_outage': 'bg-red-500'
};


export default function Service() {
  const { getToken } = useAuth();
  const organization = useUserStore((state) => state.organization);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    type: '',
    status: 'operational'
  });

  useEffect(() => {
    if (!organization?.id) return;

    // Reference the organization document
    const orgRef = doc(db, "organizations", organization.id);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(orgRef, (doc) => {
      if (doc.exists()) {
        const servicesData = doc.data()?.services || {};
        // Convert services object to array and sort by name
        const servicesArray = Object.entries(servicesData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => a.name.localeCompare(b.name));
        setServices(servicesArray);
      } else {
        setServices([]);
      }
    }, (error) => {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [organization?.id]);

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
      
    if (!newService.name || !newService.type) {
        setIsLoading(false);
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/org/add-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: organization?.id,
          ...newService
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add service');
      }

      const data = await response.json();
      toast.success('Service added successfully');
      setIsDialogOpen(false);
      setNewService({ name: '', type: '', status: 'operational' });
      
      // Optionally refresh the services list here
      // await refreshServices();

    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container p-4 ">
        <h1 className="text-2xl font-bold mb-4">Services</h1>
      <ServicesList 
        organizationId={organization?.id} 
        services={services} 
      />

      <Button
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddServiceSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-mono">Service Name</Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Enter service name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type" className="font-mono">Service Type</Label>
                <Select
                  value={newService.type}
                  onValueChange={(value) => setNewService({ ...newService, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="font-mono">Initial Status</Label>
                <Select
                  value={newService.status}
                  onValueChange={(value) => setNewService({ ...newService, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status">
                      {newService.status && (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColors[newService.status]}`} />
                          {newService.status.replace('_', ' ').charAt(0).toUpperCase() + newService.status.slice(1)}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                          {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-mono">
                {isLoading ? (
                  <>
                    <span className="mr-2">Adding...</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  'Add Service'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
