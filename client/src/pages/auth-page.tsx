import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LayoutDashboard } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(3, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  console.log("AuthPage rendering");
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  console.log("Auth user state:", user, "isLoading:", isLoading);
  
  useEffect(() => {
    console.log("AuthPage useEffect - user:", user, "isLoading:", isLoading);
  }, [user, isLoading]);
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "password",
    },
  });
  
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const onLoginSubmit = (data: LoginFormData) => {
    console.log("Login submit with data:", data);
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormData) => {
    console.log("Register submit with data:", data);
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Redirect if already logged in (do this check after hooks)
  if (user) {
    console.log("User authenticated, redirecting to dashboard");
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Forms */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="p-2 bg-primary-600 rounded-lg mr-3">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">TenderAI</h1>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the tender management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
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
                              <Input type="password" placeholder="••••••••" {...field} />
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
                        ) : (
                          "Log in"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center text-sm">
                    <p className="text-gray-600">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary-600"
                        onClick={() => setActiveTab("register")}
                      >
                        Register here
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to access the tender management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center text-sm">
                    <p className="text-gray-600">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary-600"
                        onClick={() => setActiveTab("login")}
                      >
                        Log in here
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-700 to-primary-900">
        <div className="flex flex-col justify-center h-full p-12 text-white">
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold mb-6">
              AI-Powered Tender Management System
            </h2>
            <p className="text-xl mb-8">
              Streamline your community aid construction projects with intelligent bid comparison and analysis.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600">
                    <span className="text-lg font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Dynamic Category-Based Tendering</h3>
                  <p className="mt-1">Create, manage, and expand tender categories with ease</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600">
                    <span className="text-lg font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Automated Bid Comparison</h3>
                  <p className="mt-1">Instantly compare bidder submissions with auto-ranking</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600">
                    <span className="text-lg font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">AI-Powered Insights</h3>
                  <p className="mt-1">Make smarter procurement decisions with predictive analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
