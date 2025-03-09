import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowUpDown, 
  Filter, 
  Search, 
  Eye, 
  MoreVertical,
  ChartBar,
  CheckCircle,
  XCircle,
  Filter as FilterIcon
} from "lucide-react";
import { Bid, Tender, Bidder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

export default function BidsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tenderFilter, setTenderFilter] = useState<string>("");
  const [bidderFilter, setBidderFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { toast } = useToast();
  
  // Fetch bids, tenders, and bidders
  const { data: bids, isLoading: bidsLoading } = useQuery<Bid[]>({
    queryKey: ['/api/bids'],
  });
  
  const { data: tenders, isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ['/api/tenders'],
  });
  
  const { data: bidders, isLoading: biddersLoading } = useQuery<Bidder[]>({
    queryKey: ['/api/bidders'],
  });
  
  // Filter bids based on selected filters and search query
  const filteredBids = bids?.filter(bid => {
    const matchesStatus = !statusFilter || bid.status === statusFilter;
    const matchesTender = !tenderFilter || bid.tenderId.toString() === tenderFilter;
    const matchesBidder = !bidderFilter || bid.bidderId.toString() === bidderFilter;
    
    // Check if bid matches search query (bidder name or tender title)
    let matchesSearch = true;
    if (searchQuery) {
      const bidder = bidders?.find(b => b.id === bid.bidderId);
      const tender = tenders?.find(t => t.id === bid.tenderId);
      matchesSearch = 
        (bidder?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (tender?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    }
    
    return matchesStatus && matchesTender && matchesBidder && matchesSearch;
  });
  
  // Get tender title by ID
  const getTenderTitle = (tenderId: number) => {
    const tender = tenders?.find(t => t.id === tenderId);
    return tender?.title || "Unknown Tender";
  };
  
  // Get bidder name by ID
  const getBidderName = (bidderId: number) => {
    const bidder = bidders?.find(b => b.id === bidderId);
    return bidder?.name || "Unknown Bidder";
  };
  
  // Update bid status
  const updateBidStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PUT", `/api/bids/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['/api/bids'] });
      toast({
        title: "Bid status updated",
        description: `Bid status changed to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bid status.",
        variant: "destructive",
      });
    }
  };
  
  // Columns for the bids table
  const bidColumns = [
    {
      header: "Bid ID",
      accessorKey: "id",
      cell: (row: Bid) => <span className="font-medium">BID-{String(row.id).padStart(4, '0')}</span>,
    },
    {
      header: "Tender",
      accessorKey: "tenderId",
      cell: (row: Bid) => (
        <Link href={`/tenders/${row.tenderId}`}>
          <a className="text-primary-600 hover:underline font-medium">
            {getTenderTitle(row.tenderId)}
          </a>
        </Link>
      ),
    },
    {
      header: "Bidder",
      accessorKey: "bidderId",
      cell: (row: Bid) => (
        <Link href={`/bidders/${row.bidderId}`}>
          <a className="text-primary-600 hover:underline">
            {getBidderName(row.bidderId)}
          </a>
        </Link>
      ),
    },
    {
      header: () => (
        <div className="flex items-center">
          <span>Amount (USD)</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
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
      cell: (row: Bid) => {
        const statuses: Record<string, { text: string, className: string }> = {
          'submitted': { text: 'Submitted', className: 'bg-blue-100 text-blue-800' },
          'under review': { text: 'Under Review', className: 'bg-yellow-100 text-yellow-800' },
          'accepted': { text: 'Accepted', className: 'bg-green-100 text-green-800' },
          'rejected': { text: 'Rejected', className: 'bg-red-100 text-red-800' },
        };
        
        const status = statuses[row.status.toLowerCase()] || { text: row.status, className: 'bg-gray-100 text-gray-800' };
        
        return (
          <Badge variant="outline" className={status.className}>
            {status.text}
          </Badge>
        );
      },
    },
    {
      header: "AI Score",
      accessorKey: "aiScore",
      cell: (row: Bid) => {
        const score = row.aiScore || 0;
        let colorClass = "text-gray-600";
        
        if (score >= 80) colorClass = "text-green-600";
        else if (score >= 60) colorClass = "text-yellow-600";
        else if (score > 0) colorClass = "text-red-600";
        
        return <span className={`font-medium ${colorClass}`}>{score}/100</span>;
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: Bid) => (
        <div className="flex items-center">
          <Link href={`/bids/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600 hover:text-primary-900">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Link href={`/bids/${row.id}/analysis`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600 hover:text-primary-900">
              <ChartBar className="h-4 w-4" />
              <span className="sr-only">Analysis</span>
            </Button>
          </Link>
          
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
                onClick={() => updateBidStatus(row.id, "under review")}
                disabled={row.status === "under review"}
              >
                <FilterIcon className="mr-2 h-4 w-4 text-yellow-500" />
                <span>Mark as Under Review</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center" 
                onClick={() => updateBidStatus(row.id, "accepted")}
                disabled={row.status === "accepted"}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Accept Bid</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center" 
                onClick={() => updateBidStatus(row.id, "rejected")}
                disabled={row.status === "rejected"}
              >
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                <span>Reject Bid</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  return (
    <PageLayout pageTitle="Bids" pageDescription="Manage and analyze all submitted bids">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bids..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tenderFilter} onValueChange={setTenderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tenders</SelectItem>
                {tenders?.map((tender) => (
                  <SelectItem key={tender.id} value={tender.id.toString()}>
                    {tender.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={bidderFilter} onValueChange={setBidderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by bidder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Bidders</SelectItem>
                {bidders?.map((bidder) => (
                  <SelectItem key={bidder.id} value={bidder.id.toString()}>
                    {bidder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filter
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <DataTable
            data={filteredBids || []}
            columns={bidColumns}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
