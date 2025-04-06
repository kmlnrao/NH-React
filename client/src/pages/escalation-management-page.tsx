import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, AlertTriangle, Bell } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { EscalationLevel } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for escalation levels
const escalationLevelSchema = z.object({
  level: z.number().min(1, "Level must be at least 1"),
  userId: z.number(),
  notificationType: z.enum(["statutory", "payment", "task", "escalation"]),
  daysBeforeDue: z.number().min(0, "Days must be a positive number or zero"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type EscalationFormValues = z.infer<typeof escalationLevelSchema>;

export default function EscalationManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEscalationDialogOpen, setIsEscalationDialogOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationLevel | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch escalation levels
  const { data: escalationLevels, isLoading: isLoadingEscalations } = useQuery({
    queryKey: ["/api/escalation-levels"],
    enabled: !!user,
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Escalation form setup
  const escalationForm = useForm<EscalationFormValues>({
    resolver: zodResolver(escalationLevelSchema),
    defaultValues: {
      level: 1,
      userId: user?.id || 0,
      notificationType: "statutory",
      daysBeforeDue: 3,
      name: "",
      description: "",
    },
  });

  // Create escalation level mutation
  const createEscalationMutation = useMutation({
    mutationFn: async (data: EscalationFormValues) => {
      const response = await apiRequest("POST", "/api/escalation-levels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escalation-levels"] });
      toast({
        title: "Escalation level created",
        description: "The escalation level has been created successfully.",
      });
      setIsEscalationDialogOpen(false);
      escalationForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create escalation level: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update escalation level mutation
  const updateEscalationMutation = useMutation({
    mutationFn: async (data: EscalationFormValues & { id: number }) => {
      const { id, ...escalationData } = data;
      const response = await apiRequest("PATCH", `/api/escalation-levels/${id}`, escalationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escalation-levels"] });
      toast({
        title: "Escalation level updated",
        description: "The escalation level has been updated successfully.",
      });
      setIsEscalationDialogOpen(false);
      setSelectedEscalation(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update escalation level: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete escalation level mutation
  const deleteEscalationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/escalation-levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escalation-levels"] });
      toast({
        title: "Escalation level deleted",
        description: "The escalation level has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete escalation level: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter escalation levels based on active tab
  const filteredEscalationLevels = React.useMemo(() => {
    if (!escalationLevels) return [];
    
    switch (activeTab) {
      case "statutory":
        return escalationLevels.filter((level: EscalationLevel) => level.notificationType === "statutory");
      case "payment":
        return escalationLevels.filter((level: EscalationLevel) => level.notificationType === "payment");
      case "task":
        return escalationLevels.filter((level: EscalationLevel) => level.notificationType === "task");
      case "escalation":
        return escalationLevels.filter((level: EscalationLevel) => level.notificationType === "escalation");
      default:
        return escalationLevels;
    }
  }, [escalationLevels, activeTab]);

  // Handle escalation form submission
  const onSubmitEscalation = (data: EscalationFormValues) => {
    if (selectedEscalation) {
      updateEscalationMutation.mutate({ ...data, id: selectedEscalation.id });
    } else {
      createEscalationMutation.mutate(data);
    }
  };

  // Open edit escalation dialog
  const handleEditEscalation = (escalation: EscalationLevel) => {
    setSelectedEscalation(escalation);
    
    escalationForm.reset({
      level: escalation.level,
      userId: escalation.userId,
      notificationType: escalation.notificationType as "statutory" | "payment" | "task" | "escalation",
      daysBeforeDue: escalation.daysBeforeDue,
      name: escalation.name,
      description: escalation.description,
    });
    
    setIsEscalationDialogOpen(true);
  };

  // Open create escalation dialog
  const handleCreateEscalation = () => {
    setSelectedEscalation(null);
    escalationForm.reset({
      level: 1,
      userId: user?.id || 0,
      notificationType: "statutory",
      daysBeforeDue: 3,
      name: "",
      description: "",
    });
    setIsEscalationDialogOpen(true);
  };

  // Handle delete escalation
  const handleDeleteEscalation = (id: number) => {
    if (confirm("Are you sure you want to delete this escalation level?")) {
      deleteEscalationMutation.mutate(id);
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
  if (isLoadingEscalations) {
    return (
      <Layout title="Escalation Management">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Escalation Management">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Escalation Levels</h1>
          <Button onClick={handleCreateEscalation} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Escalation Level
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
                <CardTitle>Escalation Configuration</CardTitle>
                <CardDescription>
                  Manage your escalation levels for different notification types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEscalationLevels.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">No escalation levels found for this category.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleCreateEscalation}
                    >
                      Create Your First Escalation Level
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Level</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Days Before Due</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEscalationLevels.map((escalation: EscalationLevel) => (
                          <TableRow key={escalation.id}>
                            <TableCell className="font-medium">{escalation.level}</TableCell>
                            <TableCell>{escalation.name}</TableCell>
                            <TableCell>{getNotificationTypeBadge(escalation.notificationType)}</TableCell>
                            <TableCell>
                              {escalation.daysBeforeDue === 0 
                                ? "On due date" 
                                : escalation.daysBeforeDue === 1 
                                  ? "1 day before" 
                                  : `${escalation.daysBeforeDue} days before`}
                            </TableCell>
                            <TableCell>
                              {users?.find((u: any) => u.id === escalation.userId)?.username || "Unassigned"}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditEscalation(escalation)}>
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteEscalation(escalation.id)}
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

      {/* Create/Edit Escalation Level Dialog */}
      <Dialog open={isEscalationDialogOpen} onOpenChange={setIsEscalationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEscalation ? "Edit Escalation Level" : "Create Escalation Level"}
            </DialogTitle>
            <DialogDescription>
              {selectedEscalation 
                ? "Update the details of this escalation level." 
                : "Configure when and how escalations should occur."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...escalationForm}>
            <form onSubmit={escalationForm.handleSubmit(onSubmitEscalation)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={escalationForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter level number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Escalation priority level (1 being first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={escalationForm.control}
                  name="daysBeforeDue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days Before Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Days before due" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        When to trigger the notification (0 = on due date)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={escalationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter escalation name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={escalationForm.control}
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
                  control={escalationForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escalate To</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        User who will receive the escalation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={escalationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createEscalationMutation.isPending || updateEscalationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {(createEscalationMutation.isPending || updateEscalationMutation.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      {selectedEscalation ? "Update Escalation Level" : "Create Escalation Level"}
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