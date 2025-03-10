import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  RefreshCcw,
  Download,
  Upload
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

type CategoryType = 'EQUIPMENT' | 'MATERIALS' | 'SERVICES';

interface Category {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
  cat_type: CategoryType;
  parent_id: number | null;
  children?: Category[];
}

interface InventoryItem {
  id: number;
  item_no: string;
  desc: string;
  unit: string;
  unit_cost: number;
  unit_weight: number;
  qty: number;
  categoryId: number;
  category?: Category;
}

type ToastVariant = 'default' | 'destructive';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface BulkImportResponse extends ApiResponse<never> {
  imported: number;
  failed: number;
  errors?: string[];
  items: InventoryItem[];
}

function isInventoryItemArray(items: unknown): items is InventoryItem[] {
  return Array.isArray(items) && items.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'id' in item && 
    'item_no' in item
  );
}

const defaultNewItem: Omit<InventoryItem, 'id'> = {
  item_no: '',
  desc: '',
  unit: '',
  unit_cost: 0,
  unit_weight: 0,
  qty: 0,
  categoryId: 0,
};

const CSV_HEADERS = ['item_no', 'desc', 'unit', 'unit_cost', 'unit_weight', 'qty', 'categoryId'];

const API_BASE_URL = '/api';

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>(defaultNewItem);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchInventoryItems(), fetchCategories()]);
    } catch (error) {
      setError('Error fetching data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    const response = await fetch(`${API_BASE_URL}/inventory-items`);
    if (!response.ok) throw new Error(`Failed to fetch inventory items: ${response.statusText}`);
    const data = await response.json();
    setItems(data);
  };

  const fetchCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);
    const data = await response.json();
    setCategories(sortCategoriesByHierarchy(data));
  };

  const sortCategoriesByHierarchy = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number | null, Category[]>();
    categories.forEach(cat => {
      const parentId = cat.parent_id;
      if (!categoryMap.has(parentId)) categoryMap.set(parentId, []);
      categoryMap.get(parentId)!.push(cat);
    });

    const buildTree = (parentId: number | null): Category[] => {
      const children = categoryMap.get(parentId) || [];
      return children.map(child => ({
        ...child,
        children: buildTree(child.id)
      }));
    };

    return buildTree(null);
  };

  const getCategoryPath = (category: Category | undefined): string => {
    if (!category) return '-';
    
    const getParentPath = (cat: Category): string => {
      const parent = categories.find(c => c.id === cat.parent_id);
      return parent ? `${getParentPath(parent)} > ${cat.name}` : cat.name;
    };

    return `${getParentPath(category)} (${category.cat_type})`;
  };

  const getLeafCategories = (categories: Category[]): Category[] => {
    const parentIds = new Set(categories.map(cat => cat.parent_id).filter(Boolean));
    return categories.filter(cat => !parentIds.has(cat.id));
  };

  const flattenCategories = (categories: Category[]): Category[] => {
    const flattened: Category[] = [];
    const flatten = (category: Category, level = 0) => {
      flattened.push({ ...category, name: '  '.repeat(level) + category.name });
      category.children?.forEach(child => flatten(child, level + 1));
    };
    categories.forEach(cat => flatten(cat));
    return flattened;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const validateNewItem = (): string | null => {
    if (!newItem.item_no || !newItem.categoryId || !newItem.qty || !newItem.unit) {
      return "Please fill in all required fields (Item No, Category, Unit, and Quantity)";
    }
    if (newItem.unit_cost < 0 || newItem.unit_weight < 0 || newItem.qty < 0) {
      return "Cost, weight, and quantity cannot be negative";
    }
    return null;
  };

  const handleAddItem = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const validationError = validateNewItem();
      if (validationError) {
        setError(validationError);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/inventory-items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newItem),
      });
      
      const result = await response.json() as ApiResponse<InventoryItem>;
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to add item');
      }

      if (result.data) {
        setItems(prevItems => [...prevItems, result.data!]);
        setIsAddModalOpen(false);
        setNewItem(defaultNewItem);
        toast({ 
          title: "Success", 
          description: result.message || "Item added successfully",
          variant: "default"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error adding inventory item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCsvFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please upload a CSV file';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'File size should not exceed 5MB';
    }
    return null;
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    const fileError = validateCsvFile(importFile);
    if (fileError) {
      setError(fileError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(`${API_BASE_URL}/inventory-items/bulk-import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to import items');
      }

      if (result.errors?.length) {
        const errorMessage = `Imported ${result.imported} items with ${result.failed} errors:\n${result.errors.join('\n')}`;
        if (result.imported > 0 && result.items?.length > 0) {
          toast({
            title: "Partial Success",
            description: `Successfully imported ${result.imported} items. See errors below.`,
            variant: "default"
          });
          setItems(prevItems => [...prevItems, ...result.items]);
        }
        setError(errorMessage);
      } else {
        toast({ 
          title: "Success", 
          description: result.message || `Successfully imported ${result.imported} items`,
          variant: "default"
        });
        setIsImportModalOpen(false);
        await fetchInventoryItems();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error importing items';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setImportFile(null);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleData = {
      item_no: 'ITEM001',
      desc: 'Sample Item Description',
      unit: 'PCS',
      unit_cost: '100.00',
      unit_weight: '1.5',
      qty: '10',
      categoryId: '1'
    };
    
    const csvContent = 
      CSV_HEADERS.join(',') + '\n' + 
      CSV_HEADERS.map(header => sampleData[header as keyof typeof sampleData]).join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategoryId || selectedCategoryId === "all" || 
      item.categoryId === parseInt(selectedCategoryId);
    const matchesSearch = !searchQuery || 
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.item_no.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'OUT OF STOCK', color: 'bg-red-500' };
    if (qty <= 5) return { label: 'LOW STOCK', color: 'bg-yellow-500' };
    return { label: 'AVAILABLE', color: 'bg-green-500' };
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button variant="outline" onClick={fetchData}>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="md:w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {flattenCategories(categories).map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name} ({category.cat_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setSelectedCategoryId("all");
                    setSearchQuery("");
                  }} 
                  title="Clear filters"
                >
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
                      <TableHead>Item No</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Unit Weight</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const category = categories.find(c => c.id === item.categoryId);
                      const status = getStockStatus(item.qty);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_no}</TableCell>
                          <TableCell>{item.desc}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.unit_cost}</TableCell>
                          <TableCell>{item.unit_weight}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{getCategoryPath(category)}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Modal */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bulk Import Inventory Items</DialogTitle>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative whitespace-pre-line">
                {error}
              </div>
            )}
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const error = validateCsvFile(file);
                      if (error) {
                        setError(error);
                        e.target.value = '';
                        return;
                      }
                      setError(null);
                      setImportFile(file);
                    }
                  }}
                />
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Please make sure your CSV file:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Matches the template format (download template above)</li>
                    <li>Is a valid CSV file</li>
                    <li>Is under 5MB in size</li>
                    <li>Contains all required columns: Item No, Unit, Quantity, and Category ID</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsImportModalOpen(false);
                setError(null);
                setImportFile(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkImport}
                disabled={!importFile || isSubmitting}
              >
                {isSubmitting ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                <Label htmlFor="item_no" className="text-right">Item No *</Label>
                <Input
                  id="item_no"
                  name="item_no"
                  value={newItem.item_no}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Textarea
                  id="desc"
                  name="desc"
                  value={newItem.desc}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category *</Label>
                <div className="col-span-3">
                  <Select 
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, categoryId: parseInt(value) }))}
                    value={newItem.categoryId?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getLeafCategories(categories).map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {getCategoryPath(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit *</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={newItem.unit}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_cost" className="text-right">Unit Cost *</Label>
                <Input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={handleNumberInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_weight" className="text-right">Unit Weight *</Label>
                <Input
                  id="unit_weight"
                  name="unit_weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_weight}
                  onChange={handleNumberInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qty" className="text-right">Quantity *</Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  min="0"
                  value={newItem.qty}
                  onChange={handleNumberInputChange}
                  className="col-span-3"
                  required
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
    </PageLayout>
  );
}
