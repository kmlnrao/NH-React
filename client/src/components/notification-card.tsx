import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, AlertTriangle, Clock, CheckCircle, FileText, Calendar, Clipboard, Edit, ReceiptCent } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationCardProps {
  notification: Notification;
  onRefresh?: () => void;
}

export function NotificationCard({ notification, onRefresh }: NotificationCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Format date for display
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/notifications/${notification.id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      if (onRefresh) onRefresh();
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark notification as read: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Mark notification as actioned
  const markAsActionedMutation = useMutation({
    mutationFn: async (actionType: string) => {
      await apiRequest("PUT", `/api/notifications/${notification.id}/action`, { actionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      if (onRefresh) onRefresh();
      toast({
        title: "Action recorded",
        description: "Your action has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record action: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'statutory':
        return <Clipboard className="text-blue-500" />;
      case 'payment':
        return <ReceiptCent className="text-green-500" />;
      case 'task':
        return <FileText className="text-purple-500" />;
      case 'escalation':
        return <AlertTriangle className="text-red-500" />;
      default:
        return <Clock className="text-gray-500" />;
    }
  };

  // Get badge based on notification status
  const getBadge = () => {
    const dueDatePassed = notification.scheduledAt ? new Date(notification.scheduledAt) < new Date() : false;
    
    if (notification.status === 'actioned' || notification.status === 'read') {
      return (
        <Badge className="bg-green-500 text-white font-normal text-xs">
          COMPLETED
        </Badge>
      );
    } else if (notification.type === 'escalation' || dueDatePassed) {
      return (
        <Badge className="bg-red-500 text-white font-normal text-xs">
          OVERDUE
        </Badge>
      );
    } else if (notification.priority === 'high' || notification.priority === 'critical') {
      return (
        <Badge className="bg-yellow-500 text-white font-normal text-xs">
          DUE SOON
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-500 text-white font-normal text-xs">
          UPCOMING
        </Badge>
      );
    }
  };

  // Get action buttons based on notification type
  const getActionButtons = () => {
    switch (notification.type) {
      case 'payment':
        return (
          <>
            <Button 
              size="sm" 
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('process_payment')}
            >
              <ReceiptCent className="h-4 w-4 mr-1" />
              Process Payment
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm text-gray-700 border px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('request_extension')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Request Extension
            </Button>
          </>
        );
      case 'statutory':
        return (
          <>
            <Button 
              size="sm" 
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('mark_in_progress')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark as In Progress
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm text-gray-700 border px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('view_documents')}
            >
              <FileText className="h-4 w-4 mr-1" />
              View Documents
            </Button>
          </>
        );
      case 'task':
        return (
          <>
            <Button 
              size="sm" 
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('review_task')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Review Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm text-gray-700 border px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('schedule_task')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </>
        );
      case 'escalation':
        return (
          <>
            <Button 
              size="sm" 
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('resolve_escalation')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve Issue
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm text-gray-700 border px-3 py-1.5 rounded-md flex items-center"
              onClick={() => markAsActionedMutation.mutate('delegate_escalation')}
            >
              <Clipboard className="h-4 w-4 mr-1" />
              Delegate
            </Button>
          </>
        );
      default:
        return (
          <Button 
            size="sm" 
            className="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center"
            onClick={() => markAsActionedMutation.mutate('acknowledge')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Acknowledge
          </Button>
        );
    }
  };

  // Get card border color based on notification status/priority
  const getBorderColor = () => {
    if (notification.status === 'actioned' || notification.status === 'read') {
      return 'border-green-500';
    } else if (notification.type === 'escalation' || notification.priority === 'critical') {
      return 'border-red-500';
    } else if (notification.priority === 'high') {
      return 'border-yellow-500';
    } else {
      return 'border-blue-500';
    }
  };

  return (
    <Card 
      className={cn(
        "mb-3 border-l-4 rounded-lg bg-white shadow-sm hover:shadow transition",
        getBorderColor(),
        notification.status === 'actioned' || notification.status === 'read' ? "opacity-75" : ""
      )}
      data-notification-type={notification.type}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="mr-3">
              {getIcon()}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <div className="mt-2 flex items-center flex-wrap text-xs text-gray-500">
                {getBadge()}
                <span className="mx-2">•</span>
                {notification.scheduledAt && (
                  <>
                    <span>
                      {new Date(notification.scheduledAt) > new Date() 
                        ? `Due in: ${formatDistanceToNow(new Date(notification.scheduledAt))}` 
                        : `Due: ${getFormattedDate(notification.scheduledAt)}`}
                    </span>
                    <span className="mx-2">•</span>
                  </>
                )}
                {notification.escalationLevel > 0 && (
                  <>
                    <span>Escalation Level: {notification.escalationLevel}</span>
                    <span className="mx-2">•</span>
                  </>
                )}
                <span>{getFormattedDate(notification.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => markAsReadMutation.mutate()}>
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? 'Hide Details' : 'Show Details'}
                </DropdownMenuItem>
                <DropdownMenuItem>Snooze Notification</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 bg-gray-50 p-3 rounded-md text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium">Status:</p>
                <p>{notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}</p>
              </div>
              <div>
                <p className="font-medium">Type:</p>
                <p>{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</p>
              </div>
              <div>
                <p className="font-medium">Priority:</p>
                <p>{notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}</p>
              </div>
              <div>
                <p className="font-medium">Scheduled At:</p>
                <p>{new Date(notification.scheduledAt).toLocaleString()}</p>
              </div>
              {notification.sentAt && (
                <div>
                  <p className="font-medium">Sent At:</p>
                  <p>{new Date(notification.sentAt).toLocaleString()}</p>
                </div>
              )}
              {notification.readAt && (
                <div>
                  <p className="font-medium">Read At:</p>
                  <p>{new Date(notification.readAt).toLocaleString()}</p>
                </div>
              )}
              {notification.actionedAt && (
                <div>
                  <p className="font-medium">Actioned At:</p>
                  <p>{new Date(notification.actionedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="font-medium">Channels:</p>
                <p>{(notification.channels as string[]).join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex justify-between">
          <div className="flex space-x-2">
            {notification.status !== 'actioned' && getActionButtons()}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Eye className="h-4 w-4 mr-1" />
            <span className="ml-1">{isExpanded ? 'Hide Details' : 'View Details'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
