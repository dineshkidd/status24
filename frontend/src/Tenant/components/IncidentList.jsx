import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Database, Globe, ArrowLeftRight, PencilIcon, ChevronDown } from 'lucide-react';
import { format } from "date-fns"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import { useUserStore } from "../../store/userStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ServiceIcon = {
  db: Database,
  website: Globe,
  api: ArrowLeftRight,
};

const statusColors = {
  'investigating': 'bg-yellow-500',
  'identified': 'bg-orange-500',
  'monitoring': 'bg-blue-500',
  'resolved': 'bg-green-500'
};

export function IncidentList({ incidents, services, onIncidentUpdated }) {
  const { getToken } = useAuth();
  const organization = useUserStore((state) => state.organization);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateClick = (incident) => {
    setSelectedIncident(incident);
    setUpdateStatus(incident.status);
    setUpdateMessage("");
    setIsUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!updateMessage || !updateStatus) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/org/update-incident`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          organizationId: organization.id,
          status: updateStatus,
          message: updateMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update incident');
      }

      toast.success("Incident updated successfully");
      setIsUpdateDialogOpen(false);
      setUpdateMessage("");
      setUpdateStatus("");
      setSelectedIncident(null);
      
      // Trigger refresh of incidents list
      if (onIncidentUpdated) {
        onIncidentUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update incident");
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-4 max-w-4xl ">
        {incidents.map((incident) => {
          const affectedServices = incident.affectedServices?.map(serviceId => 
            services.find(s => s.id === serviceId)
          ).filter(Boolean) || [];

          return (
            <div
              key={incident.id}
              className="w-full p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex flex-col gap-2 md:flex-row items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{incident.title}</h3>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[incident.status]} text-background`}
                >
                  {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {incident.datetime?.seconds ? (
                  format(new Date(incident.datetime.seconds * 1000), 'MMM d, h:mm a')
                ) : (
                  'Not available'
                )}
              </p>
              <p className="text-sm mb-3">{incident.description}</p>

              {/* Affected Services */}
              {affectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {affectedServices.map((service, index) => {
                    const Icon = ServiceIcon[service.type];
                    return (
                      <React.Fragment key={service.id}>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {Icon && <Icon className="h-4 w-4" />}
                          <span>{service.name}</span>
                        </div>
                        {index < affectedServices.length - 1 && (
                          <span className="text-muted-foreground">,</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Messages Accordion */}
              {incident.messages && Object.keys(incident.messages).length > 0 && (
                <Accordion type="single" collapsible className="w-full mb-3">
                  <AccordionItem value="messages" className="border-none">
                    <AccordionTrigger className="py-2 text-sm hover:no-underline">
                      <span className="flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" />
                        View Updates ({Object.keys(incident.messages).length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="border-l-2 border-zinc-800 space-y-4 mt-2">
                        {Object.values(incident.messages)
                          .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                          .map((message) => (
                            <div key={message.id} className="pl-4 relative">
                              <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-zinc-800" />
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-zinc-500">
                                  {message.timestamp?.seconds ? (
                                    format(new Date(message.timestamp.seconds * 1000), 'MMM d, h:mm a')
                                  ) : 'Not available'}
                                </span>
                                <Badge 
                                  variant="outline"
                                  className={`${statusColors[message.status]} text-background`}
                                >
                                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-zinc-300">{message.message}</p>
                            </div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Update Button */}
              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleUpdateClick(incident)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          );
        })}
        
        {incidents.length === 0 && (
          <div className="w-full text-center text-muted-foreground py-8">
            No incidents reported
          </div>
        )}
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Incident Status</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={updateStatus}
                onValueChange={setUpdateStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Update Message</label>
              <Textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Provide details about the current status..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
