import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Calendar,
  Building,
  Tag,
  CheckCircle2,
  ChartBar,
  ShoppingCart,
  PieChart,
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Tender, TenderItem, Bid, Category, Bidder, BidItem } from "@shared/schema";

export default function TenderDetailPage() {
  const [, params] = useRoute<{ id: string }>("/tenders/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const tenderId = params ? parseInt(params.id) : 0;
  
  const { data: tender, isLoading: tenderLoading } = useQuery<Tender>({
    queryKey: [`/api/tenders/${tenderId}`],
    enabled: !!tenderId,
  });
  
  const { data: tenderItems, isLoading: itemsLoading } = useQuery<TenderItem[]>({
    queryKey: [`/api/tenders/${tenderId}/items`],
    enabled: !!tenderId,
  });
  
  const { data: bids, isLoading: bidsLoading } = useQuery<Bid[]>({
    queryKey: [`/api/tenders/${tenderId}/bids`],
    enabled: !!tenderId,
  });
  
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const { data: bidders, isLoading: biddersLoading } = useQuery<Bidder[]>({
    queryKey: ['/api/bidders'],
  });
  
  // Get category name
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };
  
  // Get bidder name
  const getBidderName = (bidderId: number) => {
    const bidder = bidders?.find(b => b.id === bidderId);
    return bidder?.name || "Unknown";
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'open': 'bg-green-100 text-green-800',
      'under review': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-red-100 text-red-800',
      'awarded': 'bg-gray-100 text-gray-800',
    };
    
    const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge variant="outline" className={colorClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Define columns for tender items table
  const itemColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: TenderItem) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row: TenderItem) => <span>{row.description}</span>,
    },
    {
      header: "Quantity",
      accessorKey: "quantity",
      cell: (row: TenderItem) => <span className="text-right">{row.quantity}</span>,
    },
    {
      header: "Unit",
      accessorKey: "unit",
      cell: (row: TenderItem) => <span>{row.unit}</span>,
    },
    {
      header: "Est. Price (USD)",
      accessorKey: "estimatedPrice",
      cell: (row: TenderItem) => <span className="font-medium text-right">${row.estimatedPrice?.toFixed(2) || '0.00'}</span>,
    },
    {
      header: "Total Est. (USD)",
      accessorKey: "totalEstimated",
      cell: (row: TenderItem) => {
        const total = (row.quantity || 0) * (row.estimatedPrice || 0);
        return <span className="font-medium text-right">${total.toFixed(2)}</span>;
      },
    },
  ];
  
  // Define columns for bids table
  const bidColumns = [
    {
      header: "Bid ID",
      accessorKey: "id",
      cell: (row: Bid) => <span className="font-medium">BID-{String(row.id).padStart(4, '0')}</span>,
    },
    {
      header: "Bidder",
      accessorKey: "bidderId",
      cell: (row: Bid) => <span>{getBidderName(row.bidderId)}</span>,
    },
    {
      header: "Amount (USD)",
      accessorKey: "totalAmount",
      cell: (row: Bid) => <span className="font-medium">${row.totalAmount.toFixed(2)}</span>,
    },
    {
      header: "Submission Date",
      accessorKey: "submissionDate",
      cell: (row: Bid) => <span>{format(new Date(row.submissionDate || Date.now()), 'MMM dd, yyyy')}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Bid) => <Badge variant="outline" className="bg-blue-100 text-blue-800">{row.status}</Badge>,
    },
    {
      header: "AI Score",
      accessorKey: "aiScore",
      cell: (row: Bid) => <span className="font-medium">{row.aiScore}/100</span>,
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: Bid) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">View Details</Button>
          <Button variant="outline" size="sm">Compare</Button>
        </div>
      ),
    },
  ];
  
  // Calculate tender stats
  const getTenderStats = () => {
    const totalItems = tenderItems?.length || 0;
    const totalBids = bids?.length || 0;
    const totalEstimatedValue = tenderItems?.reduce((sum, item) => sum + (item.quantity * (item.estimatedPrice || 0)), 0) || 0;
    const lowestBid = bids?.reduce((min, bid) => Math.min(min, bid.totalAmount), Infinity) || 0;
    const averageBid = totalBids ? bids?.reduce((sum, bid) => sum + bid.totalAmount, 0) / totalBids : 0;
    
    return {
      totalItems,
      totalBids,
      totalEstimatedValue,
      lowestBid: lowestBid === Infinity ? 0 : lowestBid,
      averageBid,
    };
  };
  
  const stats = getTenderStats();
  
  // Handle status change
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PUT", `/api/tenders/${tenderId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      toast({
        title: "Status updated",
        description: "The tender status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the tender status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };
  
  if (tenderLoading || !tender) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Button variant="outline" className="mb-2" onClick={() => navigate("/tenders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenders
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">{tender.title}</h1>
          <div className="flex items-center mt-2">
            <p className="text-gray-600 mr-2">ID: TEN-2023-{String(tender.id).padStart(3, '0')}</p>
            {getStatusBadge(tender.status)}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </Button>
          <Link href={`/tenders/${tender.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Tender
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-primary-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="font-medium">{format(new Date(tender.deadline), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-primary-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Bids Received</p>
                <p className="font-medium">{stats.totalBids}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Tag className="h-5 w-5 text-primary-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{getCategoryName(tender.categoryId)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-primary-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Total Est. Value</p>
                <p className="font-medium">${stats.totalEstimatedValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({stats.totalItems})</TabsTrigger>
          <TabsTrigger value="bids">Bids ({stats.totalBids})</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{tender.description}</p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tender Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium">{tender.status}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Created Date:</span>
                  <span className="font-medium">{format(new Date(tender.createdAt || Date.now()), 'MMM dd, yyyy')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Items:</span>
                  <span className="font-medium">{stats.totalItems}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Value:</span>
                  <span className="font-medium">${stats.totalEstimatedValue.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <div className="w-full">
                  <p className="text-sm font-medium mb-2">Change Tender Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={tender.status === 'draft' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('draft')}
                    >
                      Draft
                    </Button>
                    <Button
                      size="sm"
                      variant={tender.status === 'open' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('open')}
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant={tender.status === 'under review' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('under review')}
                    >
                      Under Review
                    </Button>
                    <Button
                      size="sm"
                      variant={tender.status === 'closed' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('closed')}
                    >
                      Closed
                    </Button>
                    <Button
                      size="sm"
                      variant={tender.status === 'awarded' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange('awarded')}
                    >
                      Awarded
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bid Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Bids:</span>
                  <span className="font-medium">{stats.totalBids}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Lowest Bid:</span>
                  <span className="font-medium">${stats.lowestBid.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Average Bid:</span>
                  <span className="font-medium">${stats.averageBid.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Difference from Estimate:</span>
                  <span className={`font-medium ${stats.lowestBid < stats.totalEstimatedValue ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalEstimatedValue ? ((stats.lowestBid - stats.totalEstimatedValue) / stats.totalEstimatedValue * 100).toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button className="w-full">
                  <ChartBar className="mr-2 h-4 w-4" />
                  View Detailed Analysis
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>AI-powered analysis and recommendations for this tender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ChartBar className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-primary-800">Price Analysis</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        The lowest bid is {stats.lowestBid < stats.totalEstimatedValue ? 'below' : 'above'} your estimated cost by {stats.totalEstimatedValue ? Math.abs((stats.lowestBid - stats.totalEstimatedValue) / stats.totalEstimatedValue * 100).toFixed(2) + '%' : 'N/A'}.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border-l-4 border-success-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-success-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Bidder Recommendation</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        Based on past performance and current bids, {stats.totalBids > 0 ? getBidderName(bids![0].bidderId) : 'No bidder'} has the strongest overall proposal.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border-l-4 border-warning-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <HelpCircle className="h-5 w-5 text-warning-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Market Insight</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        Material costs for {getCategoryName(tender.categoryId)} are expected to rise by 3-5% in the next quarter. Consider finalizing this tender quickly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Tender Items</CardTitle>
              <CardDescription>Items and materials requested in this tender</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tenderItems || []}
                columns={itemColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle>Received Bids</CardTitle>
              <CardDescription>All bids submitted for this tender</CardDescription>
            </CardHeader>
            <CardContent>
              {bids && bids.length > 0 ? (
                <DataTable
                  data={bids}
                  columns={bidColumns}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bids have been submitted for this tender yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Tender Analysis</CardTitle>
              <CardDescription>AI-powered comparison and analysis of all bids</CardDescription>
            </CardHeader>
            <CardContent>
              {bids && bids.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-4">Bid Comparison</h3>
                      <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
                        <PieChart className="h-10 w-10 text-gray-400" />
                        <span className="ml-2 text-gray-500">Chart visualization</span>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        This chart compares bids across all items, highlighting variances between bidders.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-4">Price Analysis</h3>
                      <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
                        <ChartBar className="h-10 w-10 text-gray-400" />
                        <span className="ml-2 text-gray-500">Chart visualization</span>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Compare bid prices against market averages and estimated costs.
                      </p>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Scoring and Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bids.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)).map((bid) => (
                          <div key={bid.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{getBidderName(bid.bidderId)}</h3>
                                <div className="flex items-center mt-1">
                                  <span className="text-sm text-gray-500 mr-2">AI Score:</span>
                                  <div className="w-32 h-2 bg-gray-200 rounded-full">
                                    <div
                                      className="h-2 bg-primary-600 rounded-full"
                                      style={{ width: `${bid.aiScore || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="ml-2 text-sm font-medium">{bid.aiScore}/100</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">${bid.totalAmount.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">
                                  {bid.totalAmount < stats.totalEstimatedValue 
                                    ? `${((stats.totalEstimatedValue - bid.totalAmount) / stats.totalEstimatedValue * 100).toFixed(2)}% below estimate` 
                                    : `${((bid.totalAmount - stats.totalEstimatedValue) / stats.totalEstimatedValue * 100).toFixed(2)}% above estimate`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-sm text-gray-700">
                              <p>
                                <strong>AI Analysis:</strong> This bid {Math.random() > 0.5 ? 'offers good value for money with competitive pricing' : 'includes higher quality materials but at a premium price'}.
                                {bid.notes && <span> Note: {bid.notes}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bids have been submitted for analysis yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
