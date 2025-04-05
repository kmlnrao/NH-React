import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@shared/schema";
import { NotificationCard } from "@/components/notification-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ListFilter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationList() {
  const [activeTab, setActiveTab] = useState("all");
  const [sortOrder, setSortOrder] = useState("date");

  // Fetch notifications
  const { data: notifications, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const handleRefresh = () => {
    refetch();
  };

  const filteredNotifications = notifications ? 
    notifications.filter(notification => {
      if (activeTab === "all") return true;
      return notification.type === activeTab;
    }) : [];

  // Sort notifications based on sort order
  const sortedNotifications = [...(filteredNotifications || [])];
  if (sortOrder === "date") {
    sortedNotifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortOrder === "priority") {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    sortedNotifications.sort((a, b) => {
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });
  } else if (sortOrder === "type") {
    sortedNotifications.sort((a, b) => a.type.localeCompare(b.type));
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {["all", "statutory", "payment", "task", "escalation"].map(tab => (
              <Skeleton key={tab} className="h-12 w-32 mx-2" />
            ))}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-sm p-4">
        <CardContent className="p-0">
          <div className="text-red-500">
            Error loading notifications: {(error as Error).message}
          </div>
          <Button onClick={handleRefresh} className="mt-2">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Notification Tabs */}
      <div className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex overflow-x-auto hide-scrollbar p-0 bg-transparent h-auto">
            <TabsTrigger 
              value="all" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none"
            >
              All Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="statutory" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none"
            >
              Statutory Compliance
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger 
              value="task" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none"
            >
              Task-Based
            </TabsTrigger>
            <TabsTrigger 
              value="escalation" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none"
            >
              Escalations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List of notifications */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Active Notifications</h3>
          <div className="flex space-x-2">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="text-sm w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="priority">Sort by Priority</SelectItem>
                <SelectItem value="type">Sort by Type</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="text-primary" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notification items */}
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications to display.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map(notification => (
              <NotificationCard 
                key={notification.id} 
                notification={notification}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}

        {sortedNotifications.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button variant="ghost" className="text-primary font-medium flex items-center hover:bg-primary/10">
              Load More
              <svg className="ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
