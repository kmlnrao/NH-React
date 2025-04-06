import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Mail, MessageSquare, Copy } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageTemplate } from "@shared/schema";

// Schema for message templates
const messageTemplateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  notificationType: z.enum(["statutory", "payment", "task", "escalation"]),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  messageBody: z.string().min(10, "Message body must be at least 10 characters"),
  channel: z.enum(["email", "sms", "app", "all"]),
});

type TemplateFormValues = z.infer<typeof messageTemplateSchema>;

export default function NotificationTemplatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch message templates
  const { data: messageTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/message-templates"],
    enabled: !!user,
  });

  // Template form setup
  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(messageTemplateSchema),
    defaultValues: {
      name: "",
      notificationType: "statutory",
      subject: "",
      messageBody: "",
      channel: "all",
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest("POST", "/api/message-templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({
        title: "Template created",
        description: "The notification template has been created successfully.",
      });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues & { id: number }) => {
      const { id, ...templateData } = data;
      const response = await apiRequest("PATCH", `/api/message-templates/${id}`, templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({
        title: "Template updated",
        description: "The notification template has been updated successfully.",
      });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/message-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({
        title: "Template deleted",
        description: "The notification template has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter templates based on active tab
  const filteredTemplates = React.useMemo(() => {
    if (!messageTemplates) return [];
    
    switch (activeTab) {
      case "statutory":
        return messageTemplates.filter((template: MessageTemplate) => template.notificationType === "statutory");
      case "payment":
        return messageTemplates.filter((template: MessageTemplate) => template.notificationType === "payment");
      case "task":
        return messageTemplates.filter((template: MessageTemplate) => template.notificationType === "task");
      case "escalation":
        return messageTemplates.filter((template: MessageTemplate) => template.notificationType === "escalation");
      default:
        return messageTemplates;
    }
  }, [messageTemplates, activeTab]);

  // Handle template form submission
  const onSubmitTemplate = (data: TemplateFormValues) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ ...data, id: selectedTemplate.id });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  // Open edit template dialog
  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    
    templateForm.reset({
      name: template.name,
      notificationType: template.notificationType as "statutory" | "payment" | "task" | "escalation",
      subject: template.subject,
      messageBody: template.messageBody,
      channel: template.channel as "email" | "sms" | "app" | "all",
    });
    
    setIsTemplateDialogOpen(true);
  };

  // Open create template dialog
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    templateForm.reset({
      name: "",
      notificationType: "statutory",
      subject: "",
      messageBody: "",
      channel: "all",
    });
    setIsTemplateDialogOpen(true);
  };

  // Handle delete template
  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Handle template duplication
  const handleDuplicateTemplate = (template: MessageTemplate) => {
    templateForm.reset({
      name: `${template.name} (Copy)`,
      notificationType: template.notificationType as "statutory" | "payment" | "task" | "escalation",
      subject: template.subject,
      messageBody: template.messageBody,
      channel: template.channel as "email" | "sms" | "app" | "all",
    });
    
    setSelectedTemplate(null);
    setIsTemplateDialogOpen(true);
    
    toast({
      title: "Template duplicated",
      description: "Edit the duplicated template and save it as a new one.",
    });
  };

  // Get channel badge
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "email":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Badge>;
      case "sms":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS</Badge>;
      case "app":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">In-App</Badge>;
      case "all":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">All Channels</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  // Get notification type badge
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "statutory":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Statutory</Badge>;
      case "payment":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Payment</Badge>;
      case "task":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Task</Badge>;
      case "escalation":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Escalation</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Loading state
  if (isLoadingTemplates) {
    return (
      <Layout title="Notification Templates">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Notification Templates">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="statutory">Statutory</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="escalation">Escalation</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Message Templates</CardTitle>
                <CardDescription>
                  Create and manage message templates for different notification types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-10">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">No templates found for this category.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleCreateTemplate}
                    >
                      Create Your First Template
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates.map((template: MessageTemplate) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>{getNotificationTypeBadge(template.notificationType)}</TableCell>
                            <TableCell>{getChannelBadge(template.channel)}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{template.subject}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDuplicateTemplate(template)}
                              >
                                <Copy className="h-4 w-4 mr-1" /> Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? "Update the template for notifications." 
                : "Create a new template for notifications."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-6">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this template
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="notificationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select notification type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="statutory">Statutory</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="escalation">Escalation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={templateForm.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="app">In-App</SelectItem>
                          <SelectItem value="all">All Channels</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={templateForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subject line" {...field} />
                    </FormControl>
                    <FormDescription>
                      Subject for emails or title for other notification types
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="messageBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Body</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter message content" 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      You can use placeholders like {'{taskName}'}, {'{dueDate}'}, {'{userName}'}, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      {selectedTemplate ? "Update Template" : "Create Template"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}