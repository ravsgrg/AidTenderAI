import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { insertTenderSchema, insertTenderItemSchema, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Trash2, Plus, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

const createTenderSchema = insertTenderSchema.extend({
  deadline: z.date({
    required_error: "A deadline is required",
  }),
  items: z.array(
    insertTenderItemSchema.omit({ tenderId: true }).extend({
      tempId: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
});

type CreateTenderFormData = z.infer<typeof createTenderSchema>;

export default function CreateTenderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch categories for the dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Create tender mutation
  const createTenderMutation = useMutation({
    mutationFn: async (data: CreateTenderFormData) => {
      // First create the tender
      const tenderResponse = await apiRequest("POST", "/api/tenders", {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        status: data.status,
        deadline: data.deadline,
        createdBy: user?.id,
      });
      
      const tender = await tenderResponse.json();
      
      // Then create tender items
      const items = data.items.map(item => ({
        ...item,
        tenderId: tender.id
      }));
      
      await Promise.all(
        items.map(item => apiRequest("POST", "/api/tender-items", item))
      );
      
      return tender;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      toast({
        title: "Success",
        description: "Tender created successfully"
      });
      navigate(`/tenders/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tender",
        variant: "destructive"
      });
    }
  });

  // Form setup
  const form = useForm<CreateTenderFormData>({
    resolver: zodResolver(createTenderSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      status: "draft",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
      items: [
        {
          tempId: crypto.randomUUID(),
          name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          estimatedPrice: 0,
        }
      ]
    }
  });

  // Add a new tender item
  const addItem = () => {
    const items = form.getValues("items") || [];
    form.setValue("items", [
      ...items,
      {
        tempId: crypto.randomUUID(),
        name: "",
        description: "",
        quantity: 1,
        unit: "pcs",
        estimatedPrice: 0,
      }
    ]);
  };

  // Remove a tender item
  const removeItem = (index: number) => {
    const items = form.getValues("items");
    form.setValue("items", items.filter((_, i) => i !== index));
  };

  // Form submission
  const onSubmit = (data: CreateTenderFormData) => {
    createTenderMutation.mutate(data);
  };

  return (
    <PageLayout pageTitle="Create Tender" pageDescription="Create a new tender for community aid construction project">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/tenders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tenders
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tender Information</CardTitle>
              <CardDescription>Provide the basic details for this tender</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tender title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title for the tender
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter tender description"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the tender requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        disabled={categoriesLoading}
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open for Bids</SelectItem>
                          <SelectItem value="under review">Under Review</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="awarded">Awarded</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tender Items</CardTitle>
              <CardDescription>Add the items required for this tender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("items")?.map((item, index) => (
                  <div key={item.tempId || index} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Item {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={form.watch("items").length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Item description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Quantity"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pcs">Pieces</SelectItem>
                                <SelectItem value="kg">Kilograms</SelectItem>
                                <SelectItem value="m">Meters</SelectItem>
                                <SelectItem value="l">Liters</SelectItem>
                                <SelectItem value="box">Boxes</SelectItem>
                                <SelectItem value="set">Sets</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.estimatedPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Price (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Estimated price"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/tenders")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTenderMutation.isPending}>
              {createTenderMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Tender
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
