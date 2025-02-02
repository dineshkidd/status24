import { useEffect, useState } from "react";
import { firestore as db } from '../firebase';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Globe, Database, ArrowLeftRight} from 'lucide-react'

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
      <div className="grid gap-4 max-w-xl mx-auto">
        {services.map((service) => (
          <div key={service.id} className="border border-zinc-800 rounded-lg p-4">
            <div className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center">
                {getServiceIcon(service.type)}
                <h3 className="text-lg font-medium text-white">{service.name}</h3>
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
    </div>
  );
}