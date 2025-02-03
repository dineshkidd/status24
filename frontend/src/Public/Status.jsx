import { useEffect, useState } from "react";
import { firestore as db } from '../firebase';
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Globe, Database, ArrowLeftRight} from 'lucide-react'
import { format } from 'date-fns';

const statusColors = {
  'operational': 'bg-emerald-500',
  'degraded': 'bg-yellow-500',
  'partial_outage': 'bg-orange-500',
  'major_outage': 'bg-red-500'
};

const getServiceIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'website':
      return <Globe className="w-5 h-5 mr-2 text-zinc-400" />;
    case 'db':
      return <Database className="w-5 h-5 mr-2 text-zinc-400" />;
    case 'api':
      return <ArrowLeftRight className="w-5 h-5 mr-2 text-zinc-400" />;
    default:
      return null;
  }
};

const incidentStatusColors = {
  'investigating': 'bg-yellow-500',
  'identified': 'bg-orange-500',
  'monitoring': 'bg-blue-500',
  'resolved': 'bg-green-500'
};

// Add this helper function for formatting dates
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export default function Status({ orgId }) {
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (!orgId) return;

    const unsubscribe = onSnapshot(
      doc(db, "organizations", orgId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const orgData = { id: docSnapshot.id, ...docSnapshot.data() };
          setOrganization(orgData);

          if (orgData.services) {
            // Convert services object to array with stable IDs
            const servicesArray = Object.entries(orgData.services).map(([key, service]) => ({
              ...service,
              id: service.id || key // Use the object key as fallback ID
            }));

            // Sort services by createdAt
            const sortedServices = servicesArray.sort((a, b) => {
              // If no createdAt, use name for stable sorting
              if (!a.createdAt && !b.createdAt) {
                return a.name.localeCompare(b.name);
              }
              
              // If only one has createdAt, put the one without at the end
              if (!a.createdAt) return 1;
              if (!b.createdAt) return -1;

              // Convert timestamps to milliseconds
              const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
              const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;

              return timeB - timeA; // Newest first
            });

            console.log('Services before sorting:', servicesArray);
            console.log('Services after sorting:', sortedServices);
            setServices(sortedServices);
          }

          if (orgData.incidents) {
            setIncidents(Object.values(orgData.incidents));
          }
        }
      },
      (error) => {
        console.error("Error listening to organization data:", error);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold text-white mb-6">System Status</h2>
      <div className="grid gap-4 max-w-4xl mx-auto">
        {services.map((service) => (
          <div key={service.id} className="border border-zinc-800 rounded-lg p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center">
                  {getServiceIcon(service.type)}
                  <h3 className="text-lg font-medium text-white">{service.name}</h3>
                </div>
                <span className="text-xs text-zinc-500 mt-1">
                {service.updated_at?.seconds ? (
                  format(new Date(service.updated_at.seconds * 1000), 'MMM d, h:mm a')
                ) : (
                  'Not available'
                )}
                </span>
              </div>
              <Badge 
                variant={service.status}
                className="capitalize"
              >
                {service.status.split("_").join(" ")}
              </Badge>
            </div>
            <div className="pt-2">
              <p className="text-zinc-400">{service.description}</p>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-semibold text-white mb-6">Incidents</h2>
      <div className="space-y-6 max-w-4xl mx-auto">
        {incidents
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .map((incident) => (
            <div 
              key={incident.id} 
              className="border border-zinc-800 rounded-lg p-6 space-y-4"
            >
              <div className="flex flex-col gap-2 md:flex-row items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{incident.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {formatDate(incident.created_at)}
                  </p>
                </div>
                <Badge 
                  variant={incident.status}
                  className={`${incidentStatusColors[incident.status]} text-background`}
                >
                  {incident.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <p className="text-zinc-400">{incident.description}</p>
              
              {incident.messages && (
                <div className="mt-6 space-y-4">
                  <div className="border-l-2 border-zinc-800 space-y-4">
                    {Object.values(incident.messages)
                      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                      .map((message, index) => (
                        <div key={message.id} className="pl-4 relative">
                          <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-zinc-800" />
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-zinc-500">
                              {formatDate(message.timestamp)}
                            </span>
                            <Badge 
                              variant={message.status} 
                              className={`${incidentStatusColors[message.status]} text-background`}
                            >
                              {message.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-300">{message.message}</p>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-zinc-500 pt-4">
                {incident.resolvedAt && (
                  <span>Resolved {formatDate(incident.resolvedAt)}</span>
                )}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}