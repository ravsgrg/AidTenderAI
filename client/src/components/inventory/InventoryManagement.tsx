
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  PlusCircle, 
  Search, 
  Filter, 
  RefreshCcw, 
  X 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import CategoryManagement from "./CategoryManagement";

interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  sku: string;
  quantity: number;
  minQuantity: number;
  location: string | null;
  lastUpdated: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  code?: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    description: '',
    categoryId: 0,
    sku: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
  });

  useEffect(() => {
    fetchInventoryItems();
    fetchCategories();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/inventory-items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        console.error('Failed to fetch inventory items:', response.statusText);
        setError(`Failed to fetch inventory items: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setError('Error fetching inventory items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setError(null);
      const response = await fetch('/api/inventory-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch inventory categories:', response.statusText);
        setError(`Failed to fetch inventory categories: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Error fetching categories. Please try again later.');
    }
  };

  const getItemStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return 'OUT_OF_STOCK';
    if (item.quantity <= item.minQuantity) return 'LOW_STOCK';
    return 'AVAILABLE';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'LOW_STOCK':
        return <Badge className="bg-yellow-500">Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge className="bg-red-500">Out of Stock</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategoryId ? item.categoryId === parseInt(selectedCategoryId) : true;
    const matchesSearch = searchQuery 
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedCategoryId("");
    setSearchQuery("");
  };

  const handleRefresh = () => {
    fetchInventoryItems();
    fetchCategories();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };
  
  const handleCategorySelect = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      categoryId: parseInt(value)
    }));
  };
  
  const handleAddItem = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!newItem.name || !newItem.sku || !newItem.categoryId) {
        setError("Name, SKU and Category are required fields");
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch('/api/inventory-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          lastUpdated: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setItems(prevItems => [...prevItems, data]);
        setIsAddModalOpen(false);
        setNewItem({
          name: '',
          description: '',
          categoryId: 0,
          sku: '',
          quantity: 0,
          minQuantity: 0,
          location: '',
        });
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setError('Error adding inventory item. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <CardTitle>Inventory Items</CardTitle>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="md:w-[200px]"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="md:w-[200px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
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
                <div className="text-center py-4">Loading inventory items...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-4">No inventory items found.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const status = getItemStatus(item);
                        const category = categories.find(c => c.id === item.categoryId);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.sku}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{category?.name || '-'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.location || '-'}</TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    {/* Add Item Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                name="name"
                value={newItem.name}
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
                value={newItem.description || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <div className="col-span-3">
                <Select onValueChange={handleCategorySelect} value={newItem.categoryId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={newItem.sku}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={newItem.quantity}
                onChange={handleNumberInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minQuantity" className="text-right">Min Quantity</Label>
              <Input
                id="minQuantity"
                name="minQuantity"
                type="number"
                min="0"
                value={newItem.minQuantity}
                onChange={handleNumberInputChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Location</Label>
              <Input
                id="location"
                name="location"
                value={newItem.location || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleAddItem} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
