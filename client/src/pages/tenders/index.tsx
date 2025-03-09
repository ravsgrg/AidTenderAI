import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PageLayout } from "@/components/layout/page-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Plus, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  MoreVertical,
  Download,
  FileText,
  Trash2 
} from "lucide-react";
import { Tender, Category } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TendersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { toast } = useToast();

  const { data: tenders, isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ['/api/tenders'],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const filteredTenders = tenders?.filter(tender => {
    const matchesStatus = !statusFilter || tender.status === statusFilter;
    const matchesCategory = !categoryFilter || tender.categoryId.toString() === categoryFilter;
    const matchesSearch = !searchQuery || 
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getCategoryBadge = (categoryId: number) => {
    const categoryColors: Record<number, string> = {
      1: 'bg-purple-100 text-purple-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-amber-100 text-amber-800',
      4: 'bg-pink-100 text-pink-800',
    };

    const colorClass = categoryColors[categoryId] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge variant="outline" className={colorClass}>
        {getCategoryName(categoryId)}
      </Badge>
    );
  };

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

  const handleDeleteTender = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/tenders/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      toast({
        title: "Tender deleted",
        description: "The tender has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the tender. Please try again.",
        variant: "destructive",
      });
    }
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
      cell: (row: Tender) => (
        <Link href={`/tenders/${row.id}`}>
          <a className="font-medium text-primary-600 hover:underline">
            {row.title}
          </a>
        </Link>
      ),
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
      header: "Created At",
      accessorKey: "createdAt",
      cell: (row: Tender) => (
        <span className="text-gray-700">
          {format(new Date(row.createdAt || Date.now()), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: Tender) => "actions",
      cell: (row: Tender) => (
        <div className="flex items-center">
          <Link href={`/tenders/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600 hover:text-primary-900">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Link href={`/tenders/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600 hover:text-primary-900">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
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
              <DropdownMenuItem className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>Export Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                <span>Download Documents</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center text-red-600" 
                onClick={() => handleDeleteTender(row.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Tender</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  ];

  return (
    <PageLayout pageTitle="Tenders" pageDescription="Manage all tender requests and submissions">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tenders..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Link href="/tenders/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> 
                New Tender
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          <DataTable
            data={filteredTenders || []}
            columns={tenderColumns}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
