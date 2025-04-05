import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Edit, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationSettings, EscalationLevel, MessageTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface NotificationConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationConfigModal({ open, onClose }: NotificationConfigModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("channels");

  // Fetch notification settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery<NotificationSettings[]>({
    queryKey: ["/api/notification-settings"],
    enabled: open,
  });

  // Fetch escalation levels
  const { data: escalationLevels, isLoading: isEscalationLoading } = useQuery<EscalationLevel[]>({
    queryKey: ["/api/escalation-levels"],
    enabled: open,
  });

  // Fetch message templates
  const { data: messageTemplates, isLoading: isTemplatesLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
    enabled: open,
  });

  // Mutation to update notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      if (!data.id) return null;
      return await apiRequest("PUT", `/api/notification-settings/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({
        title: "Settings updated",
        description: "Your notification settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    toast({
      title: "Configuration Saved",
      description: "Your notification configuration has been updated.",
    });
    onClose();
  };
  
  // Group settings by notification type
  const getSettingsByType = (type: string) => {
    return settings?.find(s => s.notificationType === type);
  };

  // Calculate loading state
  const isLoading = isSettingsLoading || isEscalationLoading || isTemplatesLoading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Configuration</DialogTitle>
          <DialogDescription>
            Customize how you receive and manage compliance notifications.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 border-b w-full flex overflow-x-auto space-x-4">
              <TabsTrigger value="channels" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Notification Channels
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Alert Preferences
              </TabsTrigger>
              <TabsTrigger value="escalation" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Escalation Matrix
              </TabsTrigger>
            </TabsList>

            {/* Notification Channels Tab */}
            <TabsContent value="channels" className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Configure how you would like to receive notifications across different channels.</p>
              
              {/* Email Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Receive notification emails at your registered email address</p>
                  </div>
                  <Switch 
                    checked={true} 
                    onCheckedChange={() => {
                      toast({
                        title: "Feature Notice",
                        description: "Email toggling will be enabled in a future update.",
                      });
                    }}
                  />
                </div>
                <div className="mt-3 pl-7">
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="email-statutory" 
                      checked={getSettingsByType('statutory')?.emailEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('statutory');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            emailEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="email-statutory" className="ml-2 text-sm">Statutory Compliance Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="email-payment" 
                      checked={getSettingsByType('payment')?.emailEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('payment');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            emailEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="email-payment" className="ml-2 text-sm">Payment Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="email-task" 
                      checked={getSettingsByType('task')?.emailEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('task');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            emailEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="email-task" className="ml-2 text-sm">Task-Based Alerts</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="email-escalation" 
                      checked={getSettingsByType('escalation')?.emailEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('escalation');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            emailEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="email-escalation" className="ml-2 text-sm">Escalation Alerts</Label>
                  </div>
                </div>
              </div>

              {/* SMS Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      SMS Notifications
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Receive SMS at your registered phone number</p>
                  </div>
                  <Switch 
                    checked={false}
                    onCheckedChange={() => {
                      toast({
                        title: "Feature Notice",
                        description: "SMS functionality will be enabled in a future update.",
                      });
                    }}
                  />
                </div>
                <div className="mt-3 pl-7">
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="sms-statutory" 
                      checked={getSettingsByType('statutory')?.smsEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('statutory');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            smsEnabled: !!checked,
                          });
                        }
                      }}
                      disabled={true}
                    />
                    <Label htmlFor="sms-statutory" className="ml-2 text-sm">Statutory Compliance Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="sms-payment" 
                      checked={getSettingsByType('payment')?.smsEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('payment');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            smsEnabled: !!checked,
                          });
                        }
                      }}
                      disabled={true}
                    />
                    <Label htmlFor="sms-payment" className="ml-2 text-sm">Payment Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="sms-task" 
                      checked={getSettingsByType('task')?.smsEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('task');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            smsEnabled: !!checked,
                          });
                        }
                      }}
                      disabled={true}
                    />
                    <Label htmlFor="sms-task" className="ml-2 text-sm">Task-Based Alerts</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="sms-escalation" 
                      checked={getSettingsByType('escalation')?.smsEnabled} 
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('escalation');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            smsEnabled: !!checked,
                          });
                        }
                      }}
                      disabled={true}
                    />
                    <Label htmlFor="sms-escalation" className="ml-2 text-sm">Escalation Alerts</Label>
                  </div>
                </div>
              </div>

              {/* Push Notification Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Push Notifications
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Receive notifications in browser and mobile app</p>
                  </div>
                  <Switch 
                    checked={true}
                    onCheckedChange={() => {
                      toast({
                        title: "Feature Notice",
                        description: "Push notification toggling will be enabled in a future update.",
                      });
                    }}
                  />
                </div>
                <div className="mt-3 pl-7">
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="push-statutory" 
                      checked={getSettingsByType('statutory')?.pushEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('statutory');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            pushEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="push-statutory" className="ml-2 text-sm">Statutory Compliance Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="push-payment" 
                      checked={getSettingsByType('payment')?.pushEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('payment');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            pushEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="push-payment" className="ml-2 text-sm">Payment Alerts</Label>
                  </div>
                  <div className="flex items-center mb-2">
                    <Checkbox 
                      id="push-task" 
                      checked={getSettingsByType('task')?.pushEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('task');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            pushEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="push-task" className="ml-2 text-sm">Task-Based Alerts</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="push-escalation" 
                      checked={getSettingsByType('escalation')?.pushEnabled}
                      onCheckedChange={(checked) => {
                        const setting = getSettingsByType('escalation');
                        if (setting) {
                          updateSettingsMutation.mutate({
                            id: setting.id,
                            pushEnabled: !!checked,
                          });
                        }
                      }}
                    />
                    <Label htmlFor="push-escalation" className="ml-2 text-sm">Escalation Alerts</Label>
                  </div>
                </div>
              </div>

              {/* WhatsApp Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      WhatsApp Notifications
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Receive WhatsApp messages at your registered phone number</p>
                  </div>
                  <Switch 
                    checked={false}
                    onCheckedChange={() => {
                      toast({
                        title: "Feature Notice",
                        description: "WhatsApp integration will be enabled in a future update.",
                      });
                    }}
                  />
                </div>
                <div className="mt-3 pl-7">
                  <p className="text-xs text-gray-500 italic mb-2">WhatsApp integration needs to be set up first.</p>
                  <Button variant="outline" size="sm" className="text-primary">
                    Connect WhatsApp
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Alert Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Configure when and how frequently you want to receive different types of alerts.</p>

              {/* Reminder Timing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Reminder Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Statutory Compliance Reminders</Label>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Send</span>
                      <Select 
                        value={getSettingsByType('statutory')?.reminderDays?.toString() || "7"}
                        onValueChange={(value) => {
                          const setting = getSettingsByType('statutory');
                          if (setting) {
                            updateSettingsMutation.mutate({
                              id: setting.id,
                              reminderDays: parseInt(value),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="21">21 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm ml-2">before due date</span>
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Payment Reminders</Label>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Send</span>
                      <Select 
                        value={getSettingsByType('payment')?.reminderDays?.toString() || "3"}
                        onValueChange={(value) => {
                          const setting = getSettingsByType('payment');
                          if (setting) {
                            updateSettingsMutation.mutate({
                              id: setting.id,
                              reminderDays: parseInt(value),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="10">10 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm ml-2">before due date</span>
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Task-Based Reminders</Label>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Send</span>
                      <Select 
                        value={getSettingsByType('task')?.reminderDays?.toString() || "1"}
                        onValueChange={(value) => {
                          const setting = getSettingsByType('task');
                          if (setting) {
                            updateSettingsMutation.mutate({
                              id: setting.id,
                              reminderDays: parseInt(value),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm ml-2">before due date</span>
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Contract Renewal Reminders</Label>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Send</span>
                      <Select 
                        value={getSettingsByType('escalation')?.reminderDays?.toString() || "30"}
                        onValueChange={(value) => {
                          const setting = getSettingsByType('escalation');
                          if (setting) {
                            updateSettingsMutation.mutate({
                              id: setting.id,
                              reminderDays: parseInt(value),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="45">45 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm ml-2">before due date</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequency Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Follow-up Frequency</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Reminder Frequency for Upcoming Tasks</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center">
                        <Checkbox id="freq-initial" checked={true} />
                        <Label htmlFor="freq-initial" className="ml-2 text-sm">Initial reminder</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-weekly" checked={true} />
                        <Label htmlFor="freq-weekly" className="ml-2 text-sm">Weekly reminder</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-3days" checked={true} />
                        <Label htmlFor="freq-3days" className="ml-2 text-sm">3 days before</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-1day" checked={true} />
                        <Label htmlFor="freq-1day" className="ml-2 text-sm">1 day before</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-due" checked={true} />
                        <Label htmlFor="freq-due" className="ml-2 text-sm">On due date</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Post Due-Date Reminders</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center">
                        <Checkbox id="freq-over1" checked={true} />
                        <Label htmlFor="freq-over1" className="ml-2 text-sm">1 day overdue</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-over3" checked={true} />
                        <Label htmlFor="freq-over3" className="ml-2 text-sm">3 days overdue</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-over7" checked={true} />
                        <Label htmlFor="freq-over7" className="ml-2 text-sm">1 week overdue</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox id="freq-daily" checked={false} />
                        <Label htmlFor="freq-daily" className="ml-2 text-sm">Daily until resolved</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Message Templates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Custom Message Templates</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Payment Reminder Template</Label>
                    <Textarea 
                      className="w-full border rounded-md p-2 text-sm" 
                      rows={2}
                      placeholder="Enter template text"
                      defaultValue="[Payment Type] payment of [Amount] is due on [Due Date]. Please process the payment to avoid penalties."
                    />
                    <div className="text-xs text-gray-500 mt-1">Available placeholders: [Payment Type], [Amount], [Due Date], [Days Remaining]</div>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Compliance Reminder Template</Label>
                    <Textarea 
                      className="w-full border rounded-md p-2 text-sm" 
                      rows={2}
                      placeholder="Enter template text"
                      defaultValue="Reminder: [Compliance Type] filing deadline is [Due Date]. Please prepare the necessary documents."
                    />
                    <div className="text-xs text-gray-500 mt-1">Available placeholders: [Compliance Type], [Due Date], [Days Remaining], [Assigned To]</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Escalation Matrix Tab */}
            <TabsContent value="escalation" className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Configure how notifications should be escalated if not acted upon.</p>

              {/* Escalation Rules */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Escalation Rules</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">First Escalation</Label>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">After</span>
                        <Select defaultValue="1">
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm ml-2">of overdue</span>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Second Escalation</Label>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">After</span>
                        <Select defaultValue="3">
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="10">10 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm ml-2">of overdue</span>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Final Escalation</Label>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">After</span>
                        <Select defaultValue="7">
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="10">10 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="21">21 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm ml-2">of overdue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escalation Contacts */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Escalation Hierarchy</h4>
                  <Button variant="primary" size="sm" className="text-xs bg-primary text-white px-2 py-1 rounded flex items-center">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Level
                  </Button>
                </div>
                
                {/* Level 1 */}
                <div className="border rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium">Level 1: Team Lead</h5>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">User</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Rajesh Kumar (Team Lead)</SelectItem>
                          <SelectItem value="2">Priya Singh (Team Lead)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Notification Channels</Label>
                      <div className="flex space-x-2">
                        <div className="flex items-center">
                          <Checkbox id="level1-email" checked={true} />
                          <Label htmlFor="level1-email" className="ml-1 text-xs">Email</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level1-sms" checked={true} />
                          <Label htmlFor="level1-sms" className="ml-1 text-xs">SMS</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level1-push" checked={true} />
                          <Label htmlFor="level1-push" className="ml-1 text-xs">Push</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Actions Required</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Acknowledge & Resolve</SelectItem>
                          <SelectItem value="2">Acknowledge Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Level 2 */}
                <div className="border rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium">Level 2: Department Manager</h5>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">User</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Sarah Johnson (Finance Manager)</SelectItem>
                          <SelectItem value="2">Arun Mehta (Legal Manager)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Notification Channels</Label>
                      <div className="flex space-x-2">
                        <div className="flex items-center">
                          <Checkbox id="level2-email" checked={true} />
                          <Label htmlFor="level2-email" className="ml-1 text-xs">Email</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level2-sms" checked={true} />
                          <Label htmlFor="level2-sms" className="ml-1 text-xs">SMS</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level2-push" checked={true} />
                          <Label htmlFor="level2-push" className="ml-1 text-xs">Push</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Actions Required</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Acknowledge & Resolve</SelectItem>
                          <SelectItem value="2">Acknowledge Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Level 3 */}
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium">Level 3: Executive Leadership</h5>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">User</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Vikram Singh (CFO)</SelectItem>
                          <SelectItem value="2">Neha Sharma (COO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Notification Channels</Label>
                      <div className="flex space-x-2">
                        <div className="flex items-center">
                          <Checkbox id="level3-email" checked={true} />
                          <Label htmlFor="level3-email" className="ml-1 text-xs">Email</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level3-sms" checked={true} />
                          <Label htmlFor="level3-sms" className="ml-1 text-xs">SMS</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox id="level3-push" checked={true} />
                          <Label htmlFor="level3-push" className="ml-1 text-xs">Push</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-xs text-gray-500 mb-1">Actions Required</Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Acknowledge & Resolve</SelectItem>
                          <SelectItem value="2">Acknowledge Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-6 flex justify-end border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="mr-2">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
