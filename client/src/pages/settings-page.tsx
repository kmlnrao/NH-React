import React from "react";
import { Loader2, Save, AlertTriangle, Mail, CheckSquare, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationSettings } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

// Schema for notification settings form
const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  emailFrequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's notification settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Form setup for notification settings
  const notificationSettingsForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      emailFrequency: "immediate",
    },
  });
  
  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      notificationSettingsForm.reset({
        emailEnabled: settings.emailEnabled ?? true,
        pushEnabled: settings.pushEnabled ?? true,
        smsEnabled: settings.smsEnabled ?? false,
        emailFrequency: (settings.emailFrequency as "immediate" | "daily" | "weekly") ?? "immediate",
      });
    }
  }, [settings, notificationSettingsForm]);

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettingsFormValues) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitNotificationSettings = (data: NotificationSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoadingSettings) {
    return (
      <Layout title="Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings">
      <div className="container mx-auto py-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Control how you receive notifications and alerts about compliance tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...notificationSettingsForm}>
              <form onSubmit={notificationSettingsForm.handleSubmit(onSubmitNotificationSettings)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <FormField
                    control={notificationSettingsForm.control}
                    name="emailEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>Receive notifications via email</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationSettingsForm.control}
                    name="pushEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                          <FormDescription>Receive notifications in your web browser</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationSettingsForm.control}
                    name="smsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">SMS Notifications</FormLabel>
                          <FormDescription>Receive text message alerts for high priority items</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Frequency</h3>
                  <FormField
                    control={notificationSettingsForm.control}
                    name="emailFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Digest Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Summary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often you want to receive email notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Admin-only settings section */}
        {user?.role === 'admin' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight mt-8">Administrator Settings</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Task Management Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Task Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage compliance tasks for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Create, edit and assign compliance tasks to team members.
                    Configure priority levels and due dates.
                  </p>
                </CardContent>
                <CardFooter className="bg-primary/5 flex justify-end">
                  <Button variant="ghost" asChild>
                    <Link href="/tasks" className="flex items-center">
                      Go to Tasks <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Escalation Levels Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Escalation Levels
                  </CardTitle>
                  <CardDescription>
                    Configure notification escalation hierarchy
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Define escalation tiers for different notification types.
                    Set up reminders before deadlines and configure who gets notified.
                  </p>
                </CardContent>
                <CardFooter className="bg-primary/5 flex justify-end">
                  <Button variant="ghost" asChild>
                    <Link href="/escalation-management" className="flex items-center">
                      Configure Escalations <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Message Templates Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Message Templates
                  </CardTitle>
                  <CardDescription>
                    Create and customize notification templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Design standardized message templates for different notification
                    types and channels. Use placeholders for dynamic content.
                  </p>
                </CardContent>
                <CardFooter className="bg-primary/5 flex justify-end">
                  <Button variant="ghost" asChild>
                    <Link href="/notification-templates" className="flex items-center">
                      Manage Templates <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}