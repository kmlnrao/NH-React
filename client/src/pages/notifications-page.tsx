import { useState } from "react";
import { Layout } from "@/components/layout";
import { NotificationSummary } from "@/components/notification-summary";
import { NotificationList } from "@/components/notification-list";
import { NotificationConfigModal } from "@/components/notification-config-modal";
import { Button } from "@/components/ui/button";
import { FilterIcon, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationsPage() {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  return (
    <Layout title="Notifications & Alerts">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 md:mb-0">Notifications Dashboard</h2>
          <div className="flex space-x-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-white border shadow-sm flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="statutory">Statutory Compliance</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="task">Task-Based</SelectItem>
                <SelectItem value="escalation">Escalations</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary text-white flex items-center" onClick={() => setConfigModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Notification Summary Cards */}
        <NotificationSummary />

        {/* Notification List */}
        <NotificationList />

        {/* Configuration Modal */}
        <NotificationConfigModal 
          open={configModalOpen} 
          onClose={() => setConfigModalOpen(false)} 
        />
      </div>
    </Layout>
  );
}
