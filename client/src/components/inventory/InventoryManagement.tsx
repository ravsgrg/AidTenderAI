
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

interface InventoryCategory {
  id: number;
  name: string;
  description: string | null;
  code: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'>>({
    name: '',
    description: '',
    categoryId: 0,
    sku: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/inventory-items'),
          axios.get('/api/inventory-categories')
        ]);
        setItems(itemsResponse.data);
        setCategories(categoriesResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to load inventory data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'categoryId' || name === 'quantity' || name === 'minQuantity' 
        ? parseInt(value, 10) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/inventory-items', newItem);
      setItems(prev => [...prev, response.data]);
      setNewItem({
        name: '',
        description: '',
        categoryId: 0,
        sku: '',
        quantity: 0,
        minQuantity: 0,
        location: '',
      });
      setIsAddingItem(false);
    } catch (err) {
      setError('Failed to add inventory item');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory-items/${id}`);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        setError('Failed to delete inventory item');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-4">Loading inventory data...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button 
          onClick={() => setIsAddingItem(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add New Item
        </button>
      </div>

      {isAddingItem && (
        <div className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Inventory Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={newItem.sku}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Category</label>
                <select
                  name="categoryId"
                  value={newItem.categoryId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-1">Minimum Quantity</label>
                <input
                  type="number"
                  name="minQuantity"
                  value={newItem.minQuantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newItem.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1">Description</label>
                <textarea
                  name="description"
                  value={newItem.description || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded text-center">
          <p className="text-gray-500">No inventory items found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Min Quantity</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Last Updated</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                const isLowStock = item.quantity < item.minQuantity;
                
                return (
                  <tr key={item.id} className={isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 border-t">{item.name}</td>
                    <td className="px-4 py-2 border-t">{item.sku}</td>
                    <td className="px-4 py-2 border-t">{category?.name || 'Unknown'}</td>
                    <td className={`px-4 py-2 border-t text-right ${isLowStock ? 'text-red-600 font-medium' : ''}`}>
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 border-t text-right">{item.minQuantity}</td>
                    <td className="px-4 py-2 border-t">{item.location || '-'}</td>
                    <td className="px-4 py-2 border-t">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border-t text-center">
                      <button 
                        onClick={() => navigate(`/inventory/${item.id}`)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: '',
    categoryId: 0,
    location: '',
    status: 'AVAILABLE'
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventoryItems();
    fetchInventoryCategories();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory-items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventoryCategories = async () => {
    try {
      const response = await fetch('/api/inventory-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'categoryId' ? parseInt(value) : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      unit: '',
      categoryId: 0,
      location: '',
      status: 'AVAILABLE'
    });
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/inventory-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchInventoryItems();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const handleEditItem = async () => {
    try {
      const response = await fetch(`/api/inventory-items/${editingItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchInventoryItems();
        setIsEditDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/inventory-items/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchInventoryItems();
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      categoryId: item.categoryId,
      location: item.location || '',
      status: item.status
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Manage your construction materials and equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No inventory items found. Add your first item to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {categories.find(cat => cat.id === item.categoryId)?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          item.status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) => handleSelectChange('categoryId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit
              </Label>
              <Input
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the item details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) => handleSelectChange('categoryId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="edit-quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-unit" className="text-right">
                Unit
              </Label>
              <Input
                id="edit-unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">
                Location
              </Label>
              <Input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditItem}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
