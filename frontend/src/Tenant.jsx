import React, { useState } from 'react';
import { useUserStore } from './store/userStore';
import { Sidebar, SidebarProvider, useSidebar } from './components/ui/sidebar';
import { TooltipProvider } from './components/ui/tooltip';
import { cn } from './lib/utils';
import {
  BarChart2,
  Users,
  Bell,
  Activity,
  Settings,
  Server
} from 'lucide-react';
import Service from './Tenant/Service';
import Incident from './Tenant/Incident';
import Members from './Tenant/Members';
import Subscribers from './Tenant/Subscribers';
import SettingsPage from './Tenant/Settings';

function MainContent({ activeSection }) {
  const { state } = useSidebar();
  const organization = useUserStore((state) => state.organization);

  const renderContent = () => {
    switch (activeSection) {
      case 'series':
        return <Service />;
      case 'incidents':
        return <Incident />;
      case 'users':
        return <Members />;
      case 'subscribers':
        return <Subscribers />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Service />;
    }
  };

  return (
    <main className={cn(
      "flex-1 overflow-auto p-6 transition-all duration-300",
      "ml-16 min-w-0",
      "md:ml-16",
      state === "expanded" && "md:ml-64",
    )}>
      <div className="max-w-full">
        {renderContent()}
      </div>
    </main>
  );
}

function Tenant() {
  const organization = useUserStore((state) => state.organization);
  const [activeSection, setActiveSection] = useState('series');

  const menuItems = [
    {
      title: "Services",
      icon: <Server className="h-5 w-5" />,
      id: "series",
      active: activeSection === "series"
    },
    {
      title: "Incidents",
      icon: <BarChart2 className="h-5 w-5" />,
      id: "incidents",
      active: activeSection === "incidents"
    },
    {
      title: "Members",
      icon: <Users className="h-5 w-5" />,
      id: "users",
      active: activeSection === "users"
    },
    {
      title: "Subscribers",
      icon: <Bell className="h-5 w-5" />,
      id: "subscribers",
      active: activeSection === "subscribers"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      id: "settings",
      active: activeSection === "settings"
    },
    
    {
      type: "separator"
    },
    
    {
      title: "Status Page",
      icon: <Activity className="h-5 w-5" />,
      type: "link",
      href: `/${organization?.id}`, // Replace with your actual status page URL
      target: "_blank"
    }
  ];

  const handleMenuItemClick = (item) => {
    if (item.id) {
      setActiveSection(item.id);
    }
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-full">
          <Sidebar 
            organization={organization} 
            menuItems={menuItems}
            onMenuItemClick={handleMenuItemClick}
            className="z-50 bg-background"
          />
          <MainContent activeSection={activeSection} />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default Tenant; 