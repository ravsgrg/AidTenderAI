import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search, 
  Plus, 
  Eye, 
  Edit, 
  MoreVertical,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { Bidder, Bid, insertBidderSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const bidderFormSchema = insertBidderSchema.extend({
  rating: z.number().min(0).max(5).optional(),
});

type BidderFormData = z.infer<typeof bidderFormSchema>;

export default function BiddersPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);
  
  const { toast } = useToast();
  
  // Fetch bidders and bids
  const { data: bidders, isLoading: biddersLoading } = useQuery<Bidder[]>({
    queryKey: ['/api/bidders'],
  });
  
  const { data: bids, isLoading: bidsLoading } = useQuery<Bid[]>({
    queryKey: ['/api/bids'],
  });
  
  // Filter bidders based on search query
  const filteredBidders = bidders?.filter(bidder => {
    if (!searchQuery) return true;
    
    return (
      bidder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bidder.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bidder.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Count bids per bidder
  const getBidCount = (bidderId: number) => {
    return bids?.filter(bid => bid.bidderId === bidderId).length || 0;
  };
  
  // Setup form for adding/editing bidders
  const form = useForm<BidderFormData>({
    resolver: zodResolver(bidderFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      rating: 0,
      verified: false,
    }
  });
  
  // Create bidder mutation
  const createBidderMutation = useMutation({
    mutationFn: async (data: BidderFormData) => {
      const res = await apiRequest("POST", "/api/bidders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bidders'] });
      toast({
        title: "Bidder added",
        description: "The bidder has been successfully added.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add bidder. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update bidder mutation
  const updateBidderMutation = useMutation({
    mutationFn: async ({id, data}: {id: number, data: BidderFormData}) => {
      const res = await apiRequest("PUT", `/api/bidders/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bidders'] });
      toast({
        title: "Bidder updated",
        description: "The bidder has been successfully updated.",
      });
      setIsAddDialogOpen(false);
      setSelectedBidder(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bidder. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete bidder mutation
  const deleteBidderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bidders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bidders'] });
      toast({
        title: "Bidder deleted",
        description: "The bidder has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete bidder. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle verification toggle
  const toggleVerification = async (bidder: Bidder) => {
    try {
      await apiRequest("PUT", `/api/bidders/${bidder.id}`, {
        ...bidder,
        verified: !bidder.verified
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/bidders'] });
      
      toast({
        title: bidder.verified ? "Bidder unverified" : "Bidder verified",
        description: `${bidder.name} is now ${bidder.verified ? "unverified" : "verified"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const onSubmit = (data: BidderFormData) => {
    if (selectedBidder) {
      updateBidderMutation.mutate({id: selectedBidder.id, data});
    } else {
      createBidderMutation.mutate(data);
    }
  };
  
  // Handle edit bidder
  const handleEdit = (bidder: Bidder) => {
    setSelectedBidder(bidder);
    form.reset({
      name: bidder.name,
      contactPerson: bidder.contactPerson,
      email: bidder.email,
      phone: bidder.phone,
      address: bidder.address || "",
      rating: bidder.rating || 0,
      verified: bidder.verified || false,
    });
    setIsAddDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setSelectedBidder(null);
    form.reset();
  };
  
  // Generate star rating display
  const renderRating = (rating: number = 0) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };
  
  // Columns for the bidders table
  const bidderColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: Bidder) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold mr-3">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.name}</span>
            {row.verified && (
              <Badge variant="outline" className="mt-1 bg-green-100 text-green-800">
                Verified
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Contact Person",
      accessorKey: "contactPerson",
      cell: (row: Bidder) => <span>{row.contactPerson}</span>,
    },
    {
      header: "Contact Info",
      accessorKey: "contactInfo",
      cell: (row: Bidder) => (
        <div className="flex flex-col">
          <span className="flex items-center">
            <Mail className="h-3 w-3 mr-1 text-gray-400" />
            {row.email}
          </span>
          <span className="flex items-center mt-1">
            <Phone className="h-3 w-3 mr-1 text-gray-400" />
            {row.phone}
          </span>
        </div>
      ),
    },
    {
      header: "Rating",
      accessorKey: "rating",
      cell: (row: Bidder) => renderRating(row.rating),
    },
    {
      header: "Bids",
      accessorKey: "bids",
      cell: (row: Bidder) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {getBidCount(row.id)} Bids
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: Bidder) => (
        <div className="flex items-center">
          <Link href={`/bidders/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600 hover:text-primary-900">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary-600 hover:text-primary-900"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="flex items-center" 
                onClick={() => toggleVerification(row)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>{row.verified ? "Remove Verification" : "Mark as Verified"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center text-red-600" 
                onClick={() => deleteBidderMutation.mutate(row.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Bidder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  return (
    <PageLayout pageTitle="Bidders" pageDescription="Manage and track all bidders in the system">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-primary-100 rounded-full p-3 text-primary-600">
                <Building className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bidders</p>
                <p className="text-2xl font-semibold text-gray-900">{bidders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verified Bidders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bidders?.filter(b => b.verified).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 text-blue-600">
                <Star className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bidders && bidders.length > 0
                    ? (bidders.reduce((sum, b) => sum + (b.rating || 0), 0) / bidders.length).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bidders..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bidder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{selectedBidder ? "Edit Bidder" : "Add New Bidder"}</DialogTitle>
                <DialogDescription>
                  {selectedBidder 
                    ? "Update the bidder details below."
                    : "Fill in the details for the new bidder."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter email address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating (0-5)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="5" 
                              step="1"
                              placeholder="Enter rating" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="verified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Verified Bidder</FormLabel>
                          <FormDescription>
                            Mark this bidder as verified for tender participation
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {selectedBidder ? "Update Bidder" : "Add Bidder"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="p-6">
          <DataTable
            data={filteredBidders || []}
            columns={bidderColumns}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
