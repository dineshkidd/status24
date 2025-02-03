import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Globe, Database, ArrowLeftRight, Trash2, Save } from 'lucide-react'
import { useAuth } from "@clerk/clerk-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const serviceIcons = {
  'website': <Globe className="h-4 w-4" />,
  'api': <ArrowLeftRight
   className="h-4 w-4" />,
  'db': <Database className="h-4 w-4" />
};

const statusColors = {
  'operational': 'bg-emerald-500',
  'degraded': 'bg-yellow-500',
  'partial_outage': 'bg-orange-500',
  'major_outage': 'bg-red-500'
};

export function ServicesList({ organizationId, services }) {
  const { getToken } = useAuth();
  const [updatedServices, setUpdatedServices] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [deletingStates, setDeletingStates] = useState({});

  // Sort services by createdAt timestamp
  const sortedServices = [...services].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : 0;
    const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : 0;
    return dateB - dateA; // Sort in descending order (newest first)
  });

  const handleStatusChange = (serviceId, newStatus) => {
    setUpdatedServices((prev) => ({
      ...prev,
      [serviceId]: newStatus,
    }))
  }

  const handleUpdateService = async (serviceId) => {
    setLoadingStates(prev => ({ ...prev, [serviceId]: true }));

    try {
      const token = await getToken();
      const response = await fetch(import.meta.env.VITE_API_URL + "/org/update-service", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: serviceId,
          organizationId,
          status: updatedServices[serviceId],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update service")
      }

      setUpdatedServices((prev) => {
        const updated = { ...prev }
        delete updated[serviceId]
        return updated
      })

      toast.success("Service status updated successfully")
    } catch (error) {
      console.error("Error updating service:", error)
      toast.error("Failed to update service status")
    } finally {
      setLoadingStates(prev => {
        const updated = { ...prev }
        delete updated[serviceId]
        return updated
      })
    }
  }

  const handleDeleteService = async (serviceId) => {
    setDeletingStates(prev => ({ ...prev, [serviceId]: true }));

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/org/delete-service`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      toast.success("Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    } finally {
      setDeletingStates(prev => {
        const updated = { ...prev };
        delete updated[serviceId];
        return updated;
      });
    }
  };

  return (
    <div className="max-w-[80vw] -mx-2 px-2 sm:mx-0">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent font-mono">
              <TableHead className="h-12 px-4 w-[200px]">Service Name</TableHead>
              <TableHead className="h-12 px-4 w-[150px]">Type</TableHead>
              <TableHead className="h-12 px-4 w-[180px]">Last Updated</TableHead>
              <TableHead className="h-12 px-4 w-[250px]">Status</TableHead>
              <TableHead className="h-12 px-4 w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedServices.map((service) => (
              <TableRow 
                key={service.id}
                className="border-b border-border hover:bg-muted/50"
              >
                <TableCell className="font-medium p-4">{service.name}</TableCell>
                <TableCell className="p-4 w-[150px]">
                  <div className="flex items-center gap-2">
                    {serviceIcons[service.type]}
                    <span className="capitalize">{service.type}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 w-[180px] text-muted-foreground">
                  {service.updated_at?.seconds ? (
                    format(new Date(service.updated_at.seconds * 1000), 'MMM d, h:mm a')
                  ) : (
                    'Not available'
                  )}
                </TableCell>
                <TableCell className="p-4 w-[250px]">
                  <div className="flex items-center gap-2">
                    <Select
                      value={updatedServices[service.id] || service.status}
                      onValueChange={(value) => handleStatusChange(service.id, value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusColors[updatedServices[service.id] || service.status]}`} />
                            {(updatedServices[service.id] || service.status).split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(statusColors).map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                              {status.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="w-8">
                      {updatedServices[service.id] && (
                        <Button
                          onClick={() => handleUpdateService(service.id)}
                          size="icon"
                          variant=""
                          className="h-8 w-8"
                          disabled={loadingStates[service.id]}
                        >
                          {loadingStates[service.id] ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-4 w-[80px] text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingStates[service.id]}
                      >
                        {deletingStates[service.id] ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          service "{service.name}" and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-white"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 