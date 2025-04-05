import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, CheckCircle, LockKeyhole, User, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const [generatingSampleData, setGeneratingSampleData] = useState(false);
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };
  
  const generateSampleData = async () => {
    if (generatingSampleData) return;
    
    try {
      setGeneratingSampleData(true);
      toast({
        title: "Generating Sample Data",
        description: "Please wait while we populate the database with sample data...",
      });
      
      const response = await apiRequest("POST", "/api/sample-data", {});
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: `Created ${result.users} users, ${result.tasks} tasks, and ${result.notifications} notifications.`,
        });
        
        // Automatically fill in an admin login
        loginForm.setValue("username", "admin1");
        loginForm.setValue("password", "password123");
      } else {
        toast({
          title: "Error",
          description: "Failed to generate sample data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error("Sample data generation error:", error);
    } finally {
      setGeneratingSampleData(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row w-full">
        {/* Auth Form Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold text-primary">Compliance Hub</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Login Form */}
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="Enter your username" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : "Login"}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Sample Login: <span className="font-medium">admin1</span> / Password: <span className="font-medium">password123</span>
                  </p>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-gray-500 mt-4">
                <p>
                  New account registration is managed by administrators.
                  Please contact your system administrator for access.
                </p>
              </div>
              
              {/* Sample Data Generator Button */}
              <div className="pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={generateSampleData}
                  disabled={generatingSampleData}
                >
                  {generatingSampleData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Sample Data...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Generate Sample Data
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Populate the database with sample users, tasks, and notifications for testing.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Hero Section */}
        <div className="hidden md:flex md:w-1/2 bg-primary p-8 text-white flex-col justify-center">
          <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-3xl font-bold mb-4">Compliance Notification System</h1>
            <p className="text-lg opacity-90">
              Streamline your compliance management with automated notifications, task tracking, and real-time alerts.
            </p>
            <div className="space-y-4 mt-8">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-6 w-6 text-green-300 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Automated Reminders</h3>
                  <p className="opacity-80 text-sm">Never miss critical deadlines with our intelligent notification system.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-6 w-6 text-green-300 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Multi-channel Notifications</h3>
                  <p className="opacity-80 text-sm">Receive alerts through email, SMS, and dashboard notifications.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-6 w-6 text-green-300 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Role-based Access Control</h3>
                  <p className="opacity-80 text-sm">Customize access and notification settings for your entire team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}