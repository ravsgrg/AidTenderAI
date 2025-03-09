import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  CheckCircle, 
  Building, 
  DollarSign, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  MoreVertical
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { BidComparisonChart } from "@/components/dashboard/bid-comparison-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tender, Bidder } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: tenderStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/tender-stats'],
  });
  
  const { data: bidderAnalytics, isLoading: biddersLoading } = useQuery({
    queryKey: ['/api/analytics/bidder-analytics'],
  });

  const { data: tenders, isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ['/api/tenders'],
  });

  const { data: bidders, isLoading: allBiddersLoading } = useQuery<Bidder[]>({
    queryKey: ['/api/bidders'],
  });

  const getCategoryBadge = (categoryId: number) => {
    const categories: Record<number, { name: string, className: string }> = {
      1: { name: 'Basic Hardware', className: 'bg-purple-100 text-purple-800' },
      2: { name: 'Pipes & Fittings', className: 'bg-blue-100 text-blue-800' },
      3: { name: 'Electrical', className: 'bg-amber-100 text-amber-800' },
      4: { name: 'Manufactured Items', className: 'bg-pink-100 text-pink-800' },
    };

    const category = categories[categoryId] || { name: 'Other', className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={category.className}>
        {category.name}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string, className: string }> = {
      'draft': { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      'open': { label: 'Open for Bids', className: 'bg-green-100 text-green-800' },
      'under review': { label: 'Under Review', className: 'bg-yellow-100 text-yellow-800' },
      'closed': { label: 'Closed', className: 'bg-red-100 text-red-800' },
      'awarded': { label: 'Awarded', className: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statuses[status.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const tenderColumns = [
    {
      header: "Tender ID",
      accessorKey: "id",
      cell: (row: Tender) => <span className="font-medium text-gray-900">TEN-2023-{String(row.id).padStart(3, '0')}</span>,
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: (row: Tender) => <span className="text-gray-700">{row.title}</span>,
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: (row: Tender) => getCategoryBadge(row.categoryId),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Tender) => getStatusBadge(row.status),
    },
    {
      header: "Deadline",
      accessorKey: "deadline",
      cell: (row: Tender) => (
        <span className="text-gray-700">
          {format(new Date(row.deadline), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: "Bidders",
      accessorKey: (row: Tender) => "bidders",
      cell: (row: Tender) => (
        <div className="flex -space-x-2">
          {[...Array(Math.floor(Math.random() * 5) + 1)].map((_, i) => (
            <Avatar key={i} className="h-6 w-6 border border-white">
              <AvatarFallback className="text-xs bg-primary-100 text-primary-800">
                {String.fromCharCode(65 + i)}
              </AvatarFallback>
            </Avatar>
          ))}
          {Math.random() > 0.5 && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-gray-200 text-xs text-gray-500">
              +{Math.floor(Math.random() * 5) + 1}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: Tender) => "actions",
      cell: (row: Tender) => (
        <div className="flex items-center">
          <Link href={`/tenders/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4 text-primary-600" />
            </Button>
          </Link>
          <Link href={`/tenders/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4 text-primary-600" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  ];

  return (
    <PageLayout pageTitle="Dashboard" pageDescription="Overview of the Tender Management System">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Tenders"
          value={statsLoading ? "..." : tenderStats?.activeTenders || 0}
          icon={<FileText className="h-5 w-5" />}
          iconBackground="bg-primary-100"
          iconColor="text-primary-600"
          trend={{ value: 4, label: "from last month", isUpward: true }}
        />
        
        <StatsCard
          title="Awarded Contracts"
          value={statsLoading ? "..." : tenderStats?.awardedTenders || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          iconBackground="bg-green-100"
          iconColor="text-success-500"
          trend={{ value: 12, label: "from last month", isUpward: true }}
        />
        
        <StatsCard
          title="Qualified Bidders"
          value={biddersLoading ? "..." : bidderAnalytics?.qualifiedBidders || 0}
          icon={<Building className="h-5 w-5" />}
          iconBackground="bg-amber-100"
          iconColor="text-warning-500"
          trend={{ value: 6, label: "from last month", isUpward: true }}
        />
        
        <StatsCard
          title="Total Value (USD)"
          value={statsLoading ? "..." : `$${Number(tenderStats?.totalValue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          iconBackground="bg-blue-100"
          iconColor="text-primary-600"
          trend={{ value: 3, label: "from last month", isUpward: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <AiInsights />
        <div className="lg:col-span-2">
          <BidComparisonChart />
        </div>
      </div>

      {/* Recent Tenders Table */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tenders</h2>
          <div className="flex space-x-2">
            <Link href="/tenders/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Tender
              </Button>
            </Link>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        <div className="p-6">
          <DataTable
            data={tenders || []}
            columns={tenderColumns}
            pageSize={5}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
