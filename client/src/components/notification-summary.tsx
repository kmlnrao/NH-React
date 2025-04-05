import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Bell
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NotificationSummary {
  total: number;
  dueSoon: number;
  overdue: number;
  completed: number;
}

export function NotificationSummary() {
  const { data, isLoading, error } = useQuery<NotificationSummary>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white rounded-lg shadow-sm p-4 h-24 animate-pulse">
            <CardContent className="p-0 flex items-center h-full">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-6 w-12 bg-gray-300 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 text-red-500 p-4 mb-6">
        <CardContent className="p-0 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>Error loading notification statistics</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-primary">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary bg-opacity-10 p-2 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-semibold">{data?.total || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 bg-opacity-10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Due Soon</p>
              <p className="text-2xl font-semibold">{data?.dueSoon || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 bg-opacity-10 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold">{data?.overdue || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 bg-opacity-10 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold">{data?.completed || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
