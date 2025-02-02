import React, { useState, useEffect } from 'react';
import { Plus, X, Database, Globe, Phone, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
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
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '@clerk/clerk-react';
import { useUserStore } from '../store/userStore';
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { firestore as db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MultiSelect } from "@/components/ui/multi-select";
import { IncidentList } from "./components/IncidentList"

const incidentStatuses = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
];

const ServiceIcon = {
  db: Database,
  website: Globe,
  api: Phone,
  sms: MessageSquare
};

export default function Incident() {
  const { getToken } = useAuth();
  const organization = useUserStore((state) => state.organization);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [openServicesPopover, setOpenServicesPopover] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    status: 'investigating',
    datetime: new Date().toISOString().slice(0, 16),
    affectedServices: []
  });
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedServices([]);
      setNewIncident({
        title: '',
        description: '',
        status: 'investigating',
        datetime: new Date().toISOString().slice(0, 16),
        affectedServices: []
      });
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!organization?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organization.id),
      (doc) => {
        if (doc.exists()) {
          const servicesData = doc.data().services || {};
          const servicesArray = Object.entries(servicesData || {}).map(([id, service]) => ({
            id,
            ...service
          }));
          console.log(servicesArray);
          setServices(servicesArray);
        }
      },
      (error) => {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      }
    );

    return () => unsubscribe();
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organization.id),
      (doc) => {
        if (doc.exists()) {
          const incidentsData = doc.data()?.incidents || {};
          const incidentsArray = Object.entries(incidentsData).map(([id, incident]) => ({
            id,
            ...incident
          })).sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
          setIncidents(incidentsArray);
        } else {
          setIncidents([]);
        }
      },
      (error) => {
        console.error('Error fetching incidents:', error);
        toast.error('Failed to load incidents');
      }
    );

    return () => unsubscribe();
  }, [organization?.id]);

  const handleAddIncidentSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newIncident.title || !newIncident.description || !newIncident.datetime) {
      setIsLoading(false);
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/org/add-incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: organization?.id,
          ...newIncident,
          affectedServices: selectedServices || [],
          datetime: new Date(newIncident.datetime).toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add incident');
      }

      toast.success('Incident added successfully');
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Error adding incident:', error);
      toast.error('Failed to add incident');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceOptions = services.map(service => ({
    label: `${service.name} : ${service.type}`,
    value: service.id
  }));

  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-4">Incidents</h1>
      <IncidentList 
        organizationId={organization?.id}
        incidents={incidents}
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
            <DialogTitle>Create New Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIncidentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="Enter incident title"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="datetime">Date & Time</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={newIncident.datetime || new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setNewIncident({ ...newIncident, datetime: e.target.value })}
                  className="[color-scheme:dark]" // This makes the calendar icon white in dark mode
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Describe the incident..."
                  className="h-32"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newIncident.status}
                  onValueChange={(value) => setNewIncident({ ...newIncident, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <MultiSelect
                  options={serviceOptions}
                  onValueChange={setSelectedServices}
                  defaultValue={selectedServices}
                  placeholder="Select affected services"
                  variant="default"
                  maxCount={4}
                  className="w-full"
                />
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
                    <span className="mr-2">Creating...</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  'Create Incident'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
