import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Search, 
  Filter, 
  RefreshCcw,
  Calendar
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layout/page-layout";
import { DatePicker } from "@/components/ui/date-picker";

interface Tender {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date;
  categoryId: number;
  createdBy: number;
  category?: Category;
}

interface Category {
  id: number;
  name: string;
  cat_type: string;
}

export default function TenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTender, setNewTender] = useState<Partial<Tender>>({
    title: '',
    description: '',
    status: 'DRAFT',
    startDate: new Date(),
    endDate: new Date(),
    categoryId: 0,
  });

  useEffect(() => {
    fetchTenders();
    fetchCategories();
  }, []);

  const fetchTenders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/tenders');
      if (response.ok) {
        const data = await response.json();
        setTenders(data);
      } else {
        console.error('Failed to fetch tenders:', response.statusText);
        setError(`Failed to fetch tenders: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
      setError('Error fetching tenders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-500">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'CLOSED':
        return <Badge className="bg-red-500">Closed</Badge>;
      case 'AWARDED':
        return <Badge className="bg-blue-500">Awarded</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesStatus = selectedStatus === "all" ? true : tender.status === selectedStatus;
    const matchesSearch = searchQuery 
      ? tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tender.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const handleRefresh = () => {
    fetchTenders();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTender(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelect = (value: string) => {
    setNewTender(prev => ({
      ...prev,
      categoryId: parseInt(value)
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date) {
      setNewTender(prev => ({
        ...prev,
        [field]: date
      }));
    }
  };

  const handleAddTender = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!newTender.title || !newTender.categoryId || !newTender.startDate || !newTender.endDate) {
        setError("Title, Category, Start Date, and End Date are required fields");
        return;
      }

      if (newTender.startDate >= newTender.endDate) {
        setError("End Date must be after Start Date");
        return;
      }

      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTender),
      });

      if (response.ok) {
        const data = await response.json();
        setTenders(prevTenders => [...prevTenders, data]);
        setIsAddModalOpen(false);
        setNewTender({
          title: '',
          description: '',
          status: 'DRAFT',
          startDate: new Date(),
          endDate: new Date(),
          categoryId: 0,
        });
        toast({
          title: "Success",
          description: "Tender created successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create tender');
      }
    } catch (error) {
      console.error('Error creating tender:', error);
      setError('Error creating tender. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Tender Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tender
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>Tenders</CardTitle>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenders..."
                    className="md:w-[200px]"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="md:w-[200px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="AWARDED">Awarded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={handleClearFilters} title="Clear filters">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-4 text-red-500">{error}</div>
            )}
            {isLoading ? (
              <div className="text-center py-4">Loading tenders...</div>
            ) : filteredTenders.length === 0 ? (
              <div className="text-center py-4">No tenders found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenders.map((tender) => {
                      const category = categories.find(c => c.id === tender.categoryId);
                      return (
                        <TableRow key={tender.id}>
                          <TableCell>{tender.title}</TableCell>
                          <TableCell>{tender.description}</TableCell>
                          <TableCell>{category ? `${category.name} (${category.cat_type})` : '-'}</TableCell>
                          <TableCell>{new Date(tender.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(tender.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(tender.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Tender Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Tender</DialogTitle>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={newTender.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newTender.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <div className="col-span-3">
                  <Select onValueChange={handleCategorySelect} value={newTender.categoryId?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name} ({category.cat_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <div className="col-span-3">
                  <DatePicker
                    date={newTender.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date</Label>
                <div className="col-span-3">
                  <DatePicker
                    date={newTender.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddTender} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Tender'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
} 